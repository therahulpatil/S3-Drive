import React, { useState } from 'react';
import { X, FolderPlus } from 'lucide-react';

export default function NewFolderModal({ onCreateFolder, onClose }) {
  const [folderName, setFolderName] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (folderName.trim()) {
      onCreateFolder(folderName.trim());
      onClose();
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title">
            <FolderPlus size={20} style={{ color: 'var(--accent-amber)' }} />
            <span>Create New Folder</span>
          </div>
          <button className="icon-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="form-group">
              <label className="form-label">Folder Name:</label>
              <input
                type="text"
                className="form-control"
                placeholder="e.g. Backups, Project_Assets"
                value={folderName}
                onChange={(e) => setFolderName(e.target.value)}
                autoFocus
                required
              />
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              Create Folder
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
