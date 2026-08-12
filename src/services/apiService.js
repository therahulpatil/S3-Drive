// Client API Service for Secure Backend Proxy Communication

const API_BASE = '/api/s3';

export const checkBackendStatus = async () => {
  try {
    const res = await fetch(`${API_BASE}/status`);
    return await res.json();
  } catch (err) {
    return { configured: false, message: 'Backend proxy offline.' };
  }
};

export const listObjectsAPI = async (prefix = '') => {
  const res = await fetch(`${API_BASE}/objects?prefix=${encodeURIComponent(prefix)}`);
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || 'Failed to list objects via backend API.');
  }
  return await res.json();
};

export const getUploadPresignedUrlAPI = async (fileName, currentPrefix, contentType) => {
  const res = await fetch(`${API_BASE}/upload-url`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ fileName, currentPrefix, contentType })
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || 'Failed to get presigned upload URL.');
  }
  return await res.json();
};

export const uploadFileDirectlyToS3 = async (file, uploadUrl) => {
  const res = await fetch(uploadUrl, {
    method: 'PUT',
    headers: {
      'Content-Type': file.type || 'application/octet-stream'
    },
    body: file
  });
  if (!res.ok) {
    throw new Error('S3 Direct Upload failed.');
  }
  return true;
};

export const getSharePresignedUrlAPI = async (key, expiresIn = 3600) => {
  const res = await fetch(`${API_BASE}/presigned-url`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ key, expiresIn })
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || 'Failed to generate presigned share URL.');
  }
  const data = await res.json();
  return data.url;
};

export const createFolderAPI = async (folderName, currentPrefix) => {
  const res = await fetch(`${API_BASE}/create-folder`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ folderName, currentPrefix })
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || 'Failed to create folder.');
  }
  return await res.json();
};

export const deleteObjectAPI = async (key) => {
  const res = await fetch(`${API_BASE}/object`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ key })
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || 'Failed to delete object.');
  }
  return await res.json();
};

export const deleteFolderAPI = async (folderKey) => {
  const res = await fetch(`${API_BASE}/folder`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ folderKey })
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || 'Failed to delete folder.');
  }
  return await res.json();
};

export const downloadFolderZipURL = (folderKey) => {
  return `${API_BASE}/download-folder?folderKey=${encodeURIComponent(folderKey)}`;
};
