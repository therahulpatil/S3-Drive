import {
  S3Client,
  ListObjectsV2Command,
  PutObjectCommand,
  DeleteObjectCommand,
  DeleteObjectsCommand,
  GetObjectCommand,
  HeadBucketCommand,
  CopyObjectCommand
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import JSZip from 'jszip';
import { MOCK_S3_OBJECTS } from './mockDriveData';
import {
  listObjectsAPI,
  getUploadPresignedUrlAPI,
  uploadFileDirectlyToS3,
  getSharePresignedUrlAPI,
  createFolderAPI,
  deleteObjectAPI,
  deleteFolderAPI,
  downloadFolderZipURL
} from './apiService';

// Cache client instances for efficiency
let currentClient = null;
let currentClientConfig = null;

export const getS3Client = (config) => {
  if (!config.accessKeyId || !config.secretAccessKey) {
    return null;
  }

  const configKey = JSON.stringify({
    region: config.region,
    accessKeyId: config.accessKeyId,
    endpoint: config.endpoint,
    forcePathStyle: config.forcePathStyle
  });

  if (currentClient && currentClientConfig === configKey) {
    return currentClient;
  }

  const clientOptions = {
    region: config.region || 'ap-south-1',
    credentials: {
      accessKeyId: config.accessKeyId.trim(),
      secretAccessKey: config.secretAccessKey.trim()
    },
    useArnRegion: true
  };

  if (config.endpoint && config.endpoint.trim()) {
    clientOptions.endpoint = config.endpoint.trim();
    clientOptions.forcePathStyle = config.forcePathStyle || true;
  }

  currentClient = new S3Client(clientOptions);
  currentClientConfig = configKey;
  return currentClient;
};

/**
 * Tests connection to AWS S3 bucket
 */
export const testS3Connection = async (config) => {
  if (config.isDemoMode) {
    return { success: true, message: 'Demo Mode is active. Using simulated S3 storage.' };
  }

  if (!config.bucketName) {
    throw new Error('Please specify an S3 Bucket Name.');
  }

  if (!config.accessKeyId || !config.secretAccessKey) {
    throw new Error('Please enter your AWS Access Key ID and Secret Access Key.');
  }

  try {
    const client = getS3Client(config);
    const command = new ListObjectsV2Command({
      Bucket: config.bucketName,
      MaxKeys: 1
    });

    await client.send(command);
    return {
      success: true,
      message: `Successfully connected to S3 bucket "${config.bucketName}" in region ${config.region || 'ap-south-1'}!`
    };
  } catch (error) {
    console.error('S3 Connection error:', error);
    let errorMessage = error.message || 'Failed to connect to S3.';
    
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      errorMessage = 'CORS Error: S3 bucket rejected browser request. Please configure CORS in AWS S3 Console.';
    } else if (error.name === 'AccessDenied' || error.$metadata?.httpStatusCode === 403) {
      errorMessage = 'Access Denied: Invalid AWS credentials or bucket permissions.';
    } else if (error.name === 'NoSuchBucket' || error.$metadata?.httpStatusCode === 404) {
      errorMessage = `Bucket "${config.bucketName}" not found. Verify bucket name and region.`;
    }

    return {
      success: false,
      message: errorMessage,
      error
    };
  }
};

/**
 * Lists S3 objects for a given prefix (directory)
 */
