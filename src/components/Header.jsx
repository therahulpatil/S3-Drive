import React from 'react';
import {
  Search,
  Grid,
  List,
  Sun,
  Moon,
  Settings,
  Lock
} from 'lucide-react';

export default function Header({
  searchQuery,
  setSearchQuery,
  filterCategory,
  setFilterCategory,
  viewMode,
  setViewMode,
  isDarkMode,
  setIsDarkMode,
  s3Config,
  connectionStatus,
  onOpenConfig
}) {
  return (
    <header className="header">
      {/* Search Input */}
      <div className="search-container">
        <Search className="search-icon" size={18} />
        <input
          type="text"
          className="search-input"
          placeholder="Search objects in drive (name, extension)..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* Header Actions */}
      <div className="header-actions">
        {/* Connection Badge */}
        <button className="status-pill" onClick={onOpenConfig} title="Click to view storage status">
          <span
            className={`status-dot ${
              s3Config.isDemoMode
                ? 'demo'
                : connectionStatus?.success || s3Config.useBackendProxy
                ? 'online'
                : 'offline'
            }`}
          />
          <Lock size={15} style={{ color: 'var(--accent-green)' }} />
          <span>Cloud Drive</span>
        </button>

        {/* View Mode Toggle */}
        <button
          className={`icon-btn ${viewMode === 'grid' ? 'active' : ''}`}
          onClick={() => setViewMode('grid')}
          title="Grid View"
        >
          <Grid size={19} />
        </button>
        <button
          className={`icon-btn ${viewMode === 'list' ? 'active' : ''}`}
          onClick={() => setViewMode('list')}
          title="List View"
        >
          <List size={19} />
        </button>

        {/* Dark/Light Mode */}
        <button
          className="icon-btn"
          onClick={() => setIsDarkMode(!isDarkMode)}
          title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        >
          {isDarkMode ? <Sun size={19} /> : <Moon size={19} />}
        </button>
      </div>
    </header>
  );
}
