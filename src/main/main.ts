import { app, BrowserWindow, ipcMain, dialog } from 'electron';
import * as path from 'path';
import * as fs from 'fs';
import * as mm from 'music-metadata';

// Cache for artwork data URLs
const artworkCache = new Map<string, string>();

interface TrackMetadata {
  title: string;
  artist: string;
  album: string;
  albumArtist?: string;
  genre?: string;
  year?: number;
  trackNumber?: number;
  discNumber?: number;
  duration: number;
  bitrate?: number;
  sampleRate?: number;
  format: string;
  artwork?: string;
}

let mainWindow: BrowserWindow | null = null;

const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 400,
    minHeight: 300,
    frame: false,
    transparent: false,
    backgroundColor: '#1a1a2e',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
    },
    icon: path.join(__dirname, '../../src/renderer/assets/icons/icon.png'),
  });

  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'));
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// Window control handlers
ipcMain.handle('window:minimize', () => {
  mainWindow?.minimize();
});

ipcMain.handle('window:maximize', () => {
  if (mainWindow?.isMaximized()) {
    mainWindow.unmaximize();
  } else {
    mainWindow?.maximize();
  }
});

ipcMain.handle('window:close', () => {
  mainWindow?.close();
});

// File dialog handlers
ipcMain.handle('dialog:openFile', async () => {
  const result = await dialog.showOpenDialog(mainWindow!, {
    properties: ['openFile', 'multiSelections'],
    filters: [
      { name: 'Audio Files', extensions: ['mp3', 'flac', 'wav', 'ogg', 'm4a', 'aac', 'wma', 'opus'] },
      { name: 'All Files', extensions: ['*'] },
    ],
  });
  return result.filePaths;
});

ipcMain.handle('dialog:openFolder', async () => {
  const result = await dialog.showOpenDialog(mainWindow!, {
    properties: ['openDirectory'],
  });
  return result.filePaths[0];
});

// File system handlers
ipcMain.handle('fs:readDir', async (_, dirPath: string) => {
  try {
    const entries = await fs.promises.readdir(dirPath, { withFileTypes: true });
    return entries.map(entry => ({
      name: entry.name,
      isDirectory: entry.isDirectory(),
      path: path.join(dirPath, entry.name),
    }));
  } catch (error) {
    console.error('Error reading directory:', error);
    return [];
  }
});

ipcMain.handle('fs:readFile', async (_, filePath: string) => {
  try {
    const buffer = await fs.promises.readFile(filePath);
    return buffer;
  } catch (error) {
    console.error('Error reading file:', error);
    return null;
  }
});

// Metadata parsing handler
ipcMain.handle('metadata:parse', async (_, filePath: string): Promise<TrackMetadata | null> => {
  try {
    const metadata = await mm.parseFile(filePath);
    const { common, format } = metadata;

    // Extract artwork if available
    let artworkDataUrl: string | undefined;
    if (common.picture && common.picture.length > 0) {
      const picture = common.picture[0];
      // Check cache first
      const cacheKey = `${filePath}-${picture.data.length}`;
      if (artworkCache.has(cacheKey)) {
        artworkDataUrl = artworkCache.get(cacheKey);
      } else {
        const base64 = picture.data.toString('base64');
        artworkDataUrl = `data:${picture.format};base64,${base64}`;
        // Cache the artwork (limit cache size)
        if (artworkCache.size > 500) {
          const firstKey = artworkCache.keys().next().value;
          if (firstKey) artworkCache.delete(firstKey);
        }
        artworkCache.set(cacheKey, artworkDataUrl);
      }
    }

    // Get format from file extension
    const ext = path.extname(filePath).slice(1).toUpperCase();

    return {
      title: common.title || path.basename(filePath, path.extname(filePath)),
      artist: common.artist || 'Unknown Artist',
      album: common.album || 'Unknown Album',
      albumArtist: common.albumartist,
      genre: common.genre?.[0],
      year: common.year,
      trackNumber: common.track?.no || undefined,
      discNumber: common.disk?.no || undefined,
      duration: format.duration || 0,
      bitrate: format.bitrate ? Math.round(format.bitrate / 1000) : undefined,
      sampleRate: format.sampleRate,
      format: ext || format.container || 'AUDIO',
      artwork: artworkDataUrl,
    };
  } catch (error) {
    console.error('Error parsing metadata:', error);
    // Return basic info on error
    return {
      title: path.basename(filePath, path.extname(filePath)),
      artist: 'Unknown Artist',
      album: 'Unknown Album',
      duration: 0,
      format: path.extname(filePath).slice(1).toUpperCase() || 'AUDIO',
    };
  }
});

