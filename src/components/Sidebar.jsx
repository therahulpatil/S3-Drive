import React, { useState } from 'react';
import {
  FolderPlus,
  UploadCloud,
  HardDrive,
  Star,
  Clock,
  Trash2,
  Plus,
  ChevronDown,
  Cloud
} from 'lucide-react';
import { formatBytes } from '../services/s3Service';

export default function Sidebar({
  activeTab,
  setActiveTab,
  onNewFolder,
  onUploadFile,
  storageStats
}) {
  const [showNewMenu, setShowNewMenu] = useState(false);

  return (
    <aside className="sidebar">
      {/* Brand Header */}
      <div className="brand-logo">
        <div className="s3-badge-icon">
          <Cloud size={22} />
        </div>
        <div>
          <div style={{ lineHeight: 1.2 }}>Cloud Drive</div>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 500 }}>
            Secure Storage
          </div>
        </div>
      </div>

      {/* "+ New" Action Button */}
      <div style={{ position: 'relative' }}>
        <button
          className="btn-new"
          onClick={() => setShowNewMenu(!showNewMenu)}
        >
          <Plus size={20} style={{ color: 'var(--primary)' }} />
          <span>New</span>
          <ChevronDown size={16} style={{ marginLeft: 'auto', color: 'var(--text-muted)' }} />
        </button>

        {showNewMenu && (
          <div
            style={{
              position: 'absolute',
              top: '100%',
              left: 0,
              right: 0,
              background: 'var(--bg-card)',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-md)',
              boxShadow: 'var(--shadow-lg)',
              zIndex: 30,
              overflow: 'hidden',
              marginTop: '-1rem'
            }}
          >
            <button
              className="nav-item"
              onClick={() => {
                setShowNewMenu(false);
                onNewFolder();
              }}
              style={{ borderRadius: 0, padding: '0.75rem 1rem' }}
            >
              <FolderPlus size={18} style={{ color: 'var(--accent-amber)' }} />
              <span>New Folder</span>
            </button>

            <button
              className="nav-item"
              onClick={() => {
                setShowNewMenu(false);
                onUploadFile();
              }}
              style={{ borderRadius: 0, padding: '0.75rem 1rem' }}
            >
              <UploadCloud size={18} style={{ color: 'var(--primary)' }} />
              <span>Upload File</span>
            </button>
          </div>
        )}
      </div>

      {/* Navigation Menu */}
      <nav className="nav-menu">
        <button
          className={`nav-item ${activeTab === 'drive' ? 'active' : ''}`}
          onClick={() => setActiveTab('drive')}
        >
          <HardDrive size={18} />
          <span>My Drive</span>
        </button>

        <button
          className={`nav-item ${activeTab === 'starred' ? 'active' : ''}`}
          onClick={() => setActiveTab('starred')}
        >
          <Star size={18} />
          <span>Starred</span>
        </button>

        <button
          className={`nav-item ${activeTab === 'recent' ? 'active' : ''}`}
          onClick={() => setActiveTab('recent')}
        >
          <Clock size={18} />
          <span>Recent</span>
        </button>

        <button
          className={`nav-item ${activeTab === 'trash' ? 'active' : ''}`}
          onClick={() => setActiveTab('trash')}
        >
          <Trash2 size={18} />
          <span>Trash</span>
        </button>
      </nav>

      {/* Storage Widget */}
      <div className="storage-widget">
        <div className="storage-title">
          <span>Storage</span>
          <span style={{ fontFamily: 'var(--font-mono)' }}>
            {storageStats.fileCount} items
          </span>
        </div>

        <div className="storage-bar-bg">
          <div
            className="storage-bar-fill"
            style={{
              width: `${Math.min(
                100,
                Math.max(5, (storageStats.totalBytes / (50 * 1024 * 1024)) * 100)
              )}%`
            }}
          />
        </div>

        <div className="storage-text">
          {formatBytes(storageStats.totalBytes)} used
        </div>
      </div>
    </aside>
  );
}
