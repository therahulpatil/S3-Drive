import React from 'react';
import { X, CheckCircle, UploadCloud, AlertCircle } from 'lucide-react';
import { formatBytes } from '../services/s3Service';

export default function UploadProgressToast({ uploads, onClose }) {
  if (!uploads || uploads.length === 0) return null;

  const totalCount = uploads.length;
  const completedCount = uploads.filter(u => u.status === 'completed').length;

  return (
    <div className="upload-toast">
      <div className="upload-toast-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <UploadCloud size={16} style={{ color: 'var(--primary)' }} />
          <span>
            {completedCount === totalCount
              ? `${completedCount} Uploads Completed`
              : `Uploading (${completedCount}/${totalCount})`}
          </span>
        </div>
        <button className="icon-btn" onClick={onClose} style={{ padding: 0 }}>
          <X size={16} />
        </button>
      </div>

      <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
        {uploads.map((item, idx) => (
          <div key={idx} className="upload-item">
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', fontWeight: 500 }}>
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '200px' }}>
                {item.fileName}
              </span>
              <span>{formatBytes(item.size)}</span>
            </div>

            {item.status === 'uploading' && (
              <div className="storage-bar-bg" style={{ marginTop: '0.25rem' }}>
                <div
                  className="storage-bar-fill"
                  style={{ width: `${item.progress}%`, background: 'var(--primary)' }}
                />
              </div>
            )}

            {item.status === 'completed' && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: 'var(--accent-green)', fontSize: '0.75rem' }}>
                <CheckCircle size={14} />
                <span>Uploaded to S3</span>
              </div>
            )}

            {item.status === 'error' && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: 'var(--accent-red)', fontSize: '0.75rem' }}>
                <AlertCircle size={14} />
                <span>{item.error || 'Upload failed'}</span>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
