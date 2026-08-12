import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  S3Client,
  ListObjectsV2Command,
  PutObjectCommand,
  DeleteObjectCommand,
  DeleteObjectsCommand,
  GetObjectCommand
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import JSZip from 'jszip';

// Load server environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Server-side S3 Configuration (Secret Keys stay 100% on the server)
const bucketName = process.env.AWS_BUCKET_NAME || process.env.VITE_AWS_BUCKET_NAME || 'therahulpatil-s3-dri-rcon1rds9z49mbwho9zdezjgojrkqaps3b-s3alias';
const region = process.env.AWS_REGION || process.env.VITE_AWS_REGION || 'ap-south-1';
const accessKeyId = process.env.AWS_ACCESS_KEY_ID || process.env.VITE_AWS_ACCESS_KEY_ID || '';
const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY || process.env.VITE_AWS_SECRET_ACCESS_KEY || '';
const endpoint = process.env.AWS_ENDPOINT || process.env.VITE_AWS_ENDPOINT || '';

let s3Client = null;

function getClient() {
  if (!accessKeyId || !secretAccessKey) {
    return null;
  }
  if (!s3Client) {
    const opts = {
      region,
      credentials: {
        accessKeyId: accessKeyId.trim(),
        secretAccessKey: secretAccessKey.trim()
      },
      useArnRegion: true
    };
    if (endpoint) {
      opts.endpoint = endpoint.trim();
      opts.forcePathStyle = true;
    }
    s3Client = new S3Client(opts);
  }
  return s3Client;
}

// 1. Health & Connection Status API
app.get('/api/s3/status', async (req, res) => {
  const client = getClient();
  if (!client) {
    return res.json({
      configured: false,
      bucketName,
      region,
      message: 'AWS Credentials not set on server. Running in Demo Mode.'
    });
  }

  try {
    const cmd = new ListObjectsV2Command({ Bucket: bucketName, MaxKeys: 1 });
    await client.send(cmd);
    res.json({
      configured: true,
      success: true,
      bucketName,
      region,
      message: `Connected securely to AWS S3 bucket/access point "${bucketName}"!`
    });
  } catch (err) {
    res.status(500).json({
      configured: true,
      success: false,
      bucketName,
      message: err.message
    });
  }
});

// 2. List S3 Objects API
app.get('/api/s3/objects', async (req, res) => {
  const currentPrefix = req.query.prefix || '';
  let prefix = currentPrefix;
  if (prefix && !prefix.endsWith('/')) {
    prefix += '/';
  }

  const client = getClient();
  if (!client) {
    return res.status(400).json({ error: 'Server AWS credentials missing.' });
  }

  try {
    // 1. Fetch current directory items (files & subfolder prefixes)
    const command = new ListObjectsV2Command({
      Bucket: bucketName,
      Prefix: prefix,
      Delimiter: '/'
    });
    const response = await client.send(command);

    // 2. Fetch all child objects under prefix to calculate folder sizes
    const allCommand = new ListObjectsV2Command({
      Bucket: bucketName,
      Prefix: prefix
    });
    const allResponse = await client.send(allCommand);
    const allContents = allResponse.Contents || [];

    const folderMap = new Map();

    // 1. Add CommonPrefixes (virtual directory paths)
    (response.CommonPrefixes || []).forEach(cp => {
      const folderKey = cp.Prefix;
      const name = folderKey.slice(prefix.length).replace(/\/$/, '');
      if (name) {
        folderMap.set(folderKey, name);
      }
    });

    // 2. Add explicit folder objects ending in "/" (e.g. "Sunbeam/") from response.Contents
    (response.Contents || []).forEach(item => {
      if (item.Key !== prefix && item.Key.endsWith('/')) {
        const folderKey = item.Key;
        const relative = folderKey.slice(prefix.length);
        const name = relative.split('/')[0];
        if (name) {
          const fullFolderKey = `${prefix}${name}/`;
          folderMap.set(fullFolderKey, name);
        }
      }
    });

    const folders = Array.from(folderMap.entries()).map(([folderKey, name]) => {
      const childFiles = allContents.filter(item => item.Key.startsWith(folderKey) && item.Key !== folderKey && !item.Key.endsWith('/'));
      const folderSize = childFiles.reduce((sum, item) => sum + (item.Size || 0), 0);

      return {
        Key: folderKey,
        name: name,
        isFolder: true,
        Size: folderSize,
        fileCount: childFiles.length,
        LastModified: new Date(),
        StorageClass: 'DIRECTORY'
      };
    });

    const files = await Promise.all(
      (response.Contents || [])
        .filter(item => item.Key !== prefix && !item.Key.endsWith('/'))
        .map(async item => {
          const name = item.Key.slice(prefix.length);
          const ext = name.split('.').pop().toLowerCase();
          let previewUrl = null;

          if (['png', 'jpg', 'jpeg', 'gif', 'svg', 'webp'].includes(ext)) {
            try {
              const getCmd = new GetObjectCommand({
                Bucket: bucketName,
                Key: item.Key
              });
              previewUrl = await getSignedUrl(client, getCmd, { expiresIn: 3600 });
            } catch (e) {
              console.error('Failed to generate preview URL for', item.Key, e);
            }
          }

          return {
            ...item,
            name,
            isFolder: false,
            previewUrl
          };
        })
    );

    res.json({ folders, files, bucketName });
  } catch (err) {
    console.error('API List Error:', err);
    res.status(500).json({ error: err.message });
  }
});

