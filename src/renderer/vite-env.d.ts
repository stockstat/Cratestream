/// <reference types="vite/client" />

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

interface ElectronAPI {
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

export {};
