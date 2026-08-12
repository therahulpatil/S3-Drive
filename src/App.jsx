import React, { useState, useEffect, useRef } from 'react';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import Breadcrumb from './components/Breadcrumb';
import FileGrid from './components/FileGrid';
import FileList from './components/FileList';
import FilePreviewModal from './components/FilePreviewModal';
import PresignedLinkModal from './components/PresignedLinkModal';
import S3ConfigModal from './components/S3ConfigModal';
import CorsGuideModal from './components/CorsGuideModal';
import NewFolderModal from './components/NewFolderModal';
import UploadProgressToast from './components/UploadProgressToast';
import DragDropOverlay from './components/DragDropOverlay';

import {
  getS3Config,
  saveS3Config,
  getStarredKeys,
  saveStarredKeys,
  getTrashKeys,
  saveTrashKeys
} from './services/storage';

import {
  listS3Objects,
  uploadS3Object,
  createS3Folder,
  deleteS3Object,
  deleteS3Folder,
  testS3Connection,
  downloadFolderAsZip
} from './services/s3Service';
import { checkBackendStatus } from './services/apiService';

export default function App() {
  // Config & Status State
  const [s3Config, setS3Config] = useState(getS3Config);
  const [connectionStatus, setConnectionStatus] = useState(null);

  // App UI State
  const [activeTab, setActiveTab] = useState('drive'); // 'drive', 'starred', 'recent', 'trash'
  const [currentPrefix, setCurrentPrefix] = useState('');
  const [viewMode, setViewMode] = useState('grid');
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');

  // S3 Data State
  const [folders, setFolders] = useState([]);
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // User Collections
  const [starredKeys, setStarredKeys] = useState(getStarredKeys);
  const [trashKeys, setTrashKeys] = useState(getTrashKeys);

  // Modals
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [showCorsModal, setShowCorsModal] = useState(false);
  const [showNewFolderModal, setShowNewFolderModal] = useState(false);
  const [previewFile, setPreviewFile] = useState(null);
  const [shareFile, setShareFile] = useState(null);

  // Upload Management
  const [uploadQueue, setUploadQueue] = useState([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const fileInputRef = useRef(null);

  // Dark Mode Sync
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark-mode');
    } else {
      document.documentElement.classList.remove('dark-mode');
    }
  }, [isDarkMode]);

  // Initial S3 Connection Check
  useEffect(() => {
    async function checkConn() {
      try {
        const backendRes = await checkBackendStatus();
        if (backendRes && backendRes.configured && backendRes.success) {
          setS3Config(prev => ({
            ...prev,
            bucketName: backendRes.bucketName,
            useBackendProxy: true,
            isDemoMode: false
          }));
          setConnectionStatus({
            success: true,
            message: backendRes.message
          });
          return;
        }
      } catch (e) {
        // Backend proxy offline
      }

      // If backend proxy is offline and no client keys exist, auto-enable Demo Mode so the application is ALWAYS 100% visible and functional
      setS3Config(prev => ({
        ...prev,
        useBackendProxy: false,
        isDemoMode: !prev.accessKeyId
      }));
    }
    checkConn();
  }, []);

  // Fetch S3 Objects
  const loadS3Data = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await listS3Objects(s3Config, currentPrefix);
      setFolders(res.folders || []);
      setFiles(res.files || []);
    } catch (err) {
      console.error('Failed to load S3 objects:', err);
      setError(err.message || 'Failed to fetch objects.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadS3Data();
  }, [s3Config.useBackendProxy, s3Config.isDemoMode, s3Config.bucketName, currentPrefix]);

  // Save S3 Config Handler
  const handleSaveConfig = (newConfig) => {
    setS3Config(newConfig);
    saveS3Config(newConfig);
  };

  // Toggle Starred Item
  const handleToggleStar = (key) => {
    let updated;
    if (starredKeys.includes(key)) {
      updated = starredKeys.filter(k => k !== key);
    } else {
      updated = [...starredKeys, key];
    }
    setStarredKeys(updated);
    saveStarredKeys(updated);
  };

  // Create New S3 Virtual Folder
  const handleCreateFolder = async (folderName) => {
    try {
      await createS3Folder(s3Config, folderName, currentPrefix);
      loadS3Data();
    } catch (err) {
      alert(`Failed to create folder: ${err.message}`);
    }
  };

  // Upload Files Handler
  const handleUploadFiles = async (fileList) => {
    if (!fileList || fileList.length === 0) return;

    const filesArray = Array.from(fileList);
    const newItems = filesArray.map(f => ({
      fileName: f.name,
      size: f.size,
      progress: 0,
      status: 'uploading'
    }));

    setUploadQueue(prev => [...newItems, ...prev]);

    for (const file of filesArray) {
      try {
        await uploadS3Object(s3Config, file, currentPrefix, (pct) => {
          setUploadQueue(prev =>
            prev.map(item =>
              item.fileName === file.name ? { ...item, progress: pct } : item
            )
          );
        });

        setUploadQueue(prev =>
          prev.map(item =>
            item.fileName === file.name
              ? { ...item, progress: 100, status: 'completed' }
              : item
          )
        );
      } catch (err) {
        setUploadQueue(prev =>
          prev.map(item =>
            item.fileName === file.name
              ? { ...item, status: 'error', error: err.message }
              : item
          )
        );
      }
    }

    loadS3Data();
  };

  // Delete Object / Folder Handler
  const handleDeleteItem = async (key, isFolder) => {
    const itemLabel = isFolder ? 'folder and all its contents' : 'file';
    if (confirm(`Are you sure you want to delete ${itemLabel} "${key}" from S3 bucket?`)) {
      try {
        if (isFolder) {
          await deleteS3Folder(s3Config, key);
        } else {
          await deleteS3Object(s3Config, key);
        }
        // Add to trash list
        const updatedTrash = [...trashKeys, key];
        setTrashKeys(updatedTrash);
        saveTrashKeys(updatedTrash);
        loadS3Data();
      } catch (err) {
        alert(`Deletion Failed: ${err.message}`);
      }
    }
  };

  // Single File Direct Download Handler
  const handleDownloadFile = async (file) => {
    try {
      let downloadUrl = file.previewUrl;
      if (!downloadUrl) {
        downloadUrl = await generateS3PresignedUrl(s3Config, file.Key, 3600);
      }
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = file.name;
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      alert(`Download Failed: ${err.message}`);
    }
  };

  // Download Entire Folder as ZIP Handler
  const handleDownloadFolder = async (folderKey) => {
    const folderParts = folderKey.replace(/\/$/, '').split('/');
    const folderName = folderParts[folderParts.length - 1] || 'folder';

    const queueItemName = `Zipping ${folderName}...`;
    setUploadQueue(prev => [
      {
        fileName: queueItemName,
        size: 0,
        progress: 0,
        status: 'uploading'
      },
      ...prev
    ]);

    try {
      await downloadFolderAsZip(s3Config, folderKey, (prog) => {
        setUploadQueue(prev =>
          prev.map(item =>
            item.fileName.startsWith(`Zipping ${folderName}`)
              ? {
                  ...item,
                  fileName: `Zipping ${folderName} (${prog.current}/${prog.total})`,
                  progress: prog.percentage
                }
              : item
          )
        );
      });

      setUploadQueue(prev =>
        prev.map(item =>
          item.fileName.startsWith(`Zipping ${folderName}`)
            ? {
                ...item,
                fileName: `Downloaded ${folderName}.zip`,
                progress: 100,
                status: 'completed'
              }
            : item
        )
      );
    } catch (err) {
      alert(`Failed to download folder: ${err.message}`);
      setUploadQueue(prev =>
        prev.map(item =>
          item.fileName.startsWith(`Zipping ${folderName}`)
            ? {
                ...item,
                status: 'error',
                error: err.message
              }
            : item
        )
      );
    }
  };

  // Filtered & Searched Data
  const getFilteredItems = () => {
    let displayFolders = [...folders];
    let displayFiles = [...files];

    // Filter by Tab
    if (activeTab === 'starred') {
      displayFolders = [];
      displayFiles = displayFiles.filter(f => starredKeys.includes(f.Key));
    } else if (activeTab === 'trash') {
      displayFolders = [];
      displayFiles = displayFiles.filter(f => trashKeys.includes(f.Key));
    } else if (activeTab === 'recent') {
      displayFolders = [];
      displayFiles.sort((a, b) => new Date(b.LastModified) - new Date(a.LastModified));
    }

    // Filter by Search Query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      displayFolders = displayFolders.filter(f => f.name.toLowerCase().includes(q));
      displayFiles = displayFiles.filter(f => f.name.toLowerCase().includes(q));
    }

    // Filter by Category
    if (filterCategory !== 'all') {
      displayFolders = [];
      displayFiles = displayFiles.filter(f => {
        const ext = f.name.split('.').pop().toLowerCase();
        if (filterCategory === 'images') return ['png', 'jpg', 'jpeg', 'gif', 'svg', 'webp'].includes(ext);
        if (filterCategory === 'documents') return ['pdf', 'doc', 'docx', 'txt', 'rtf'].includes(ext);
        if (filterCategory === 'videos') return ['mp4', 'webm', 'mov', 'avi'].includes(ext);
        if (filterCategory === 'audio') return ['mp3', 'wav', 'ogg'].includes(ext);
        if (filterCategory === 'code') return ['js', 'jsx', 'ts', 'py', 'html', 'css', 'json'].includes(ext);
        if (filterCategory === 'archives') return ['zip', 'tar', 'gz', '7z'].includes(ext);
        return true;
      });
    }

    return { displayFolders, displayFiles };
  };

  const { displayFolders, displayFiles } = getFilteredItems();

  // Storage Stats Calculation
  const totalBytes = files.reduce((acc, f) => acc + (f.Size || 0), 0);
  const storageStats = {
    fileCount: files.length,
    folderCount: folders.length,
    totalBytes
  };

  // Drag and Drop Events
  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleUploadFiles(e.dataTransfer.files);
    }
  };

  return (
    <div
      className="app-container"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Hidden File Input for Upload */}
      <input
        type="file"
        ref={fileInputRef}
        style={{ display: 'none' }}
        multiple
        onChange={(e) => handleUploadFiles(e.target.files)}
      />

      {/* Full-Screen Drag and Drop Backdrop */}
      <DragDropOverlay isDragging={isDragging} />

      {/* Sidebar */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={(tab) => {
          setActiveTab(tab);
          setCurrentPrefix('');
        }}
        onNewFolder={() => setShowNewFolderModal(true)}
        onUploadFile={() => fileInputRef.current?.click()}
        storageStats={storageStats}
      />

      {/* Main Wrapper */}
      <div className="main-wrapper">
        {/* Header */}
        <Header
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          filterCategory={filterCategory}
          setFilterCategory={setFilterCategory}
          viewMode={viewMode}
          setViewMode={setViewMode}
          isDarkMode={isDarkMode}
          setIsDarkMode={setIsDarkMode}
          s3Config={s3Config}
          connectionStatus={connectionStatus}
          onOpenConfig={() => setShowConfigModal(true)}
        />

        {/* Content Area */}
        <main className="content-area">
          {/* Path Toolbar */}
          <div className="toolbar">
            <Breadcrumb
              currentPrefix={currentPrefix}
              onNavigate={(path) => setCurrentPrefix(path)}
              onDownloadFolder={handleDownloadFolder}
            />

            {/* Quick Category Filter Pills */}
            <div className="filter-pills">
              {[
                { id: 'all', label: 'All Files' },
                { id: 'images', label: 'Images' },
                { id: 'documents', label: 'Documents' },
                { id: 'videos', label: 'Videos' },
                { id: 'audio', label: 'Audio' },
                { id: 'code', label: 'Code' },
                { id: 'archives', label: 'Archives' }
              ].map(cat => (
                <button
                  key={cat.id}
                  className={`filter-pill ${filterCategory === cat.id ? 'active' : ''}`}
                  onClick={() => setFilterCategory(cat.id)}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          {/* S3 Objects View */}
          {loading ? (
            <div style={{ padding: '4rem', textAlign: 'center', color: 'var(--text-muted)' }}>
              Loading objects from S3 bucket "{s3Config.bucketName}"...
            </div>
          ) : error ? (
            <div
              style={{
                padding: '2rem',
                background: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid var(--accent-red)',
                borderRadius: 'var(--radius-md)',
                color: 'var(--accent-red)'
              }}
            >
              <div style={{ fontWeight: 600, fontSize: '1rem', marginBottom: '0.5rem' }}>
                Error Loading S3 Objects
              </div>
              <div style={{ fontSize: '0.875rem' }}>{error}</div>
              <div style={{ marginTop: '1rem', display: 'flex', gap: '0.75rem' }}>
                <button
                  className="btn btn-secondary"
                  onClick={() => setShowConfigModal(true)}
                >
                  Check S3 Credentials
                </button>
                <button
                  className="btn btn-primary"
                  onClick={() => setShowCorsModal(true)}
                >
                  View CORS Guide
                </button>
              </div>
            </div>
          ) : viewMode === 'grid' ? (
            <FileGrid
              folders={displayFolders}
              files={displayFiles}
              starredKeys={starredKeys}
              onToggleStar={handleToggleStar}
              onFolderClick={(folderKey) => setCurrentPrefix(folderKey)}
              onFilePreview={(file) => setPreviewFile(file)}
              onShareLink={(file) => setShareFile(file)}
              onDelete={handleDeleteItem}
              onDownloadFolder={handleDownloadFolder}
              onDownloadFile={handleDownloadFile}
            />
          ) : (
            <FileList
              folders={displayFolders}
              files={displayFiles}
              starredKeys={starredKeys}
              onToggleStar={handleToggleStar}
              onFolderClick={(folderKey) => setCurrentPrefix(folderKey)}
              onFilePreview={(file) => setPreviewFile(file)}
              onShareLink={(file) => setShareFile(file)}
              onDelete={handleDeleteItem}
              onDownloadFolder={handleDownloadFolder}
              onDownloadFile={handleDownloadFile}
            />
          )}
        </main>
      </div>

      {/* Upload Progress Toast */}
      <UploadProgressToast
        uploads={uploadQueue}
        onClose={() => setUploadQueue([])}
      />

      {/* Modals */}
      {showNewFolderModal && (
        <NewFolderModal
          onCreateFolder={handleCreateFolder}
          onClose={() => setShowNewFolderModal(false)}
        />
      )}

      {showConfigModal && (
        <S3ConfigModal
          config={s3Config}
          onSave={handleSaveConfig}
          onClose={() => setShowConfigModal(false)}
          onOpenCorsGuide={() => {
            setShowConfigModal(false);
            setShowCorsModal(true);
          }}
        />
      )}

      {showCorsModal && (
        <CorsGuideModal onClose={() => setShowCorsModal(false)} />
      )}

      {previewFile && (
        <FilePreviewModal
          file={previewFile}
          s3Config={s3Config}
          onClose={() => setPreviewFile(null)}
          onShareLink={(file) => {
            setPreviewFile(null);
            setShareFile(file);
          }}
        />
      )}

      {shareFile && (
        <PresignedLinkModal
          file={shareFile}
          s3Config={s3Config}
          onClose={() => setShareFile(null)}
        />
      )}
    </div>
  );
}