export const listS3Objects = async (config, currentPrefix = '') => {
  let prefix = currentPrefix;
  if (prefix && !prefix.endsWith('/')) {
    prefix += '/';
  }

  // Handle Backend Proxy Mode
  if (config.useBackendProxy) {
    try {
      const data = await listObjectsAPI(prefix);
      return {
        folders: data.folders || [],
        files: (data.files || []).map(f => ({ ...f, contentType: detectContentType(f.name) })),
        rawObjects: [...(data.folders || []), ...(data.files || [])]
      };
    } catch (err) {
      console.warn('Backend proxy list failed, falling back to demo mode:', err);
      return formatS3ListResults(MOCK_S3_OBJECTS, prefix);
    }
  }

  // Handle Direct Client S3 Mode / Demo Mode
  if (config.isDemoMode || !config.accessKeyId) {
    return formatS3ListResults(MOCK_S3_OBJECTS, prefix);
  }

  try {
    const client = getS3Client(config);
    const command = new ListObjectsV2Command({
      Bucket: config.bucketName,
      Prefix: prefix,
      Delimiter: '/'
    });
    const response = await client.send(command);
    return formatS3ListResults(response.Contents || [], prefix);
  } catch (err) {
    console.warn('Direct S3 list failed, falling back to demo mode:', err);
    return formatS3ListResults(MOCK_S3_OBJECTS, prefix);
  }
};

/**
 * Uploads a file to S3
 */
export const uploadS3Object = async (config, file, currentPrefix = '', onProgress = () => {}) => {
  let prefix = currentPrefix;
  if (prefix && !prefix.endsWith('/')) {
    prefix += '/';
  }

  const key = `${prefix}${file.name}`;
  const contentType = file.type || detectContentType(file.name);

  // Backend Proxy Mode: Get presigned PUT URL and upload directly to S3 without secret keys
  if (config.useBackendProxy) {
    const { uploadUrl } = await getUploadPresignedUrlAPI(file.name, currentPrefix, contentType);
    await uploadFileDirectlyToS3(file, uploadUrl);
    return {
      Key: key,
      Size: file.size,
      LastModified: new Date(),
      StorageClass: 'STANDARD',
      contentType
    };
  }

  if (config.isDemoMode || !config.accessKeyId) {
    // Simulate upload in demo mode
    await new Promise(resolve => setTimeout(resolve, 800));
    const newMock = {
      Key: key,
      Size: file.size,
      LastModified: new Date(),
      StorageClass: 'STANDARD',
      ETag: `"${Math.random().toString(36).substring(2)}"`,
      isFolder: false,
      contentType
    };
    MOCK_S3_OBJECTS.push(newMock);
    return newMock;
  }

  try {
    const client = getS3Client(config);
    const arrayBuffer = await file.arrayBuffer();
    const command = new PutObjectCommand({
      Bucket: config.bucketName,
      Key: key,
      Body: new Uint8Array(arrayBuffer),
      ContentType: contentType
    });

    await client.send(command);
    return {
      Key: key,
      Size: file.size,
      LastModified: new Date(),
      StorageClass: 'STANDARD',
      contentType
    };
  } catch (error) {
    console.error(`Failed to upload ${file.name}:`, error);
    throw error;
  }
};

/**
 * Creates a virtual folder in S3 (object key ending with '/')
 */
export const createS3Folder = async (config, folderName, currentPrefix = '') => {
  let prefix = currentPrefix;
  if (prefix && !prefix.endsWith('/')) {
    prefix += '/';
  }

  const cleanFolderName = folderName.trim().replace(/\/$/, '');
  const key = `${prefix}${cleanFolderName}/`;

  if (config.useBackendProxy) {
    const res = await createFolderAPI(folderName, currentPrefix);
    return res.key;
  }

  if (config.isDemoMode || !config.accessKeyId) {
    MOCK_S3_OBJECTS.push({
      Key: key,
      Size: 0,
      LastModified: new Date(),
      StorageClass: 'STANDARD',
      isFolder: true
    });
    return key;
  }

  try {
    const client = getS3Client(config);
    const command = new PutObjectCommand({
      Bucket: config.bucketName,
      Key: key,
      Body: new Uint8Array(0)
    });

    await client.send(command);
    return key;
  } catch (error) {
    console.error('Failed to create S3 folder:', error);
    throw error;
  }
};

/**
 * Deletes a single file object from S3
 */
