import React, { useState, useEffect } from 'react';
import {
  X,
  Download,
  Share2,
  HardDrive,
  Copy,
  Check,
  ExternalLink,
  Code
} from 'lucide-react';
import { formatBytes, generateS3PresignedUrl } from '../services/s3Service';

export default function FilePreviewModal({ file, s3Config, onClose, onShareLink }) {
  const [presignedUrl, setPresignedUrl] = useState(file.previewUrl || '');
  const [loadingUrl, setLoadingUrl] = useState(!file.previewUrl);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let isMounted = true;
    async function loadUrl() {
      try {
        setLoadingUrl(true);
        const url = await generateS3PresignedUrl(s3Config, file.Key, 3600);
        if (isMounted) {
          setPresignedUrl(url);
        }
      } catch (err) {
        console.error('Failed to get preview URL:', err);
      } finally {
        if (isMounted) setLoadingUrl(false);
      }
    }

    if (!file.previewUrl) {
      loadUrl();
    }
    return () => { isMounted = false; };
  }, [file, s3Config]);

  const copyUrl = () => {
    if (presignedUrl) {
      navigator.clipboard.writeText(presignedUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const ext = file.name.split('.').pop().toLowerCase();
  const isImage = ['png', 'jpg', 'jpeg', 'gif', 'svg', 'webp'].includes(ext);
  const isVideo = ['mp4', 'webm', 'ogg'].includes(ext);
  const isAudio = ['mp3', 'wav'].includes(ext);
  const isText = ['txt', 'json', 'js', 'py', 'html', 'css', 'md'].includes(ext);

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal-card"
        style={{ maxWidth: '720px' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <div className="modal-title">
            <HardDrive size={20} style={{ color: 'var(--s3-orange)' }} />
            <span>{file.name}</span>
          </div>
          <button className="icon-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className="modal-body">
          {/* Main Preview Container */}
          <div
            style={{
              background: 'var(--bg-sidebar)',
              borderRadius: 'var(--radius-md)',
              minHeight: '220px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              overflow: 'hidden',
              border: '1px solid var(--border-color)'
            }}
          >
            {loadingUrl ? (
              <div style={{ color: 'var(--text-muted)' }}>Generating S3 presigned preview...</div>
            ) : isImage && presignedUrl ? (
              <img
                src={presignedUrl}
                alt={file.name}
                style={{ maxWidth: '100%', maxHeight: '380px', objectFit: 'contain' }}
              />
            ) : isVideo && presignedUrl ? (
              <video controls style={{ width: '100%', maxHeight: '380px' }}>
                <source src={presignedUrl} type={file.contentType} />
                Your browser does not support HTML video.
              </video>
            ) : isAudio && presignedUrl ? (
              <audio controls style={{ width: '80%' }}>
                <source src={presignedUrl} type={file.contentType} />
              </audio>
            ) : isText ? (
              <div className="code-block" style={{ width: '100%', maxHeight: '300px' }}>
                {`// S3 Object Key: ${file.Key}\n// Content-Type: ${file.contentType || 'text/plain'}\n\n[File contents can be fetched directly via S3 presigned URL]` }
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                <Code size={40} style={{ opacity: 0.5, marginBottom: '0.5rem' }} />
                <div>Preview not available directly in browser</div>
                <div style={{ fontSize: '0.8rem', marginTop: '0.25rem' }}>
                  Use Download or Presigned Share Link to access file
                </div>
              </div>
            )}
          </div>

          {/* S3 Metadata Grid */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '0.75rem',
              fontSize: '0.85rem',
              background: 'var(--bg-main)',
              padding: '1rem',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-color)'
            }}
          >
            <div>
              <span className="form-label">S3 Object Key:</span>
              <div style={{ fontFamily: 'var(--font-mono)', wordBreak: 'break-all' }}>
                {file.Key}
              </div>
            </div>

            <div>
              <span className="form-label">Storage Class:</span>
              <div>
                <span className="s3-class-badge">{file.StorageClass || 'STANDARD'}</span>
              </div>
            </div>

            <div>
              <span className="form-label">Size:</span>
              <div style={{ fontFamily: 'var(--font-mono)' }}>{formatBytes(file.Size)}</div>
            </div>

            <div>
              <span className="form-label">ETag / Hash:</span>
              <div style={{ fontFamily: 'var(--font-mono)' }}>{file.ETag || '—'}</div>
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={() => onShareLink(file)}>
            <Share2 size={16} />
            <span>Share Link</span>
          </button>

          {presignedUrl && (
            <a
              href={presignedUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-primary"
              download={file.name}
            >
              <Download size={16} />
              <span>Download Object</span>
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
