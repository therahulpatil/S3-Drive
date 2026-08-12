import React from 'react';
import { UploadCloud } from 'lucide-react';

export default function DragDropOverlay({ isDragging }) {
  if (!isDragging) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(37, 99, 235, 0.85)',
        backdropFilter: 'blur(8px)',
        zIndex: 200,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'white',
        animation: 'fadeIn 0.15s ease',
        pointerEvents: 'none'
      }}
    >
      <div
        style={{
          border: '3px dashed rgba(255, 255, 255, 0.8)',
          borderRadius: 'var(--radius-lg)',
          padding: '4rem 6rem',
          textAlign: 'center',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '1rem'
        }}
      >
        <UploadCloud size={64} />
        <div style={{ fontSize: '1.75rem', fontWeight: 700 }}>
          Drop files to upload to S3 Bucket
        </div>
        <div style={{ fontSize: '1rem', opacity: 0.9 }}>
          Objects will be placed under current prefix path
        </div>
      </div>
    </div>
  );
}
