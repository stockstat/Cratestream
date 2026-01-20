import { contextBridge, ipcRenderer } from 'electron';

// Track metadata interface
export interface TrackMetadata {
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

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  // Window controls
  minimize: () => ipcRenderer.invoke('window:minimize'),
  maximize: () => ipcRenderer.invoke('window:maximize'),
  close: () => ipcRenderer.invoke('window:close'),

  // File dialogs
  openFile: () => ipcRenderer.invoke('dialog:openFile'),
  openFolder: () => ipcRenderer.invoke('dialog:openFolder'),

  // File system
  readDir: (path: string) => ipcRenderer.invoke('fs:readDir', path),
  readFile: (path: string) => ipcRenderer.invoke('fs:readFile', path),
  scanFolder: (path: string) => ipcRenderer.invoke('fs:scanFolder', path),

  // Metadata parsing
  parseMetadata: (filePath: string) => ipcRenderer.invoke('metadata:parse', filePath),
  parseMetadataMultiple: (filePaths: string[]) => ipcRenderer.invoke('metadata:parseMultiple', filePaths),

  // Platform info
  platform: process.platform,
});

// Type definitions for the exposed API
export interface ElectronAPI {
  // Window controls
  minimize: () => Promise<void>;
  maximize: () => Promise<void>;
  close: () => Promise<void>;

  // File dialogs
  openFile: () => Promise<string[]>;
  openFolder: () => Promise<string>;

  // File system
  readDir: (path: string) => Promise<Array<{ name: string; isDirectory: boolean; path: string }>>;
  readFile: (path: string) => Promise<Buffer | null>;
  scanFolder: (path: string) => Promise<string[]>;

  // Metadata parsing
  parseMetadata: (filePath: string) => Promise<TrackMetadata | null>;
  parseMetadataMultiple: (filePaths: string[]) => Promise<(TrackMetadata | null)[]>;

  // Platform info
  platform: string;
}

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}
