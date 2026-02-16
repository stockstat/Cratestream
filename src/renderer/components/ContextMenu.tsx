import { useEffect, useRef, useState } from 'react';
import { useLibraryStore } from '../store/libraryStore';
import type { Track } from '../types';

interface ContextMenuProps {
  x: number;
  y: number;
  track?: Track;
  tracks?: Track[];
  albumName?: string;
  artistName?: string;
  onClose: () => void;
  onRescanArtwork?: (tracks: Track[]) => void;
}

export function ContextMenu({
  x,
  y,
  track,
  tracks,
  albumName,
  artistName,
  onClose,
  onRescanArtwork,
}: ContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);
  const [submenuOpen, setSubmenuOpen] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const { playlists, addToPlaylist, createPlaylist } = useLibraryStore();

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (showCreateDialog) {
          setShowCreateDialog(false);
        } else {
          onClose();
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [onClose, showCreateDialog]);

  // Adjust position if menu would go off screen
  const adjustedX = Math.min(x, window.innerWidth - 200);
  const adjustedY = Math.min(y, window.innerHeight - 300);

  const handleAddToPlaylist = (playlistId: string) => {
    const tracksToAdd = tracks || (track ? [track] : []);
    const trackIds = tracksToAdd.map(t => t.id);
    addToPlaylist(playlistId, trackIds);
    onClose();
  };

  const handleCreatePlaylist = () => {
    setShowCreateDialog(true);
    setNewPlaylistName('');
  };

  const handleConfirmCreate = () => {
    if (newPlaylistName && newPlaylistName.trim()) {
      const tracksToAdd = tracks || (track ? [track] : []);
      const trackIds = tracksToAdd.map(t => t.id);
      createPlaylist(newPlaylistName.trim(), trackIds);
    }
    setShowCreateDialog(false);
    onClose();
  };

  const handleRescanArtwork = () => {
    const tracksToScan = tracks || (track ? [track] : []);
    onRescanArtwork?.(tracksToScan);
    onClose();
  };

  const tracksCount = tracks?.length || (track ? 1 : 0);

  // Create Playlist Dialog
  if (showCreateDialog) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-app-surface border border-app-border rounded-lg p-4 w-96 shadow-xl">
          <h3 className="text-sm font-semibold text-app-text mb-3">Create New Playlist</h3>
          <input
            type="text"
            value={newPlaylistName}
            onChange={(e) => setNewPlaylistName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleConfirmCreate();
              if (e.key === 'Escape') setShowCreateDialog(false);
            }}
            placeholder="Playlist name..."
            autoFocus
            className="w-full px-3 py-2 text-sm bg-app-surface-dark border border-app-border rounded text-app-text placeholder-app-text-light focus:outline-none focus:border-app-accent"
          />
          <div className="flex gap-2 mt-4 justify-end">
            <button
              onClick={() => setShowCreateDialog(false)}
              className="px-4 py-1.5 text-xs text-app-text-muted hover:text-app-text border border-app-border rounded hover:bg-app-hover transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirmCreate}
              disabled={!newPlaylistName.trim()}
              className="px-4 py-1.5 text-xs text-white bg-app-accent hover:bg-app-accent-hover rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Create
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={menuRef}
      className="fixed z-50 bg-app-surface border border-app-border rounded shadow-lg py-1 min-w-[180px]"
      style={{ left: adjustedX, top: adjustedY }}
    >
      {/* Play */}
      <button
        onClick={() => {
          // Play action handled by parent
          onClose();
        }}
        className="w-full px-3 py-1.5 text-left text-xs text-app-text hover:bg-app-hover flex items-center gap-2"
      >
        <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M8 5v14l11-7z"/>
        </svg>
        Play
      </button>

      {/* Play Next */}
      <button
        onClick={onClose}
        className="w-full px-3 py-1.5 text-left text-xs text-app-text hover:bg-app-hover flex items-center gap-2"
      >
        <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z"/>
        </svg>
        Play Next
      </button>

      <div className="my-1 border-t border-app-border" />

      {/* Add to Playlist Submenu */}
      <div
        className="relative"
        onMouseEnter={() => setSubmenuOpen(true)}
        onMouseLeave={() => setSubmenuOpen(false)}
      >
        <button className="w-full px-3 py-1.5 text-left text-xs text-app-text hover:bg-app-hover flex items-center justify-between">
          <span className="flex items-center gap-2">
            <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M14 10H2v2h12v-2zm0-4H2v2h12V6zm4 8v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zM2 16h8v-2H2v2z"/>
            </svg>
            Add to Playlist
          </span>
          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
            <path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z"/>
          </svg>
        </button>

        {submenuOpen && (
          <div className="absolute left-full top-0 bg-app-surface border border-app-border rounded shadow-lg py-1 min-w-[160px] ml-1">
            {/* Create New Playlist */}
            <button
              onClick={handleCreatePlaylist}
              className="w-full px-3 py-1.5 text-left text-xs text-app-accent hover:bg-app-hover flex items-center gap-2"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Create New Playlist
            </button>

            {playlists.length > 0 && <div className="my-1 border-t border-app-border" />}

            {playlists.map(playlist => (
              <button
                key={playlist.id}
                onClick={() => handleAddToPlaylist(playlist.id)}
                className="w-full px-3 py-1.5 text-left text-xs text-app-text hover:bg-app-hover flex items-center gap-2"
              >
                <svg className="w-3.5 h-3.5 text-green-400" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M4 6H2v14c0 1.1.9 2 2 2h14v-2H4V6zm16-4H8c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-1 9h-4v4h-2v-4H9V9h4V5h2v4h4v2z"/>
                </svg>
                {playlist.name}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="my-1 border-t border-app-border" />

      {/* Rescan Artwork */}
      <button
        onClick={handleRescanArtwork}
        className="w-full px-3 py-1.5 text-left text-xs text-app-text hover:bg-app-hover flex items-center gap-2"
      >
        <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/>
        </svg>
        Rescan Artwork
        {tracksCount > 1 && ` (${tracksCount} tracks)`}
      </button>

      {/* Show in File Explorer */}
      <button
        onClick={() => {
          if (track?.filePath) {
            window.electronAPI?.showInFolder(track.filePath);
          }
          onClose();
        }}
        className="w-full px-3 py-1.5 text-left text-xs text-app-text hover:bg-app-hover flex items-center gap-2"
      >
        <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M10 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2h-8l-2-2z"/>
        </svg>
        Show in Folder
      </button>

      <div className="my-1 border-t border-app-border" />

      {/* Track Info */}
      {track && (
        <div className="px-3 py-1.5 text-[10px] text-app-text-muted">
          {albumName && <div>Album: {albumName}</div>}
          {artistName && <div>Artist: {artistName}</div>}
          {track.format && <div>Format: {track.format}</div>}
        </div>
      )}
    </div>
  );
}