export const deleteS3Object = async (config, key) => {
  if (config.useBackendProxy) {
    await deleteObjectAPI(key);
    return true;
  }

  if (config.isDemoMode || !config.accessKeyId) {
    const index = MOCK_S3_OBJECTS.findIndex(item => item.Key === key);
    if (index !== -1) {
      MOCK_S3_OBJECTS.splice(index, 1);
    }
    return true;
  }

  try {
    const client = getS3Client(config);
    const command = new DeleteObjectCommand({
      Bucket: config.bucketName,
      Key: key
    });

    await client.send(command);
    return true;
  } catch (error) {
    console.error(`Failed to delete S3 object ${key}:`, error);
    let msg = error.message || 'Failed to delete object from S3.';
    if (error.name === 'AccessDenied' || error.$metadata?.httpStatusCode === 403) {
      msg = 'Access Denied: Your AWS IAM credentials lack s3:DeleteObject permission.';
    }
    throw new Error(msg);
  }
};

/**
 * Recursively deletes a folder and all child objects underneath its prefix from S3
 */
export const deleteS3Folder = async (config, folderKey) => {
  if (config.useBackendProxy) {
    await deleteFolderAPI(folderKey);
    return true;
  }

  if (config.isDemoMode || !config.accessKeyId) {
    for (let i = MOCK_S3_OBJECTS.length - 1; i >= 0; i--) {
      if (MOCK_S3_OBJECTS[i].Key.startsWith(folderKey)) {
        MOCK_S3_OBJECTS.splice(i, 1);
      }
    }
    return true;
  }

  try {
    const client = getS3Client(config);
    const listCmd = new ListObjectsV2Command({
      Bucket: config.bucketName,
      Prefix: folderKey
    });
    const listRes = await client.send(listCmd);
    const objectsToDelete = (listRes.Contents || []).map(obj => ({ Key: obj.Key }));

    if (objectsToDelete.length === 0) {
      await client.send(new DeleteObjectCommand({ Bucket: config.bucketName, Key: folderKey }));
      return true;
    }

    const deleteCmd = new DeleteObjectsCommand({
      Bucket: config.bucketName,
      Delete: { Objects: objectsToDelete }
    });

    await client.send(deleteCmd);
    return true;
  } catch (error) {
    console.error(`Failed to delete S3 folder ${folderKey}:`, error);
    let msg = error.message || 'Failed to delete folder from S3.';
    if (error.name === 'AccessDenied' || error.$metadata?.httpStatusCode === 403) {
      msg = 'Access Denied: Your AWS IAM credentials lack s3:DeleteObject permission.';
    }
    throw new Error(msg);
  }
};

/**
 * Generates a presigned temporary URL for viewing/downloading an object
 */
export const generateS3PresignedUrl = async (config, key, expiresInSeconds = 3600) => {
  if (config.useBackendProxy) {
    return await getSharePresignedUrlAPI(key, expiresInSeconds);
  }

  if (config.isDemoMode || !config.accessKeyId) {
    const item = MOCK_S3_OBJECTS.find(i => i.Key === key);
    if (item && item.previewUrl) return item.previewUrl;
    return `https://demo-s3-bucket.s3.amazonaws.com/${encodeURIComponent(key)}?X-Amz-Expires=${expiresInSeconds}&demo=true`;
  }

  try {
    const client = getS3Client(config);
    const command = new GetObjectCommand({
      Bucket: config.bucketName,
      Key: key
    });

    const url = await getSignedUrl(client, command, { expiresIn: expiresInSeconds });
    return url;
  } catch (error) {
    console.error(`Failed to generate presigned URL for ${key}:`, error);
    throw error;
  }
};

/**
 * Helper to format mock object list filtering by prefix
 */
