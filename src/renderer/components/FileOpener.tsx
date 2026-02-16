import { useCallback, useState, useRef } from 'react';
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
  const { addTracks, setScanning, setScanProgress, isScanning } = useLibraryStore();
  const { setQueue, queue } = usePlayerStore();
  const [isLoading, setIsLoading] = useState(false);
  const [loadingText, setLoadingText] = useState('');
  const abortController = useRef<AbortController | null>(null);

  const handleOpenFiles = useCallback(async () => {
    if (!window.electronAPI || isScanning || isLoading) {
      console.log('[FileOpener] Already scanning, please wait...');
      return;
    }

    const filePaths = await window.electronAPI.openFile();
    if (!filePaths || filePaths.length === 0) return;

    console.log('[FileOpener] Opening files:', filePaths.length);
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

      console.log('[FileOpener] Adding tracks:', newTracks.length);
      addTracks(newTracks);

      // If no tracks in queue, start playing
      if (queue.length === 0 && newTracks.length > 0) {
        setQueue(newTracks, 0);
      }

      setLoadingText(`Added ${newTracks.length} track${newTracks.length > 1 ? 's' : ''}`);
      setTimeout(() => setLoadingText(''), 2000);
    } catch (error) {
      console.error('[FileOpener] Error loading files:', error);
      setLoadingText('Error loading files');
      setTimeout(() => setLoadingText(''), 2000);
    } finally {
      console.log('[FileOpener] Files scan complete');
      setIsLoading(false);
      setScanning(false);
      setScanProgress(0);
    }
  }, [addTracks, setQueue, queue.length, setScanning, setScanProgress, isScanning, isLoading]);

  const handleOpenFolder = useCallback(async () => {
    if (!window.electronAPI || isScanning || isLoading) {
      console.log('[FileOpener] Already scanning, please wait...');
      return;
    }

    const folderPath = await window.electronAPI.openFolder();
    if (!folderPath) return;

    console.log('[FileOpener] Scanning folder:', folderPath);
    abortController.current = new AbortController();
    
    setIsLoading(true);
    setScanning(true);
    setScanProgress(0);
    setLoadingText('Scanning folder...');

    try {
      // Recursively scan folder for audio files
      const audioFiles = await window.electronAPI.scanFolder(folderPath);
      console.log('[FileOpener] Found audio files:', audioFiles.length);

      if (audioFiles.length === 0) {
        setLoadingText('No audio files found');
        setTimeout(() => setLoadingText(''), 2000);
        return;
      }

      setLoadingText(`Found ${audioFiles.length} files, reading metadata...`);

      // Parse metadata in batches to show progress
      const batchSize = 10; // Smaller batches for better responsiveness
      const newTracks: Track[] = [];

      for (let i = 0; i < audioFiles.length; i += batchSize) {
        // Check if aborted
        if (abortController.current?.signal.aborted) {
          console.log('[FileOpener] Scan aborted');
          break;
        }

        const batch = audioFiles.slice(i, i + batchSize);
        const progress = Math.round(((i + batch.length) / audioFiles.length) * 100);
        setScanProgress(progress);
        setLoadingText(`Reading metadata... ${progress}% (${i + batch.length}/${audioFiles.length})`);

        console.log(`[FileOpener] Processing batch ${i / batchSize + 1}, progress: ${progress}%`);

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

        // Add tracks incrementally for better UX
        if (newTracks.length >= batchSize * 5) {
          console.log('[FileOpener] Adding batch of', newTracks.length, 'tracks');
          addTracks([...newTracks]);
          newTracks.length = 0; // Clear array
        }
      }

      // Add remaining tracks
      if (newTracks.length > 0) {
        console.log('[FileOpener] Adding final', newTracks.length, 'tracks');
        addTracks(newTracks);
      }

      if (queue.length === 0) {
        const allTracks = useLibraryStore.getState().tracks;
        if (allTracks.length > 0) {
          setQueue(allTracks, 0);
        }
      }

      setLoadingText(`Added ${audioFiles.length} tracks`);
      setTimeout(() => setLoadingText(''), 2000);
    } catch (error) {
      console.error('[FileOpener] Error scanning folder:', error);
      setLoadingText('Error scanning folder');
      setTimeout(() => setLoadingText(''), 2000);
    } finally {
      console.log('[FileOpener] Folder scan complete');
      setIsLoading(false);
      setScanning(false);
      setScanProgress(0);
      abortController.current = null;
    }
  }, [addTracks, setQueue, queue.length, setScanning, setScanProgress, isScanning, isLoading]);

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
          disabled={isLoading || isScanning}
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
          disabled={isLoading || isScanning}
          className="flex items-center gap-2 px-4 py-2 bg-app-surface-light hover:bg-app-hover text-app-text rounded-lg transition-colors text-sm font-medium border border-app-border disabled:opacity-50 disabled:cursor-not-allowed"
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