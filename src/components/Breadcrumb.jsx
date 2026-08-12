import React from 'react';
import { ChevronRight, HardDrive, Download } from 'lucide-react';

export default function Breadcrumb({ currentPrefix, onNavigate, onDownloadFolder }) {
  // Split prefix into folder paths
  const parts = currentPrefix.split('/').filter(Boolean);

  const buildPath = (index) => {
    return parts.slice(0, index + 1).join('/') + '/';
  };

  return (
    <div className="breadcrumbs" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
        <button
          className={`breadcrumb-item ${parts.length === 0 ? 'active' : ''}`}
          onClick={() => onNavigate('')}
        >
          <HardDrive size={16} />
          <span>My Drive</span>
        </button>

        {parts.map((part, index) => {
          const isLast = index === parts.length - 1;
          return (
            <React.Fragment key={index}>
              <ChevronRight size={16} style={{ color: 'var(--text-muted)' }} />
              <button
                className={`breadcrumb-item ${isLast ? 'active' : ''}`}
                onClick={() => onNavigate(buildPath(index))}
              >
                {part}
              </button>
            </React.Fragment>
          );
        })}
      </div>

      {currentPrefix && (
        <button
          className="btn btn-secondary"
          style={{ padding: '0.25rem 0.65rem', fontSize: '0.75rem', marginLeft: '0.5rem' }}
          onClick={() => onDownloadFolder(currentPrefix)}
          title="Download Current Folder as ZIP"
        >
          <Download size={14} style={{ color: 'var(--primary)' }} />
          <span>Download Folder (.zip)</span>
        </button>
      )}
    </div>
  );
}
