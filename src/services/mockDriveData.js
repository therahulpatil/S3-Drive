// Mock S3 Objects for Demo Mode when AWS credentials are not yet configured

export const MOCK_S3_OBJECTS = [
  {
    Key: 'Documents/',
    Size: 0,
    LastModified: new Date('2026-08-01T10:00:00Z'),
    StorageClass: 'STANDARD',
    isFolder: true
  },
  {
    Key: 'Documents/Project_Architecture_Specification.pdf',
    Size: 2458000, // 2.45 MB
    LastModified: new Date('2026-08-10T14:32:00Z'),
    StorageClass: 'STANDARD',
    ETag: '"a1b2c3d4e5f67890"',
    isFolder: false,
    contentType: 'application/pdf'
  },
  {
    Key: 'Documents/Cloud_Migration_Strategy.docx',
    Size: 840000, // 840 KB
    LastModified: new Date('2026-08-08T09:15:00Z'),
    StorageClass: 'INTELLIGENT_TIERING',
    ETag: '"f6e5d4c3b2a10987"',
    isFolder: false,
    contentType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  },
  {
    Key: 'Media/',
    Size: 0,
    LastModified: new Date('2026-07-25T11:20:00Z'),
    StorageClass: 'STANDARD',
    isFolder: true
  },
  {
    Key: 'Media/Banner_Design_v2.png',
    Size: 4120000, // 4.12 MB
    LastModified: new Date('2026-08-11T16:45:00Z'),
    StorageClass: 'STANDARD',
    ETag: '"9988776655443322"',
    isFolder: false,
    contentType: 'image/png',
    previewUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&q=80'
  },
  {
    Key: 'Media/Demo_Walkthrough.mp4',
    Size: 18450000, // 18.45 MB
    LastModified: new Date('2026-08-05T18:10:00Z'),
    StorageClass: 'STANDARD',
    ETag: '"123456789abcdef0"',
    isFolder: false,
    contentType: 'video/mp4'
  },
  {
    Key: 'Projects/',
    Size: 0,
    LastModified: new Date('2026-08-02T13:00:00Z'),
    StorageClass: 'STANDARD',
    isFolder: true
  },
  {
    Key: 'Projects/s3-config-template.json',
    Size: 1540,
    LastModified: new Date('2026-08-12T08:00:00Z'),
    StorageClass: 'STANDARD',
    ETag: '"conf123456789"',
    isFolder: false,
    contentType: 'application/json'
  },
  {
    Key: 'Projects/main.py',
    Size: 3420,
    LastModified: new Date('2026-08-11T11:20:00Z'),
    StorageClass: 'STANDARD',
    ETag: '"py987654321"',
    isFolder: false,
    contentType: 'text/x-python'
  },
  {
    Key: 'AWS_S3_Best_Practices.txt',
    Size: 12500,
    LastModified: new Date('2026-08-09T17:00:00Z'),
    StorageClass: 'STANDARD',
    ETag: '"txt1122334455"',
    isFolder: false,
    contentType: 'text/plain'
  },
  {
    Key: 'Dataset_Backup_2026.zip',
    Size: 45200000, // 45.2 MB
    LastModified: new Date('2026-07-20T22:15:00Z'),
    StorageClass: 'GLACIER_FLEXIBLE_RETRIEVAL',
    ETag: '"zip99887766"',
    isFolder: false,
    contentType: 'application/zip'
  }
];
