import React from 'react';
import {
  Folder,
  FileText,
  Image as ImageIcon,
  Film,
  Music,
  Code,
  Archive,
  Star,
  MoreVertical,
  Share2,
  Download,
  Trash2,
  Eye
} from 'lucide-react';
import { formatBytes } from '../services/s3Service';

export function getFileIcon(fileName, isFolder) {
  if (isFolder) return <Folder size={24} style={{ color: '#f59e0b' }} />;

  const ext = fileName.split('.').pop().toLowerCase();
  if (['png', 'jpg', 'jpeg', 'gif', 'svg', 'webp'].includes(ext)) {
    return <ImageIcon size={24} style={{ color: '#10b981' }} />;
  }
  if (['mp4', 'mov', 'avi', 'mkv', 'webm'].includes(ext)) {
    return <Film size={24} style={{ color: '#8b5cf6' }} />;
  }
  if (['mp3', 'wav', 'ogg', 'flac'].includes(ext)) {
    return <Music size={24} style={{ color: '#3b82f6' }} />;
  }
  if (['js', 'jsx', 'ts', 'tsx', 'py', 'html', 'css', 'json', 'cpp', 'java'].includes(ext)) {
    return <Code size={24} style={{ color: '#f97316' }} />;
  }
  if (['zip', 'tar', 'gz', '7z', 'rar'].includes(ext)) {
    return <Archive size={24} style={{ color: '#d97706' }} />;
  }
  return <FileText size={24} style={{ color: '#64748b' }} />;
}

export default function FileGrid({
  folders,
  files,
  starredKeys,
  onToggleStar,
  onFolderClick,
  onFilePreview,
  onShareLink,
  onDelete,
  onDownloadFolder,
  onDownloadFile
}) {
  return (
    <div>
      {/* Folders Section */}
      {folders.length > 0 && (
        <div style={{ marginBottom: '1.75rem' }}>
          <div className="section-title">Folders ({folders.length})</div>
          <div className="folder-grid">
            {folders.map((folder) => (
              <div
                key={folder.Key}
                className="folder-card"
                onClick={() => onFolderClick(folder.Key)}
              >
                <div className="folder-info">
                  <Folder size={22} style={{ color: '#f59e0b', flexShrink: 0 }} />
                  <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                    <span className="folder-name">{folder.name}</span>
                    <span style={{ fontSize: '0.725rem', color: 'var(--text-muted)' }}>
                      {formatBytes(folder.Size)} {folder.fileCount ? `• ${folder.fileCount} items` : ''}
                    </span>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                  <button
                    className="icon-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDownloadFolder(folder.Key);
                    }}
                    title="Download Entire Folder (.zip)"
                  >
                    <Download size={16} style={{ color: 'var(--primary)' }} />
                  </button>

                  <button
                    className="icon-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete(folder.Key, true);
                    }}
                    title="Delete Folder"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Files Section */}
      <div>
        <div className="section-title">Files ({files.length})</div>
        {files.length === 0 ? (
          <div
            style={{
              padding: '3rem 1rem',
              textAlign: 'center',
              color: 'var(--text-muted)',
              background: 'var(--bg-card)',
              border: '1px dashed var(--border-color)',
              borderRadius: 'var(--radius-lg)'
            }}
          >
            <FileText size={40} style={{ opacity: 0.4, marginBottom: '0.5rem' }} />
            <div>No objects in this directory</div>
            <div style={{ fontSize: '0.8rem', marginTop: '0.25rem' }}>
              Drag and drop files here or click "+ New" to upload
            </div>
          </div>
        ) : (
          <div className="file-grid">
            {files.map((file) => {
              const isStarred = starredKeys.includes(file.Key);
              return (
                <div
                  key={file.Key}
                  className="file-card"
                  onClick={() => onFilePreview(file)}
                >
                  {/* Thumbnail / Icon Preview */}
                  <div className="file-preview-area">
                    {file.previewUrl ? (
                      <img
                        src={file.previewUrl}
                        alt={file.name}
                        className="file-img-thumb"
                      />
                    ) : (
                      getFileIcon(file.name, false)
                    )}

                    {/* Top Right Action Overlay (Download & Star) */}
                    <div
                      style={{
                        position: 'absolute',
                        top: '0.5rem',
                        right: '0.5rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.35rem'
                      }}
                    >
                      <button
                        className="icon-btn"
                        style={{
                          background: 'rgba(0,0,0,0.4)',
                          color: 'white',
                          backdropFilter: 'blur(4px)'
                        }}
                        onClick={(e) => {
                          e.stopPropagation();
                          onDownloadFile(file);
                        }}
                        title="Download Object"
                      >
                        <Download size={14} />
                      </button>

                      <button
                        className="icon-btn"
                        style={{
                          background: 'rgba(0,0,0,0.4)',
                          color: isStarred ? '#f59e0b' : 'white',
                          backdropFilter: 'blur(4px)'
                        }}
                        onClick={(e) => {
                          e.stopPropagation();
                          onToggleStar(file.Key);
                        }}
                        title={isStarred ? 'Unstar' : 'Star item'}
                      >
                        <Star
                          size={14}
                          fill={isStarred ? '#f59e0b' : 'none'}
                        />
                      </button>
                    </div>
                  </div>

                  {/* Details */}
                  <div className="file-card-details">
                    <div className="file-title-row">
                      <span className="file-title" title={file.name}>
                        {file.name}
                      </span>
                    </div>

                    <div className="file-meta-row">
                      <span>{formatBytes(file.Size)}</span>
                      <span className="s3-class-badge">
                        {file.StorageClass || 'STANDARD'}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
