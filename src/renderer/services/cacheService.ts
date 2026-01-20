// Cache Service for offline playback
// Uses IndexedDB to store audio files and metadata

const DB_NAME = 'cloud-music-player-cache';
const DB_VERSION = 1;
const AUDIO_STORE = 'audio-files';
const METADATA_STORE = 'metadata';

interface CachedAudio {
  id: string;
  filePath: string;
  blob: Blob;
  size: number;
  cachedAt: Date;
  lastAccessed: Date;
}

interface CachedMetadata {
  id: string;
  filePath: string;
  metadata: Record<string, unknown>;
  cachedAt: Date;
}

let db: IDBDatabase | null = null;

// Initialize IndexedDB
export async function initCacheDB(): Promise<IDBDatabase> {
  if (db) return db;

  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);

    request.onsuccess = () => {
      db = request.result;
      resolve(db);
    };

    request.onupgradeneeded = (event) => {
      const database = (event.target as IDBOpenDBRequest).result;

      // Audio files store
      if (!database.objectStoreNames.contains(AUDIO_STORE)) {
        const audioStore = database.createObjectStore(AUDIO_STORE, { keyPath: 'id' });
        audioStore.createIndex('filePath', 'filePath', { unique: true });
        audioStore.createIndex('cachedAt', 'cachedAt', { unique: false });
        audioStore.createIndex('size', 'size', { unique: false });
      }

      // Metadata store
      if (!database.objectStoreNames.contains(METADATA_STORE)) {
        const metaStore = database.createObjectStore(METADATA_STORE, { keyPath: 'id' });
        metaStore.createIndex('filePath', 'filePath', { unique: true });
      }
    };
  });
}

