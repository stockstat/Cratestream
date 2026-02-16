import { useState } from 'react';

interface PlaylistModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (name: string) => void;
}

export function PlaylistModal({ isOpen, onClose, onConfirm }: PlaylistModalProps) {
  const [playlistName, setPlaylistName] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (playlistName.trim()) {
      onConfirm(playlistName.trim());
      setPlaylistName('');
      onClose();
    }
  };

  const handleCancel = () => {
    setPlaylistName('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-app-surface border border-app-border rounded-lg shadow-xl w-96 p-6">
        <h3 className="text-lg font-semibold text-app-text mb-4">Create New Playlist</h3>
        
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            value={playlistName}
            onChange={(e) => setPlaylistName(e.target.value)}
            placeholder="Playlist name..."
            autoFocus
            className="w-full px-3 py-2 bg-app-surface-dark border border-app-border rounded text-app-text placeholder-app-text-light focus:outline-none focus:border-app-accent"
          />
          
          <div className="flex gap-2 mt-6 justify-end">
            <button
              type="button"
              onClick={handleCancel}
              className="px-4 py-2 text-sm font-medium text-app-text-muted hover:text-app-text border border-app-border hover:bg-app-hover rounded transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!playlistName.trim()}
              className="px-4 py-2 text-sm font-medium text-white bg-app-accent hover:bg-app-accent-hover rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Create
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
