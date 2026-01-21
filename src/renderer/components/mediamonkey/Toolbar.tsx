import { useCallback, useState } from 'react';
import { useLibraryStore, ViewType, SortField } from '../../store/libraryStore';
import { usePlayerStore } from '../../store/playerStore';
import type { Track } from '../../types';

function generateId(): string {
  return Math.random().toString(36).substring(2, 15) + Date.now().toString(36);
}

interface ToolbarProps {
  currentView: ViewType;
  onViewChange?: (view: 'list' | 'grid') => void;
  viewMode?: 'list' | 'grid';
  showViewToggle?: boolean;
}

export function Toolbar({ currentView, onViewChange, viewMode = 'list', showViewToggle = true }: ToolbarProps) {
  const {
    searchQuery,
    setSearchQuery,
    sortField,
    sortDirection,
    toggleSort,
    selectedArtist,
    selectedAlbum,
    selectedGenre,
    selectedYear,
    setSelectedArtist,
    setSelectedAlbum,
    setSelectedGenre,
    setSelectedYear,
    setCurrentView,
    addTracks,
    setScanning,
    setScanProgress,
  } = useLibraryStore();

  const { setQueue, queue } = usePlayerStore();
  const [isLoading, setIsLoading] = useState(false);

  const handleOpenFiles = useCallback(async () => {
    if (!window.electronAPI) return;

    const filePaths = await window.electronAPI.openFile();
    if (!filePaths || filePaths.length === 0) return;

    setIsLoading(true);
    setScanning(true);

    try {
      const metadataResults = await window.electronAPI.parseMetadataMultiple(filePaths);

      const newTracks: Track[] = filePaths.map((filePath, index) => {
        const metadata = metadataResults[index];
        return {
          id: generateId(),
          title: metadata?.title || 'Unknown',
          artist: metadata?.artist || 'Unknown Artist',
          album: metadata?.album || 'Unknown Album',
          duration: metadata?.duration || 0,
          filePath,
          artwork: metadata?.artwork,
          genre: metadata?.genre,
          year: metadata?.year,
          trackNumber: metadata?.trackNumber,
          bitrate: metadata?.bitrate,
          sampleRate: metadata?.sampleRate,
          format: metadata?.format || 'AUDIO',
        };
      });

      addTracks(newTracks);

      if (queue.length === 0 && newTracks.length > 0) {
        setQueue(newTracks, 0);
      }
    } catch (error) {
      console.error('Error loading files:', error);
    } finally {
      setIsLoading(false);
      setScanning(false);
      setScanProgress(0);
    }
  }, [addTracks, setQueue, queue.length, setScanning, setScanProgress]);

  const handleOpenFolder = useCallback(async () => {
    if (!window.electronAPI) return;

    const folderPath = await window.electronAPI.openFolder();
    if (!folderPath) return;

    setIsLoading(true);
    setScanning(true);

    try {
      const audioFiles = await window.electronAPI.scanFolder(folderPath);

      if (audioFiles.length === 0) {
        return;
      }

      const batchSize = 20;
      const newTracks: Track[] = [];

      for (let i = 0; i < audioFiles.length; i += batchSize) {
        const batch = audioFiles.slice(i, i + batchSize);
        const progress = Math.round((i / audioFiles.length) * 100);
        setScanProgress(progress);

        const metadataResults = await window.electronAPI.parseMetadataMultiple(batch);

        batch.forEach((filePath, index) => {
          const metadata = metadataResults[index];
          newTracks.push({
            id: generateId(),
            title: metadata?.title || 'Unknown',
            artist: metadata?.artist || 'Unknown Artist',
            album: metadata?.album || 'Unknown Album',
            duration: metadata?.duration || 0,
            filePath,
            artwork: metadata?.artwork,
            genre: metadata?.genre,
            year: metadata?.year,
            trackNumber: metadata?.trackNumber,
            bitrate: metadata?.bitrate,
            sampleRate: metadata?.sampleRate,
            format: metadata?.format || 'AUDIO',
          });
        });
      }

      addTracks(newTracks);

      if (queue.length === 0 && newTracks.length > 0) {
        setQueue(newTracks, 0);
      }
    } catch (error) {
      console.error('Error scanning folder:', error);
    } finally {
      setIsLoading(false);
      setScanning(false);
      setScanProgress(0);
    }
  }, [addTracks, setQueue, queue.length, setScanning, setScanProgress]);

  const getViewTitle = () => {
    if (selectedArtist) return `Artist: ${selectedArtist}`;
    if (selectedAlbum) return `Album: ${selectedAlbum}`;
    if (selectedGenre) return `Genre: ${selectedGenre}`;
    if (selectedYear) return `Year: ${selectedYear}`;

    switch (currentView) {
      case 'nowPlaying':
        return 'Now Playing';
      case 'songs':
        return 'All Songs';
      case 'artists':
        return 'Artists';
      case 'albums':
        return 'Albums';
      case 'genres':
        return 'Genres';
      case 'years':
        return 'Years';
      case 'playlist':
        return 'Playlist';
      default:
        return 'Library';
    }
  };

  const handleClearFilters = () => {
    setSelectedArtist(null);
    setSelectedAlbum(null);
    setSelectedGenre(null);
    setSelectedYear(null);
  };

  const hasActiveFilters = selectedArtist || selectedAlbum || selectedGenre || selectedYear;

  const sortOptions: { value: SortField; label: string }[] = [
    { value: 'title', label: 'Title' },
    { value: 'artist', label: 'Artist' },
    { value: 'album', label: 'Album' },
    { value: 'year', label: 'Year' },
    { value: 'genre', label: 'Genre' },
    { value: 'duration', label: 'Duration' },
    { value: 'trackNumber', label: 'Track #' },
  ];

  return (
    <div className="flex items-center gap-3 px-3 py-2 bg-app-surface-dark border-b border-app-border">
      {/* View Title & Breadcrumb */}
      <div className="flex items-center gap-2 min-w-0">
        <h2 className="text-sm font-semibold text-app-text truncate">{getViewTitle()}</h2>
        {hasActiveFilters && (
          <button
            onClick={handleClearFilters}
            className="flex items-center gap-1 px-2 py-0.5 text-[10px] text-app-text-muted hover:text-app-text bg-app-surface hover:bg-app-hover border border-app-border rounded transition-colors"
          >
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
            Clear Filter
          </button>
        )}
      </div>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Search Box */}
      <div className="relative w-48">
        <svg
          className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-app-text-light"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          type="text"
          placeholder="Search library..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-7 pr-3 py-1 text-xs bg-app-surface border border-app-border rounded text-app-text placeholder-app-text-light focus:outline-none focus:border-app-accent"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-app-text-light hover:text-app-text"
          >
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* Sort Dropdown */}
      {(currentView === 'songs' || currentView === 'nowPlaying' || currentView === 'playlist') && (
        <div className="flex items-center gap-1">
          <span className="text-[10px] text-app-text-light">Sort:</span>
          <select
            value={sortField}
            onChange={(e) => toggleSort(e.target.value as SortField)}
            className="px-2 py-1 text-xs bg-app-surface border border-app-border rounded text-app-text focus:outline-none focus:border-app-accent cursor-pointer"
          >
            {sortOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <button
            onClick={() => toggleSort(sortField)}
            className="p-1 text-app-text-muted hover:text-app-text transition-colors"
            title={sortDirection === 'asc' ? 'Ascending' : 'Descending'}
          >
            {sortDirection === 'asc' ? (
              <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M7 14l5-5 5 5z"/>
              </svg>
            ) : (
              <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M7 10l5 5 5-5z"/>
              </svg>
            )}
          </button>
        </div>
      )}

      {/* View Toggle */}
      {showViewToggle && currentView === 'albums' && (
        <div className="flex items-center border border-app-border rounded overflow-hidden">
          <button
            onClick={() => onViewChange?.('list')}
            className={`p-1.5 transition-colors ${
              viewMode === 'list' ? 'bg-app-accent text-white' : 'bg-app-surface text-app-text-muted hover:text-app-text'
            }`}
            title="List View"
          >
            <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M3 13h2v-2H3v2zm0 4h2v-2H3v2zm0-8h2V7H3v2zm4 4h14v-2H7v2zm0 4h14v-2H7v2zM7 7v2h14V7H7z"/>
            </svg>
          </button>
          <button
            onClick={() => onViewChange?.('grid')}
            className={`p-1.5 transition-colors ${
              viewMode === 'grid' ? 'bg-app-accent text-white' : 'bg-app-surface text-app-text-muted hover:text-app-text'
            }`}
            title="Grid View"
          >
            <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M3 3v8h8V3H3zm6 6H5V5h4v4zm-6 4v8h8v-8H3zm6 6H5v-4h4v4zm4-16v8h8V3h-8zm6 6h-4V5h4v4zm-6 4v8h8v-8h-8zm6 6h-4v-4h4v4z"/>
            </svg>
          </button>
        </div>
      )}

      {/* Separator */}
      <div className="w-px h-5 bg-app-border" />

      {/* File Opener */}
      <div className="flex items-center gap-1">
        <button
          onClick={handleOpenFiles}
          disabled={isLoading}
          className="flex items-center gap-1 px-2 py-1 text-[10px] font-medium text-app-text bg-app-surface hover:bg-app-hover border border-app-border rounded transition-colors disabled:opacity-50"
          title="Add Files"
        >
          {isLoading ? (
            <svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          ) : (
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          )}
          Files
        </button>
        <button
          onClick={handleOpenFolder}
          disabled={isLoading}
          className="flex items-center gap-1 px-2 py-1 text-[10px] font-medium text-app-text bg-app-surface hover:bg-app-hover border border-app-border rounded transition-colors disabled:opacity-50"
          title="Add Folder"
        >
          {isLoading ? (
            <svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          ) : (
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
            </svg>
          )}
          Folder
        </button>
      </div>
    </div>
  );
}
