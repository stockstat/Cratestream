import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Track, Playlist, CloudAccount } from '../types';

export type ViewType = 'songs' | 'artists' | 'albums' | 'genres' | 'years' | 'nowPlaying' | 'playlist';
export type SortField = 'title' | 'artist' | 'album' | 'year' | 'genre' | 'duration' | 'bitrate' | 'trackNumber';
export type SortDirection = 'asc' | 'desc';

export interface ArtistInfo {
  name: string;
  trackCount: number;
  albumCount: number;
}

export interface AlbumInfo {
  name: string;
  artist: string;
  year?: number;
  artwork?: string;
  trackCount: number;
  tracks: Track[];
}

export interface GenreInfo {
  name: string;
  trackCount: number;
}

export interface YearInfo {
  year: number;
  trackCount: number;
}

interface LibraryStore {
  // State
  tracks: Track[];
  playlists: Playlist[];
  cloudAccounts: CloudAccount[];
  isScanning: boolean;
  scanProgress: number;
  currentFolder: string | null;

  // View state
  currentView: ViewType;
  selectedArtist: string | null;
  selectedAlbum: string | null;
  selectedGenre: string | null;
  selectedYear: number | null;
  selectedPlaylistId: string | null;
  searchQuery: string;
  sortField: SortField;
  sortDirection: SortDirection;
  selectedTrackIds: Set<string>;

  // Computed getters
  getFilteredTracks: () => Track[];
  getArtists: () => ArtistInfo[];
  getAlbums: () => AlbumInfo[];
  getGenres: () => GenreInfo[];
  getYears: () => YearInfo[];

  // Actions
  addTrack: (track: Track) => void;
  addTracks: (tracks: Track[]) => void;
  removeTrack: (id: string) => void;
  clearTracks: () => void;

  createPlaylist: (name: string) => Playlist;
  deletePlaylist: (id: string) => void;
  addToPlaylist: (playlistId: string, track: Track) => void;
  removeFromPlaylist: (playlistId: string, trackId: string) => void;
  renamePlaylist: (id: string, name: string) => void;

  addCloudAccount: (account: CloudAccount) => void;
  removeCloudAccount: (id: string) => void;

  setScanning: (scanning: boolean) => void;
  setScanProgress: (progress: number) => void;
  setCurrentFolder: (folder: string | null) => void;

  // View actions
  setCurrentView: (view: ViewType) => void;
  setSelectedArtist: (artist: string | null) => void;
  setSelectedAlbum: (album: string | null) => void;
  setSelectedGenre: (genre: string | null) => void;
  setSelectedYear: (year: number | null) => void;
  setSelectedPlaylistId: (id: string | null) => void;
  setSearchQuery: (query: string) => void;
  setSortField: (field: SortField) => void;
  setSortDirection: (direction: SortDirection) => void;
  toggleSort: (field: SortField) => void;
  setSelectedTrackIds: (ids: Set<string>) => void;
  toggleTrackSelection: (id: string) => void;
  clearSelection: () => void;
}

function generateId(): string {
  return Math.random().toString(36).substring(2, 15);
}

