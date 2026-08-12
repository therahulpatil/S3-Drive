// S3 Configuration Storage Management

const CONFIG_KEY = 's3_drive_config_v1';
const STARRED_KEY = 's3_drive_starred_items';
const TRASH_KEY = 's3_drive_trash_items';

export const DEFAULT_CONFIG = {
  bucketName: 'therahulpatil-s3-dri-rcon1rds9z49mbwho9zdezjgojrkqaps3b-s3alias',
  region: 'ap-south-1',
  accessKeyId: '',
  secretAccessKey: '',
  endpoint: '',
  forcePathStyle: false,
  isDemoMode: false,
  useBackendProxy: false
};

export const getS3Config = () => {
  try {
    const saved = localStorage.getItem(CONFIG_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      // Ensure real bucket alias is maintained
      if (!parsed.bucketName || parsed.bucketName.includes('your-s3-bucket')) {
        parsed.bucketName = DEFAULT_CONFIG.bucketName;
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
    localStorage.setItem(STARRED_KEY, JSON.stringify(starredKeys));
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
