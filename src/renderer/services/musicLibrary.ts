/**
 * Music Library Service
 * Loads music library from Backblaze B2 + Cloudflare CDN
 * 
 * Replaces: dropboxService.ts, dropboxScanner.ts
 */

import type { Track, Playlist } from '../types';

interface LibraryData {
  version: string;
  generatedAt: string;
  totalTracks: number;
  tracks: Track[];
  playlists: Playlist[];
}

// Library URL - hardcoded to f001 (correct endpoint)
const LIBRARY_URL = 'https://f001.backblazeb2.com/file/1994HipHop/library.json';

// Cache
let cachedLibrary: LibraryData | null = null;

/**
 * Load entire music library from CDN
 */
export async function loadMusicLibrary(): Promise<LibraryData> {
  try {
    console.log('[Library] Loading from:', LIBRARY_URL);
    
    const response = await fetch(LIBRARY_URL, {
      cache: 'no-cache', // Force fresh load
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const library: LibraryData = await response.json();
    
    console.log(`[Library] Loaded ${library.totalTracks} tracks, ${library.playlists.length} playlists`);
    
    cachedLibrary = library;
    return library;

  } catch (error: any) {
    console.error('[Library] Failed to load:', error);
    throw new Error(`Failed to load music library: ${error.message}`);
  }
}

/**
 * Get cached library
 */
export function getCachedLibrary(): LibraryData | null {
  return cachedLibrary;
}

/**
 * Refresh library (force reload)
 */
export async function refreshLibrary(): Promise<LibraryData> {
  console.log('[Library] Refreshing...');
  cachedLibrary = null;
  
  const response = await fetch(LIBRARY_URL, {
    cache: 'reload',
  });

  const library = await response.json();
  cachedLibrary = library;
  
  console.log('[Library] Refreshed');
  return library;
}

/**
 * Get stream URL for a track
 */
export function getStreamUrl(track: Track): string {
  return track.streamUrl || track.dropboxLink || track.filePath || '';
}

/**
 * Prefetch artwork for faster display
 */
export async function prefetchArtwork(tracks: Track[], limit: number = 50): Promise<void> {
  const artworkUrls = tracks
    .filter(t => t.artworkUrl || t.artwork)
    .slice(0, limit)
    .map(t => t.artworkUrl || t.artwork)
    .filter(Boolean) as string[];

  console.log(`[Library] Prefetching ${artworkUrls.length} artworks...`);

  const promises = artworkUrls.map(url => {
    return new Promise<void>((resolve) => {
      const img = new Image();
      img.onload = () => resolve();
      img.onerror = () => resolve();
      img.src = url;
    });
  });

  await Promise.all(promises);
  console.log('[Library] Prefetch complete');
}

export default {
  loadMusicLibrary,
  getCachedLibrary,
  refreshLibrary,
  getStreamUrl,
  prefetchArtwork,
};
