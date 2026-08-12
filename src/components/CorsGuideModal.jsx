import React, { useState } from 'react';
import { X, ShieldCheck, Copy, Check, ExternalLink } from 'lucide-react';

export default function CorsGuideModal({ onClose }) {
  const [copied, setCopied] = useState(false);

  const corsJson = JSON.stringify(
    [
      {
        "AllowedHeaders": ["*"],
        "AllowedMethods": ["GET", "PUT", "POST", "DELETE", "HEAD"],
        "AllowedOrigins": ["*"],
        "ExposeHeaders": ["ETag", "x-amz-server-side-encryption"]
      }
    ],
    null,
    2
  );

  const handleCopy = () => {
    navigator.clipboard.writeText(corsJson);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal-card"
        style={{ maxWidth: '640px' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <div className="modal-title">
            <ShieldCheck size={20} style={{ color: 'var(--s3-orange)' }} />
            <span>AWS S3 CORS Configuration Guide</span>
          </div>
          <button className="icon-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className="modal-body">
          <div style={{ fontSize: '0.875rem', lineHeight: 1.6 }}>
            Web browsers require S3 buckets to have <strong>Cross-Origin Resource Sharing (CORS)</strong> enabled to allow direct file uploads and listing.
          </div>

          <div style={{ fontWeight: 600, fontSize: '0.9rem', marginTop: '0.5rem' }}>
            Steps to enable in AWS Console:
          </div>

          <ol style={{ paddingLeft: '1.25rem', fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>
            <li>Open AWS Management Console & navigate to <strong>S3 Buckets</strong>.</li>
            <li>Select your bucket or Access Point: <code>therahulpatil-s3-dri-rcon1rds9z49mbwho9zdezjgojrkqaps3b-s3alias</code></li>
            <li>Click on the <strong>Permissions</strong> tab.</li>
            <li>Scroll down to <strong>Cross-origin resource sharing (CORS)</strong> and click <strong>Edit</strong>.</li>
            <li>Paste the JSON policy below and click <strong>Save changes</strong>.</li>
          </ol>

          {/* Code block with copy button */}
          <div style={{ position: 'relative', marginTop: '0.5rem' }}>
            <div className="code-block" style={{ fontSize: '0.8rem' }}>
              {corsJson}
            </div>
            <button
              className="btn btn-primary"
              style={{
                position: 'absolute',
                top: '0.5rem',
                right: '0.5rem',
                padding: '0.35rem 0.75rem',
                fontSize: '0.75rem'
              }}
              onClick={handleCopy}
            >
              {copied ? <Check size={14} /> : <Copy size={14} />}
              <span>{copied ? 'Copied JSON' : 'Copy JSON'}</span>
            </button>
          </div>
        </div>

        <div className="modal-footer">
          <a
            href="https://docs.aws.amazon.com/AmazonS3/latest/userguide/ManagePolicyAWSConsole.html"
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-secondary"
            style={{ marginRight: 'auto' }}
          >
            <span>AWS CORS Documentation</span>
            <ExternalLink size={14} />
          </a>
          <button className="btn btn-primary" onClick={onClose}>
            Got it
          </button>
        </div>
      </div>
    </div>
  );
}
