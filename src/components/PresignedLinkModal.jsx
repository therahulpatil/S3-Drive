import React, { useState, useEffect } from 'react';
import { X, Share2, Copy, Check, Clock, ShieldAlert } from 'lucide-react';
import { generateS3PresignedUrl } from '../services/s3Service';

export default function PresignedLinkModal({ file, s3Config, onClose }) {
  const [expirySeconds, setExpirySeconds] = useState(3600); // Default 1 hour
  const [signedUrl, setSignedUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState('');

  const expiryOptions = [
    { label: '15 Minutes', value: 900 },
    { label: '1 Hour', value: 3600 },
    { label: '24 Hours (1 Day)', value: 86400 },
    { label: '7 Days', value: 604800 }
  ];

  useEffect(() => {
    let isMounted = true;
    async function generate() {
      try {
        setLoading(true);
        setError('');
        const url = await generateS3PresignedUrl(s3Config, file.Key, expirySeconds);
        if (isMounted) {
          setSignedUrl(url);
        }
      } catch (err) {
        if (isMounted) {
          setError(err.message || 'Failed to generate presigned URL.');
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    generate();
    return () => { isMounted = false; };
  }, [file, s3Config, expirySeconds]);

  const handleCopy = () => {
    if (signedUrl) {
      navigator.clipboard.writeText(signedUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title">
            <Share2 size={20} style={{ color: 'var(--primary)' }} />
            <span>S3 Presigned Sharing Link</span>
          </div>
          <button className="icon-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className="modal-body">
          <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
            Generate a secure, temporary AWS S3 pre-signed URL for object:
            <strong style={{ color: 'var(--text-main)', display: 'block', marginTop: '0.25rem' }}>
              {file.name}
            </strong>
          </div>

          {/* Expiration Selector */}
          <div className="form-group">
            <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Clock size={15} />
              <span>Link Expiration Duration:</span>
            </label>
            <select
              className="form-control"
              value={expirySeconds}
              onChange={(e) => setExpirySeconds(Number(e.target.value))}
            >
              {expiryOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* URL Box */}
          <div className="form-group">
            <label className="form-label">Generated S3 URL:</label>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <input
                type="text"
                className="form-control"
                style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem' }}
                readOnly
                value={loading ? 'Generating signed URL...' : signedUrl}
              />
              <button
                className="btn btn-primary"
                onClick={handleCopy}
                disabled={loading || !signedUrl}
              >
                {copied ? <Check size={16} /> : <Copy size={16} />}
                <span>{copied ? 'Copied!' : 'Copy'}</span>
              </button>
            </div>
          </div>

          {error && (
            <div style={{ color: 'var(--accent-red)', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <ShieldAlert size={16} />
              <span>{error}</span>
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
