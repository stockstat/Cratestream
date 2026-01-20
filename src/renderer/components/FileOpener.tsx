import { useCallback, useState } from 'react';
import { useLibraryStore } from '../store/libraryStore';
import { usePlayerStore } from '../store/playerStore';
import type { Track } from '../types';

interface FileOpenerProps {
  variant?: 'modern' | 'winamp';
}

// Generate a simple ID
function generateId(): string {
  return Math.random().toString(36).substring(2, 15) + Date.now().toString(36);
}

export function FileOpener({ variant = 'modern' }: FileOpenerProps) {
  const { addTracks, setScanning, setScanProgress } = useLibraryStore();
  const { setQueue, queue } = usePlayerStore();
  const [isLoading, setIsLoading] = useState(false);
  const [loadingText, setLoadingText] = useState('');

  const handleOpenFiles = useCallback(async () => {
    if (!window.electronAPI) return;

    const filePaths = await window.electronAPI.openFile();
    if (!filePaths || filePaths.length === 0) return;

    setIsLoading(true);
    setScanning(true);
    setLoadingText(`Scanning ${filePaths.length} file${filePaths.length > 1 ? 's' : ''}...`);

    try {
      // Parse metadata for all files
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

      // If no tracks in queue, start playing
      if (queue.length === 0 && newTracks.length > 0) {
        setQueue(newTracks, 0);
      }
    } catch (error) {
      console.error('Error loading files:', error);
    } finally {
      setIsLoading(false);
      setScanning(false);
      setScanProgress(0);
      setLoadingText('');
    }
  }, [addTracks, setQueue, queue.length, setScanning, setScanProgress]);

  const handleOpenFolder = useCallback(async () => {
    if (!window.electronAPI) return;

    const folderPath = await window.electronAPI.openFolder();
    if (!folderPath) return;

    setIsLoading(true);
    setScanning(true);
    setLoadingText('Scanning folder...');

    try {
      // Recursively scan folder for audio files
      const audioFiles = await window.electronAPI.scanFolder(folderPath);

      if (audioFiles.length === 0) {
        setLoadingText('No audio files found');
        setTimeout(() => setLoadingText(''), 2000);
        return;
      }

      setLoadingText(`Found ${audioFiles.length} files, reading metadata...`);

      // Parse metadata in batches to show progress
      const batchSize = 20;
      const newTracks: Track[] = [];

      for (let i = 0; i < audioFiles.length; i += batchSize) {
        const batch = audioFiles.slice(i, i + batchSize);
        const progress = Math.round((i / audioFiles.length) * 100);
        setScanProgress(progress);
        setLoadingText(`Reading metadata... ${progress}% (${i}/${audioFiles.length})`);

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

      setLoadingText(`Added ${newTracks.length} tracks`);
      setTimeout(() => setLoadingText(''), 2000);
    } catch (error) {
      console.error('Error scanning folder:', error);
      setLoadingText('Error scanning folder');
      setTimeout(() => setLoadingText(''), 2000);
    } finally {
      setIsLoading(false);
      setScanning(false);
      setScanProgress(0);
    }
  }, [addTracks, setQueue, queue.length, setScanning, setScanProgress]);

  if (variant === 'winamp') {
    return (
      <div className="flex items-center gap-1">
        <button
          onClick={handleOpenFiles}
          disabled={isLoading}
          className="winamp-btn px-2 py-1 bg-[#3a3a5c] border-t border-l border-[#5a5a7c] border-b border-r border-[#1a1a2c] text-[9px] text-[#00ff00] hover:text-white active:border-t-[#1a1a2c] active:border-l-[#1a1a2c] active:border-b-[#5a5a7c] active:border-r-[#5a5a7c] disabled:opacity-50"
        >
          {isLoading ? '...' : '+ FILE'}
        </button>
        <button
          onClick={handleOpenFolder}
          disabled={isLoading}
          className="winamp-btn px-2 py-1 bg-[#3a3a5c] border-t border-l border-[#5a5a7c] border-b border-r border-[#1a1a2c] text-[9px] text-[#00ff00] hover:text-white active:border-t-[#1a1a2c] active:border-l-[#1a1a2c] active:border-b-[#5a5a7c] active:border-r-[#5a5a7c] disabled:opacity-50"
        >
          {isLoading ? '...' : '+ DIR'}
        </button>
        {loadingText && (
          <span className="text-[8px] text-[#00aa00] ml-1 truncate max-w-[100px]">
            {loadingText}
          </span>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <button
          onClick={handleOpenFiles}
          disabled={isLoading}
          className="flex items-center gap-2 px-4 py-2 bg-app-accent hover:bg-app-accent-hover text-white rounded-lg transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
          ) : (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          )}
          Add Files
        </button>
        <button
          onClick={handleOpenFolder}
          disabled={isLoading}
          className="flex items-center gap-2 px-4 py-2 bg-app-surface-light hover:bg-app-surface text-app-text rounded-lg transition-colors text-sm font-medium border border-app-surface-light disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
          ) : (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
            </svg>
          )}
          Add Folder
        </button>
      </div>
      {loadingText && (
        <div className="text-xs text-app-text-muted">
          {loadingText}
        </div>
      )}
    </div>
  );
}