export const useLibraryStore = create<LibraryStore>()(
  persist(
    (set, get) => ({
      // Initial state
      tracks: [],
      playlists: [],
      cloudAccounts: [],
      isScanning: false,
      scanProgress: 0,
      currentFolder: null,

      // View state
      currentView: 'songs' as ViewType,
      selectedArtist: null,
      selectedAlbum: null,
      selectedGenre: null,
      selectedYear: null,
      selectedPlaylistId: null,
      searchQuery: '',
      sortField: 'title' as SortField,
      sortDirection: 'asc' as SortDirection,
      selectedTrackIds: new Set<string>(),

      // Computed getters
      getFilteredTracks: () => {
        const state = get();
        let filtered = [...state.tracks];

        // Apply search filter
        if (state.searchQuery) {
          const query = state.searchQuery.toLowerCase();
          filtered = filtered.filter(t =>
            t.title.toLowerCase().includes(query) ||
            t.artist.toLowerCase().includes(query) ||
            t.album.toLowerCase().includes(query) ||
            (t.genre && t.genre.toLowerCase().includes(query))
          );
        }

        // Apply view-specific filters
        if (state.selectedArtist) {
          filtered = filtered.filter(t => t.artist === state.selectedArtist);
        }
        if (state.selectedAlbum) {
          filtered = filtered.filter(t => t.album === state.selectedAlbum);
        }
        if (state.selectedGenre) {
          filtered = filtered.filter(t => t.genre === state.selectedGenre);
        }
        if (state.selectedYear) {
          filtered = filtered.filter(t => t.year === state.selectedYear);
        }
        if (state.currentView === 'playlist' && state.selectedPlaylistId) {
          const playlist = state.playlists.find(p => p.id === state.selectedPlaylistId);
          filtered = playlist ? playlist.tracks : [];
        }

        // Apply sorting
        filtered.sort((a, b) => {
          let aVal: string | number | undefined;
          let bVal: string | number | undefined;

          switch (state.sortField) {
            case 'title':
              aVal = a.title.toLowerCase();
              bVal = b.title.toLowerCase();
              break;
            case 'artist':
              aVal = a.artist.toLowerCase();
              bVal = b.artist.toLowerCase();
              break;
            case 'album':
              aVal = a.album.toLowerCase();
              bVal = b.album.toLowerCase();
              break;
            case 'year':
              aVal = a.year || 0;
              bVal = b.year || 0;
              break;
            case 'genre':
              aVal = (a.genre || '').toLowerCase();
              bVal = (b.genre || '').toLowerCase();
              break;
            case 'duration':
              aVal = a.duration;
              bVal = b.duration;
              break;
            case 'bitrate':
              aVal = a.bitrate || 0;
              bVal = b.bitrate || 0;
              break;
            case 'trackNumber':
              aVal = a.trackNumber || 0;
              bVal = b.trackNumber || 0;
              break;
            default:
              aVal = a.title.toLowerCase();
              bVal = b.title.toLowerCase();
          }

          if (aVal < bVal) return state.sortDirection === 'asc' ? -1 : 1;
          if (aVal > bVal) return state.sortDirection === 'asc' ? 1 : -1;
          return 0;
        });

        return filtered;
      },

      getArtists: () => {
        const state = get();
        const artistMap = new Map<string, { trackCount: number; albums: Set<string> }>();

        state.tracks.forEach(track => {
          const existing = artistMap.get(track.artist);
          if (existing) {
            existing.trackCount++;
            existing.albums.add(track.album);
          } else {
            artistMap.set(track.artist, {
              trackCount: 1,
              albums: new Set([track.album]),
            });
          }
        });

        return Array.from(artistMap.entries())
          .map(([name, data]) => ({
            name,
            trackCount: data.trackCount,
            albumCount: data.albums.size,
          }))
          .sort((a, b) => a.name.localeCompare(b.name));
      },

      getAlbums: () => {
        const state = get();
        const albumMap = new Map<string, AlbumInfo>();

        state.tracks.forEach(track => {
          const key = `${track.album}__${track.artist}`;
          const existing = albumMap.get(key);
          if (existing) {
            existing.trackCount++;
            existing.tracks.push(track);
            if (!existing.artwork && track.artwork) {
              existing.artwork = track.artwork;
            }
            if (!existing.year && track.year) {
              existing.year = track.year;
            }
          } else {
            albumMap.set(key, {
              name: track.album,
              artist: track.artist,
              year: track.year,
              artwork: track.artwork,
              trackCount: 1,
              tracks: [track],
            });
          }
        });

        return Array.from(albumMap.values()).sort((a, b) => a.name.localeCompare(b.name));
      },

      getGenres: () => {
        const state = get();
        const genreMap = new Map<string, number>();

        state.tracks.forEach(track => {
          const genre = track.genre || 'Unknown';
          genreMap.set(genre, (genreMap.get(genre) || 0) + 1);
        });

        return Array.from(genreMap.entries())
          .map(([name, trackCount]) => ({ name, trackCount }))
          .sort((a, b) => a.name.localeCompare(b.name));
      },

      getYears: () => {
        const state = get();
        const yearMap = new Map<number, number>();

        state.tracks.forEach(track => {
          if (track.year) {
            yearMap.set(track.year, (yearMap.get(track.year) || 0) + 1);
          }
        });

        return Array.from(yearMap.entries())
          .map(([year, trackCount]) => ({ year, trackCount }))
          .sort((a, b) => b.year - a.year);
      },

      // Track actions
      addTrack: (track) => set((state) => {
        if (state.tracks.some(t => t.id === track.id)) {
          return state;
        }
        return { tracks: [...state.tracks, track] };
      }),

      addTracks: (tracks) => set((state) => {
        const existingIds = new Set(state.tracks.map(t => t.id));
        const newTracks = tracks.filter(t => !existingIds.has(t.id));
        return { tracks: [...state.tracks, ...newTracks] };
      }),

      removeTrack: (id) => set((state) => ({
        tracks: state.tracks.filter(t => t.id !== id),
      })),

      clearTracks: () => set({ tracks: [] }),

      // Playlist actions
      createPlaylist: (name) => {
        const playlist: Playlist = {
          id: generateId(),
          name,
          tracks: [],
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        set((state) => ({ playlists: [...state.playlists, playlist] }));
        return playlist;
      },

      deletePlaylist: (id) => set((state) => ({
        playlists: state.playlists.filter(p => p.id !== id),
      })),

      addToPlaylist: (playlistId, track) => set((state) => ({
        playlists: state.playlists.map(p => {
          if (p.id !== playlistId) return p;
          if (p.tracks.some(t => t.id === track.id)) return p;
          return {
            ...p,
            tracks: [...p.tracks, track],
            updatedAt: new Date(),
          };
        }),
      })),

      removeFromPlaylist: (playlistId, trackId) => set((state) => ({
        playlists: state.playlists.map(p => {
          if (p.id !== playlistId) return p;
          return {
            ...p,
            tracks: p.tracks.filter(t => t.id !== trackId),
            updatedAt: new Date(),
          };
        }),
      })),

      renamePlaylist: (id, name) => set((state) => ({
        playlists: state.playlists.map(p =>
          p.id === id ? { ...p, name, updatedAt: new Date() } : p
        ),
      })),

      // Cloud account actions
      addCloudAccount: (account) => set((state) => ({
        cloudAccounts: [...state.cloudAccounts, account],
      })),

      removeCloudAccount: (id) => set((state) => ({
        cloudAccounts: state.cloudAccounts.filter(a => a.id !== id),
      })),

      // Scanning actions
      setScanning: (scanning) => set({ isScanning: scanning }),
      setScanProgress: (progress) => set({ scanProgress: progress }),
      setCurrentFolder: (folder) => set({ currentFolder: folder }),

      // View actions
      setCurrentView: (view) => set({
        currentView: view,
        selectedArtist: null,
        selectedAlbum: null,
        selectedGenre: null,
        selectedYear: null,
      }),
      setSelectedArtist: (artist) => set({ selectedArtist: artist }),
      setSelectedAlbum: (album) => set({ selectedAlbum: album }),
      setSelectedGenre: (genre) => set({ selectedGenre: genre }),
      setSelectedYear: (year) => set({ selectedYear: year }),
      setSelectedPlaylistId: (id) => set({ selectedPlaylistId: id, currentView: 'playlist' }),
      setSearchQuery: (query) => set({ searchQuery: query }),
      setSortField: (field) => set({ sortField: field }),
      setSortDirection: (direction) => set({ sortDirection: direction }),
      toggleSort: (field) => set((state) => ({
        sortField: field,
        sortDirection: state.sortField === field && state.sortDirection === 'asc' ? 'desc' : 'asc',
      })),
      setSelectedTrackIds: (ids) => set({ selectedTrackIds: ids }),
      toggleTrackSelection: (id) => set((state) => {
        const newSet = new Set(state.selectedTrackIds);
        if (newSet.has(id)) {
          newSet.delete(id);
        } else {
          newSet.add(id);
        }
        return { selectedTrackIds: newSet };
      }),
      clearSelection: () => set({ selectedTrackIds: new Set() }),
    }),
    {
      name: 'cloudstream-library-storage',
      partialize: (state) => ({
        tracks: state.tracks,
        playlists: state.playlists.map(p => ({
          ...p,
          createdAt: p.createdAt instanceof Date ? p.createdAt.toISOString() : p.createdAt,
          updatedAt: p.updatedAt instanceof Date ? p.updatedAt.toISOString() : p.updatedAt,
        })),
        cloudAccounts: state.cloudAccounts.map(a => ({
          ...a,
          accessToken: '', // Don't persist tokens in local storage
          refreshToken: '',
        })),
        sortField: state.sortField,
        sortDirection: state.sortDirection,
      }),
      onRehydrateStorage: () => (state) => {
        // Convert date strings back to Date objects
        if (state?.playlists) {
          state.playlists = state.playlists.map(p => ({
            ...p,
            createdAt: new Date(p.createdAt),
            updatedAt: new Date(p.updatedAt),
          }));
        }
      },
    }
  )
);