// Cache an audio file
export async function cacheAudioFile(
  id: string,
  filePath: string,
  audioData: ArrayBuffer | Blob
): Promise<void> {
  const database = await initCacheDB();

  const blob = audioData instanceof Blob ? audioData : new Blob([audioData]);

  const cachedAudio: CachedAudio = {
    id,
    filePath,
    blob,
    size: blob.size,
    cachedAt: new Date(),
    lastAccessed: new Date(),
  };

  return new Promise((resolve, reject) => {
    const transaction = database.transaction([AUDIO_STORE], 'readwrite');
    const store = transaction.objectStore(AUDIO_STORE);
    const request = store.put(cachedAudio);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

// Get cached audio file
export async function getCachedAudio(id: string): Promise<Blob | null> {
  const database = await initCacheDB();

  return new Promise((resolve, reject) => {
    const transaction = database.transaction([AUDIO_STORE], 'readwrite');
    const store = transaction.objectStore(AUDIO_STORE);
    const request = store.get(id);

    request.onsuccess = () => {
      const result = request.result as CachedAudio | undefined;
      if (result) {
        // Update last accessed time
        result.lastAccessed = new Date();
        store.put(result);
        resolve(result.blob);
      } else {
        resolve(null);
      }
    };
    request.onerror = () => reject(request.error);
  });
}

// Check if audio is cached
export async function isAudioCached(id: string): Promise<boolean> {
  const database = await initCacheDB();

  return new Promise((resolve, reject) => {
    const transaction = database.transaction([AUDIO_STORE], 'readonly');
    const store = transaction.objectStore(AUDIO_STORE);
    const request = store.count(IDBKeyRange.only(id));

    request.onsuccess = () => resolve(request.result > 0);
    request.onerror = () => reject(request.error);
  });
}

// Get cache statistics
export async function getCacheStats(): Promise<{
  totalFiles: number;
  totalSize: number;
  oldestCache: Date | null;
}> {
  const database = await initCacheDB();

  return new Promise((resolve, reject) => {
    const transaction = database.transaction([AUDIO_STORE], 'readonly');
    const store = transaction.objectStore(AUDIO_STORE);
    const request = store.getAll();

    request.onsuccess = () => {
      const files = request.result as CachedAudio[];
      const totalSize = files.reduce((sum, file) => sum + file.size, 0);
      const oldestCache = files.length > 0
        ? new Date(Math.min(...files.map(f => new Date(f.cachedAt).getTime())))
        : null;

      resolve({
        totalFiles: files.length,
        totalSize,
        oldestCache,
      });
    };
    request.onerror = () => reject(request.error);
  });
}

// Remove cached audio file
export async function removeCachedAudio(id: string): Promise<void> {
  const database = await initCacheDB();

  return new Promise((resolve, reject) => {
    const transaction = database.transaction([AUDIO_STORE], 'readwrite');
    const store = transaction.objectStore(AUDIO_STORE);
    const request = store.delete(id);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

// Clear old cache entries (LRU eviction)
export async function evictOldCache(maxSizeBytes: number): Promise<number> {
  const database = await initCacheDB();

  return new Promise((resolve, reject) => {
    const transaction = database.transaction([AUDIO_STORE], 'readwrite');
    const store = transaction.objectStore(AUDIO_STORE);
    const request = store.getAll();

    request.onsuccess = () => {
      const files = request.result as CachedAudio[];

      // Calculate total size
      let totalSize = files.reduce((sum, file) => sum + file.size, 0);

      if (totalSize <= maxSizeBytes) {
        resolve(0);
        return;
      }

      // Sort by last accessed (oldest first)
      files.sort((a, b) =>
        new Date(a.lastAccessed).getTime() - new Date(b.lastAccessed).getTime()
      );

      let evicted = 0;

      // Delete oldest files until under limit
      for (const file of files) {
        if (totalSize <= maxSizeBytes) break;

        store.delete(file.id);
        totalSize -= file.size;
        evicted++;
      }

      resolve(evicted);
    };
    request.onerror = () => reject(request.error);
  });
}

// Clear all cache
export async function clearCache(): Promise<void> {
  const database = await initCacheDB();

  return new Promise((resolve, reject) => {
    const transaction = database.transaction([AUDIO_STORE, METADATA_STORE], 'readwrite');

    transaction.objectStore(AUDIO_STORE).clear();
    transaction.objectStore(METADATA_STORE).clear();

    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
  });
}

// Download and cache audio from URL
export async function downloadAndCache(
  id: string,
  filePath: string,
  url: string,
  onProgress?: (progress: number) => void
): Promise<Blob> {
  // Check if already cached
  const cached = await getCachedAudio(id);
  if (cached) return cached;

  // Download the file
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Failed to download: ${response.status}`);
  }

  const contentLength = response.headers.get('content-length');
  const total = contentLength ? parseInt(contentLength, 10) : 0;

  if (!response.body) {
    const blob = await response.blob();
    await cacheAudioFile(id, filePath, blob);
    return blob;
  }

  // Stream download with progress
  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let received = 0;

  while (true) {
    const { done, value } = await reader.read();

    if (done) break;

    chunks.push(value);
    received += value.length;

    if (onProgress && total > 0) {
      onProgress(received / total);
    }
  }

  const blob = new Blob(chunks);
  await cacheAudioFile(id, filePath, blob);

  return blob;
}

// Get blob URL for cached or remote audio
export async function getAudioUrl(
  id: string,
  filePath: string,
  remoteUrl?: string
): Promise<string> {
  // Check cache first
  const cached = await getCachedAudio(id);
  if (cached) {
    return URL.createObjectURL(cached);
  }

  // If remote URL provided, download and cache
  if (remoteUrl) {
    try {
      const blob = await downloadAndCache(id, filePath, remoteUrl);
      return URL.createObjectURL(blob);
    } catch (error) {
      console.error('Failed to cache audio:', error);
      // Fall back to remote URL
      return remoteUrl;
    }
  }

  // For local files, return file path as-is
  return filePath;
}

// Format bytes to human readable
export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}