function formatS3ListResults(items, prefix) {
  const folderSet = new Set();
  const files = [];

  items.forEach(item => {
    if (!item.Key.startsWith(prefix)) return;
    const relativeKey = item.Key.slice(prefix.length);
    if (!relativeKey) return;

    const parts = relativeKey.split('/');
    if (parts.length > 1) {
      // It's inside a subfolder
      const folderName = parts[0];
      folderSet.add(folderName);
    } else if (!item.isFolder && relativeKey.length > 0) {
      files.push({
        ...item,
        name: relativeKey,
        contentType: item.contentType || detectContentType(relativeKey)
      });
    }
  });

  const folders = Array.from(folderSet).map(name => {
    const folderKey = `${prefix}${name}/`;
    const childFiles = items.filter(item => item.Key.startsWith(folderKey) && !item.isFolder);
    const folderSize = childFiles.reduce((sum, item) => sum + (item.Size || 0), 0);

    return {
      Key: folderKey,
      name,
      isFolder: true,
      Size: folderSize,
      fileCount: childFiles.length,
      LastModified: new Date(),
      StorageClass: 'DIRECTORY'
    };
  });

  return { folders, files, rawObjects: [...folders, ...files] };
}

/**
 * Auto-detects content type by file extension
 */
export function detectContentType(fileName) {
  const ext = fileName.split('.').pop().toLowerCase();
  const mimeTypes = {
    png: 'image/png',
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    gif: 'image/gif',
    svg: 'image/svg+xml',
    webp: 'image/webp',
    pdf: 'application/pdf',
    txt: 'text/plain',
    html: 'text/html',
    css: 'text/css',
    js: 'application/javascript',
    json: 'application/json',
    py: 'text/x-python',
    mp4: 'video/mp4',
    webm: 'video/webm',
    mp3: 'audio/mpeg',
    wav: 'audio/wav',
    zip: 'application/zip',
    docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  };
  return mimeTypes[ext] || 'application/octet-stream';
}

/**
 * Formats byte size into human readable string (KB, MB, GB)
 */
export function formatBytes(bytes, decimals = 2) {
  if (!bytes || bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

/**
 * Recursively fetches all objects under folderKey and downloads them as a single .zip file
 */
export const downloadFolderAsZip = async (config, folderKey, onProgress = () => {}) => {
  const zip = new JSZip();
  const folderParts = folderKey.replace(/\/$/, '').split('/');
  const folderName = folderParts[folderParts.length - 1] || 'folder_download';

  let objectsToDownload = [];

  if (config.isDemoMode || !config.accessKeyId) {
    objectsToDownload = MOCK_S3_OBJECTS.filter(
      item => item.Key.startsWith(folderKey) && !item.isFolder && item.Key !== folderKey
    );
  } else {
    const client = getS3Client(config);
    const command = new ListObjectsV2Command({
      Bucket: config.bucketName,
      Prefix: folderKey
    });

    const response = await client.send(command);
    objectsToDownload = (response.Contents || []).filter(item => !item.Key.endsWith('/'));
  }

  if (objectsToDownload.length === 0) {
    throw new Error(`Folder "${folderName}" is empty or has no files to download.`);
  }

  const total = objectsToDownload.length;

  for (let i = 0; i < total; i++) {
    const item = objectsToDownload[i];
    const relativePath = item.Key.slice(folderKey.length);

    onProgress({
      current: i + 1,
      total,
      fileName: relativePath,
      percentage: Math.round(((i + 1) / total) * 100)
    });

    try {
      let fileData;
      if (config.isDemoMode || !config.accessKeyId) {
        const content = `Demo S3 File Content for ${item.Key}\nSize: ${item.Size} bytes\nDownloaded via S3 CloudDrive Zip Generator`;
        fileData = new TextEncoder().encode(content);
      } else {
        const client = getS3Client(config);
        const getCmd = new GetObjectCommand({
          Bucket: config.bucketName,
          Key: item.Key
        });
        const res = await client.send(getCmd);
        fileData = await res.Body.transformToByteArray();
      }

      zip.file(relativePath, fileData);
    } catch (err) {
      console.error(`Failed to download ${item.Key} into ZIP:`, err);
    }
  }

  const zipBlob = await zip.generateAsync({ type: 'blob' }, (metadata) => {
    onProgress({
      current: total,
      total,
      fileName: 'Generating ZIP archive...',
      percentage: Math.round(metadata.percent)
    });
  });

  const url = URL.createObjectURL(zipBlob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${folderName}.zip`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);

  return `${folderName}.zip`;
};
