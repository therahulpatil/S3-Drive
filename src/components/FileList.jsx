import React from 'react';
import {
  Folder,
  Star,
  Share2,
  Trash2,
  Eye,
  Download
} from 'lucide-react';
import { formatBytes } from '../services/s3Service';
import { getFileIcon } from './FileGrid';

export default function FileList({
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
    <div className="table-container">
      <table className="file-table">
        <thead>
          <tr>
            <th style={{ width: '40px' }}></th>
            <th>Name</th>
            <th>Storage Class</th>
            <th>Size</th>
            <th>Last Modified</th>
            <th style={{ textAlign: 'right' }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {/* Folders */}
          {folders.map((folder) => (
            <tr
              key={folder.Key}
              onClick={() => onFolderClick(folder.Key)}
              style={{ cursor: 'pointer' }}
            >
              <td></td>
              <td style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontWeight: 500 }}>
                <Folder size={20} style={{ color: '#f59e0b' }} />
                <span>{folder.name}</span>
              </td>
              <td>
                <span className="s3-class-badge">DIRECTORY</span>
              </td>
              <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.825rem' }}>
                {formatBytes(folder.Size)}
              </td>
              <td style={{ color: 'var(--text-muted)', fontSize: '0.825rem' }}>
                {folder.fileCount ? `${folder.fileCount} items` : '—'}
              </td>
              <td>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.25rem' }}>
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
              </td>
            </tr>
          ))}

          {/* Files */}
          {files.map((file) => {
            const isStarred = starredKeys.includes(file.Key);
            const dateStr = file.LastModified
              ? new Date(file.LastModified).toLocaleDateString(undefined, {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric'
                })
              : '—';

            return (
              <tr
                key={file.Key}
                onClick={() => onFilePreview(file)}
                style={{ cursor: 'pointer' }}
              >
                <td onClick={(e) => e.stopPropagation()}>
                  <button
                    className="icon-btn"
                    onClick={() => onToggleStar(file.Key)}
                  >
                    <Star
                      size={16}
                      style={{ color: isStarred ? '#f59e0b' : 'var(--text-muted)' }}
                      fill={isStarred ? '#f59e0b' : 'none'}
                    />
                  </button>
                </td>

                <td style={{ fontWeight: 500 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    {getFileIcon(file.name, false)}
                    <span>{file.name}</span>
                  </div>
                </td>

                <td>
                  <span className="s3-class-badge">
                    {file.StorageClass || 'STANDARD'}
                  </span>
                </td>

                <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.825rem' }}>
                  {formatBytes(file.Size)}
                </td>

                <td style={{ color: 'var(--text-muted)', fontSize: '0.825rem' }}>
                  {dateStr}
                </td>

                <td onClick={(e) => e.stopPropagation()}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.25rem' }}>
                    <button
                      className="icon-btn"
                      onClick={() => onDownloadFile(file)}
                      title="Download Object"
                    >
                      <Download size={16} style={{ color: 'var(--primary)' }} />
                    </button>

                    <button
                      className="icon-btn"
                      onClick={() => onFilePreview(file)}
                      title="Preview & Details"
                    >
                      <Eye size={16} />
                    </button>

                    <button
                      className="icon-btn"
                      onClick={() => onShareLink(file)}
                      title="Generate Presigned Share Link"
                    >
                      <Share2 size={16} />
                    </button>

                    <button
                      className="icon-btn"
                      onClick={() => onDelete(file.Key, false)}
                      title="Delete Object"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}

          {folders.length === 0 && files.length === 0 && (
            <tr>
              <td colSpan={6} style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                No S3 objects found in this path.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
