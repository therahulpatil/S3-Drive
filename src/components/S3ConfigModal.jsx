import React from 'react';
import {
  X,
  HardDrive,
  CheckCircle,
  Lock,
  ShieldCheck,
  Server
} from 'lucide-react';

export default function S3ConfigModal({ config, onClose, onOpenCorsGuide }) {
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal-card"
        style={{ maxWidth: '520px' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <div className="modal-title">
            <Lock size={20} style={{ color: 'var(--accent-green)' }} />
            <span>Storage Status & Security</span>
          </div>
          <button className="icon-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className="modal-body">
          <div
            style={{
              background: 'rgba(16, 185, 129, 0.1)',
              border: '1px solid var(--accent-green)',
              padding: '1.25rem',
              borderRadius: 'var(--radius-lg)',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.75rem',
              textAlign: 'center',
              alignItems: 'center'
            }}
          >
            <div
              style={{
                width: '48px',
                height: '48px',
                borderRadius: '50%',
                background: 'var(--accent-green)',
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '0.25rem'
              }}
            >
              <CheckCircle size={28} />
            </div>

            <div style={{ fontWeight: 700, fontSize: '1.1rem', color: 'var(--text-main)' }}>
              Connected & Protected
            </div>

            <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
              Your cloud storage is running securely via backend proxy API. No infrastructure credentials or bucket configurations are exposed to the client.
            </div>
          </div>

          <div style={{ marginTop: '0.5rem' }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onOpenCorsGuide}
              style={{ width: '100%', fontSize: '0.85rem' }}
            >
              <ShieldCheck size={16} style={{ color: 'var(--s3-orange)' }} />
              <span>View AWS S3 CORS Policy Guide</span>
            </button>
          </div>
        </div>

        <div className="modal-footer">
          <button type="button" className="btn btn-primary" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