// 3. Generate Presigned Upload URL API (Client uploads directly to S3 without secret keys)
app.post('/api/s3/upload-url', async (req, res) => {
  const { fileName, currentPrefix, contentType } = req.body;
  let prefix = currentPrefix || '';
  if (prefix && !prefix.endsWith('/')) {
    prefix += '/';
  }

  const key = `${prefix}${fileName}`;
  const client = getClient();

  if (!client) {
    return res.status(400).json({ error: 'Server AWS credentials missing.' });
  }

  try {
    const command = new PutObjectCommand({
      Bucket: bucketName,
      Key: key,
      ContentType: contentType || 'application/octet-stream'
    });

    const uploadUrl = await getSignedUrl(client, command, { expiresIn: 900 }); // 15 mins
    res.json({ uploadUrl, key });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 4. Generate Presigned Share / View URL API
app.post('/api/s3/presigned-url', async (req, res) => {
  const { key, expiresIn = 3600 } = req.body;
  const client = getClient();

  if (!client) {
    return res.status(400).json({ error: 'Server AWS credentials missing.' });
  }

  try {
    const command = new GetObjectCommand({
      Bucket: bucketName,
      Key: key
    });

    const url = await getSignedUrl(client, command, { expiresIn: Number(expiresIn) });
    res.json({ url, key, expiresIn });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 5. Create Virtual Folder API
app.post('/api/s3/create-folder', async (req, res) => {
  const { folderName, currentPrefix } = req.body;
  let prefix = currentPrefix || '';
  if (prefix && !prefix.endsWith('/')) {
    prefix += '/';
  }

  const cleanFolderName = folderName.trim().replace(/\/$/, '');
  const key = `${prefix}${cleanFolderName}/`;

  const client = getClient();
  if (!client) {
    return res.status(400).json({ error: 'Server AWS credentials missing.' });
  }

  try {
    const command = new PutObjectCommand({
      Bucket: bucketName,
      Key: key,
      Body: new Uint8Array(0)
    });

    await client.send(command);
    res.json({ success: true, key });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 6. Delete File Object API
app.delete('/api/s3/object', async (req, res) => {
  const { key } = req.body;
  const client = getClient();

  if (!client) {
    return res.status(400).json({ error: 'Server AWS credentials missing.' });
  }

  try {
    const command = new DeleteObjectCommand({
      Bucket: bucketName,
      Key: key
    });

    await client.send(command);
    res.json({ success: true, key });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 7. Delete Folder Recursively API
app.delete('/api/s3/folder', async (req, res) => {
  const { folderKey } = req.body;
  const client = getClient();

  if (!client) {
    return res.status(400).json({ error: 'Server AWS credentials missing.' });
  }

  try {
    const listCmd = new ListObjectsV2Command({
      Bucket: bucketName,
      Prefix: folderKey
    });
    const listRes = await client.send(listCmd);
    const objectsToDelete = (listRes.Contents || []).map(obj => ({ Key: obj.Key }));

    if (objectsToDelete.length > 0) {
      const deleteCmd = new DeleteObjectsCommand({
        Bucket: bucketName,
        Delete: { Objects: objectsToDelete }
      });
      await client.send(deleteCmd);
    } else {
      await client.send(new DeleteObjectCommand({ Bucket: bucketName, Key: folderKey }));
    }

    res.json({ success: true, folderKey, deletedCount: objectsToDelete.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 8. Download Folder ZIP API
app.get('/api/s3/download-folder', async (req, res) => {
  const { folderKey } = req.query;
  const client = getClient();

  if (!client) {
    return res.status(400).json({ error: 'Server AWS credentials missing.' });
  }

  try {
    const listCmd = new ListObjectsV2Command({
      Bucket: bucketName,
      Prefix: folderKey
    });
    const listRes = await client.send(listCmd);
    const files = (listRes.Contents || []).filter(item => !item.Key.endsWith('/'));

    const zip = new JSZip();
    for (const file of files) {
      const getCmd = new GetObjectCommand({ Bucket: bucketName, Key: file.Key });
      const itemRes = await client.send(getCmd);
      const bytes = await itemRes.Body.transformToByteArray();
      const relativePath = file.Key.slice(folderKey.length);
      zip.file(relativePath, bytes);
    }

    const zipBuffer = await zip.generateAsync({ type: 'nodebuffer' });
    const folderParts = folderKey.replace(/\/$/, '').split('/');
    const folderName = folderParts[folderParts.length - 1] || 'folder';

    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', `attachment; filename="${folderName}.zip"`);
    res.send(zipBuffer);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Serve frontend dist bundle in production mode
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, 'dist')));
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'dist', 'index.html'));
  });
}

app.listen(PORT, () => {
  console.log(`🔒 Secure S3 Drive Proxy API running on port ${PORT}`);
  console.log(`Bucket: ${bucketName} | Region: ${region}`);
});
