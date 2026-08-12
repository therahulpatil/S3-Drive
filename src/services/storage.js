// S3 Configuration Storage Management

const CONFIG_KEY = 's3_drive_config_v1';
const STARRED_KEY = 's3_drive_starred_items';
const TRASH_KEY = 's3_drive_trash_items';

export const DEFAULT_CONFIG = {
  bucketName: 'your-s3-bucket-or-access-point-alias',
  region: 'ap-south-1',
  accessKeyId: '',
  secretAccessKey: '',
  endpoint: '',
  forcePathStyle: false,
  isDemoMode: true,
  useBackendProxy: false
};

export const getS3Config = () => {
  try {
    const saved = localStorage.getItem(CONFIG_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      // Clean stale dummy keys or specific personal alias defaults
      if (parsed.accessKeyId === 'YOUR_S3_DRIVE_ACCESS_KEY_ID' || parsed.accessKeyId === 'AKIA...') {
        parsed.accessKeyId = '';
        parsed.secretAccessKey = '';
      }
      return { ...DEFAULT_CONFIG, ...parsed };
    }
  } catch (e) {
    console.error('Failed to load S3 config from localStorage:', e);
  }
  return DEFAULT_CONFIG;
};

export const saveS3Config = (config) => {
  try {
    localStorage.setItem(CONFIG_KEY, JSON.stringify(config));
  } catch (e) {
    console.error('Failed to save S3 config to localStorage:', e);
  }
};

export const getStarredKeys = () => {
  try {
    const saved = localStorage.getItem(STARRED_KEY);
    return saved ? JSON.parse(saved) : [];
  } catch (e) {
    return [];
  }
};

export const saveStarredKeys = (starredKeys) => {
  try {
    saveStarredKeys(starredKeys);
  } catch (e) {
    console.error('Failed to save starred items:', e);
  }
};

export const getTrashKeys = () => {
  try {
    const saved = localStorage.getItem(TRASH_KEY);
    return saved ? JSON.parse(saved) : [];
  } catch (e) {
    return [];
  }
};

export const saveTrashKeys = (trashKeys) => {
  try {
    localStorage.setItem(TRASH_KEY, JSON.stringify(trashKeys));
  } catch (e) {
    console.error('Failed to save trash items:', e);
  }
};