// Batch metadata parsing for multiple files
ipcMain.handle('metadata:parseMultiple', async (_, filePaths: string[]): Promise<(TrackMetadata | null)[]> => {
  const results: (TrackMetadata | null)[] = [];

  for (const filePath of filePaths) {
    try {
      const metadata = await mm.parseFile(filePath);
      const { common, format } = metadata;

      let artworkDataUrl: string | undefined;
      if (common.picture && common.picture.length > 0) {
        const picture = common.picture[0];
        const cacheKey = `${filePath}-${picture.data.length}`;
        if (artworkCache.has(cacheKey)) {
          artworkDataUrl = artworkCache.get(cacheKey);
        } else {
          const base64 = picture.data.toString('base64');
          artworkDataUrl = `data:${picture.format};base64,${base64}`;
          if (artworkCache.size > 500) {
            const firstKey = artworkCache.keys().next().value;
            if (firstKey) artworkCache.delete(firstKey);
          }
          artworkCache.set(cacheKey, artworkDataUrl);
        }
      }

      const ext = path.extname(filePath).slice(1).toUpperCase();

      results.push({
        title: common.title || path.basename(filePath, path.extname(filePath)),
        artist: common.artist || 'Unknown Artist',
        album: common.album || 'Unknown Album',
        albumArtist: common.albumartist,
        genre: common.genre?.[0],
        year: common.year,
        trackNumber: common.track?.no || undefined,
        discNumber: common.disk?.no || undefined,
        duration: format.duration || 0,
        bitrate: format.bitrate ? Math.round(format.bitrate / 1000) : undefined,
        sampleRate: format.sampleRate,
        format: ext || format.container || 'AUDIO',
        artwork: artworkDataUrl,
      });
    } catch (error) {
      console.error(`Error parsing ${filePath}:`, error);
      results.push({
        title: path.basename(filePath, path.extname(filePath)),
        artist: 'Unknown Artist',
        album: 'Unknown Album',
        duration: 0,
        format: path.extname(filePath).slice(1).toUpperCase() || 'AUDIO',
      });
    }
  }

  return results;
});

// Recursive folder scanning
ipcMain.handle('fs:scanFolder', async (_, folderPath: string): Promise<string[]> => {
  const audioExtensions = ['.mp3', '.flac', '.wav', '.ogg', '.m4a', '.aac', '.wma', '.opus', '.aiff', '.ape', '.wv'];
  const audioFiles: string[] = [];

  async function scanDir(dirPath: string): Promise<void> {
    try {
      const entries = await fs.promises.readdir(dirPath, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = path.join(dirPath, entry.name);

        if (entry.isDirectory()) {
          // Skip hidden folders and common non-music folders
          if (!entry.name.startsWith('.') && !['node_modules', '__pycache__'].includes(entry.name)) {
            await scanDir(fullPath);
          }
        } else if (entry.isFile()) {
          const ext = path.extname(entry.name).toLowerCase();
          if (audioExtensions.includes(ext)) {
            audioFiles.push(fullPath);
          }
        }
      }
    } catch (error) {
      console.error(`Error scanning ${dirPath}:`, error);
    }
  }

  await scanDir(folderPath);
  return audioFiles;
});

// App lifecycle
app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow();
  }
});
