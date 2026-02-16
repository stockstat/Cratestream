export interface Track {
  id: string;
  title: string;
  artist: string;
  album: string;
  duration: number;
  filePath: string;
  fileUrl?: string;
  artwork?: string;
  artworkUrl?: string;
  streamUrl?: string;
  genre?: string;
  year?: number;
  trackNumber?: number;
  bitrate?: number;
  sampleRate?: number;
  format?: string;
  isDropbox?: boolean;   
  dropboxLink?: string;     
}

export interface Playlist {
  id: string;
  name: string;
  tracks: Track[];
  createdAt: Date | string;
  updatedAt: Date | string;
}

export type RepeatMode = 'off' | 'all' | 'one';
export type ShuffleMode = 'off' | 'on';
export type SkinType = 'modern';

export interface PlayerState {
  // Current playback
  currentTrack: Track | null;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  isMuted: boolean;

  // Queue
  queue: Track[];
  queueIndex: number;
  originalQueue: Track[]; // For shuffle restore

  // Modes
  repeatMode: RepeatMode;
  shuffleMode: ShuffleMode;

  // UI
  skin: SkinType;
  isEqualizerOpen: boolean;
  isPlaylistOpen: boolean;
}

export interface CloudAccount {
  id: string;
  provider: 'dropbox' | 'google-drive' | 'onedrive';
  email: string;
  accessToken: string;
  refreshToken: string;
  expiresAt: Date;
  rootFolders: string[];
}

export interface LibraryState {
  tracks: Track[];
  playlists: Playlist[];
  cloudAccounts: CloudAccount[];
  isScanning: boolean;
  scanProgress: number;
}
