/**
 * Library Store - B2/CDN Version
 * 
 * Changes from Dropbox version:
 * - Removed: setScanning, setScanProgress, addTracks (no more scanning!)
 * - Added: loadLibrary, refreshLibrary (loads entire library from JSON)
 * - Simplified: No more Dropbox-specific code
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { loadMusicLibrary, refreshLibrary as refreshLibraryService } from '../services/musicLibrary';
import type { Track, Playlist } from '../types';

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
  tracks: Track[];
  playlists: Playlist[];
  isLoading: boolean;
  loadError: string | null;
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
  
  // Actions
  loadLibrary: () => Promise<void>;
  refreshLibrary: () => Promise<void>;
  getFilteredTracks: () => Track[];
  getArtists: () => ArtistInfo[];
  getAlbums: () => AlbumInfo[];
  getGenres: () => GenreInfo[];
  getYears: () => YearInfo[];
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
  createPlaylist: (name: string, trackIds?: string[]) => void;
  addToPlaylist: (playlistId: string, trackIds: string[]) => void;
  removeFromPlaylist: (playlistId: string, trackIds: string[]) => void;
  deletePlaylist: (playlistId: string) => void;
}

export const useLibraryStore = create<LibraryStore>()(
  persist(
    (set, get) => ({
      tracks: [],
      playlists: [],
      isLoading: false,
      loadError: null,
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

      // Load entire library from CDN
      loadLibrary: async () => {
        set({ isLoading: true, loadError: null });
        
        try {
          const library = await loadMusicLibrary();
          
          // Convert playlist trackIds to full track objects
          const trackMap = new Map(library.tracks.map(t => [t.id, t]));
          const playlists = library.playlists.map(playlist => {
            // Check if playlist has trackIds instead of tracks
            if ('trackIds' in playlist && Array.isArray((playlist as any).trackIds)) {
              const tracks = (playlist as any).trackIds
                .map((id: string) => trackMap.get(id))
                .filter(Boolean) as Track[];
              
              return {
                id: playlist.id,
                name: playlist.name,
                tracks,
                createdAt: playlist.createdAt || new Date().toISOString(),
              };
            }
            // Already has tracks
            return playlist;
          });
          
          set({
            tracks: library.tracks,
            playlists,
            isLoading: false,
          });
          
          console.log(`[Store] Loaded ${library.tracks.length} tracks`);
        } catch (error: any) {
          console.error('[Store] Load failed:', error);
          set({
            isLoading: false,
            loadError: error.message,
          });
        }
      },

      // Refresh library from CDN
      refreshLibrary: async () => {
        set({ isLoading: true, loadError: null });
        
        try {
          const library = await refreshLibraryService();
          
          // Convert playlist trackIds to full track objects
          const trackMap = new Map(library.tracks.map(t => [t.id, t]));
          const playlists = library.playlists.map(playlist => {
            // Check if playlist has trackIds instead of tracks
            if ('trackIds' in playlist && Array.isArray((playlist as any).trackIds)) {
              const tracks = (playlist as any).trackIds
                .map((id: string) => trackMap.get(id))
                .filter(Boolean) as Track[];
              
              return {
                id: playlist.id,
                name: playlist.name,
                tracks,
                createdAt: playlist.createdAt || new Date().toISOString(),
              };
            }
            // Already has tracks
            return playlist;
          });
          
          set({
            tracks: library.tracks,
            playlists,
            isLoading: false,
          });
          
          console.log(`[Store] Refreshed ${library.tracks.length} tracks`);
        } catch (error: any) {
          set({
            isLoading: false,
            loadError: error.message,
          });
        }
      },

      getFilteredTracks: () => {
        const state = get();
        let filtered = [...state.tracks];

        if (state.searchQuery) {
          const query = state.searchQuery.toLowerCase();
          filtered = filtered.filter(t =>
            t.title?.toLowerCase().includes(query) ||
            t.artist?.toLowerCase().includes(query) ||
            t.album?.toLowerCase().includes(query) ||
            (t.genre && t.genre.toLowerCase().includes(query))
          );
        }

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
          if (playlist) {
            // The playlist should have a tracks array
            filtered = playlist.tracks || [];
          } else {
            filtered = [];
          }
        }

        filtered.sort((a, b) => {
          let aVal: string | number | undefined;
          let bVal: string | number | undefined;

          switch (state.sortField) {
            case 'title':
              aVal = a.title?.toLowerCase() || '';
              bVal = b.title?.toLowerCase() || '';
              break;
            case 'artist':
              aVal = a.artist?.toLowerCase() || '';
              bVal = b.artist?.toLowerCase() || '';
              break;
            case 'album':
              aVal = a.album?.toLowerCase() || '';
              bVal = b.album?.toLowerCase() || '';
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
              aVal = a.duration || 0;
              bVal = b.duration || 0;
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
              aVal = a.title?.toLowerCase() || '';
              bVal = b.title?.toLowerCase() || '';
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
          const artist = track.artist || 'Unknown Artist';
          const existing = artistMap.get(artist);
          if (existing) {
            existing.trackCount++;
            existing.albums.add(track.album || 'Unknown Album');
          } else {
            artistMap.set(artist, { 
              trackCount: 1, 
              albums: new Set([track.album || 'Unknown Album']) 
            });
          }
        });
        
        return Array.from(artistMap.entries())
          .map(([name, data]) => ({ 
            name, 
            trackCount: data.trackCount, 
            albumCount: data.albums.size 
          }))
          .sort((a, b) => a.name.localeCompare(b.name));
      },

      getAlbums: () => {
        const state = get();
        const albumMap = new Map<string, AlbumInfo>();
        
        state.tracks.forEach(track => {
          const key = `${track.album || 'Unknown Album'}__${track.artist || 'Unknown Artist'}`;
          const existing = albumMap.get(key);
          
          if (existing) {
            existing.trackCount++;
            existing.tracks.push(track);
            if (!existing.artwork && (track.artworkUrl || track.artwork)) {
              existing.artwork = track.artworkUrl || track.artwork;
            }
            if (!existing.year && track.year) {
              existing.year = track.year;
            }
          } else {
            albumMap.set(key, {
              name: track.album || 'Unknown Album',
              artist: track.artist || 'Unknown Artist',
              year: track.year,
              artwork: track.artworkUrl || track.artwork,
              trackCount: 1,
              tracks: [track],
            });
          }
        });
        
        return Array.from(albumMap.values())
          .sort((a, b) => a.name.localeCompare(b.name));
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

      setCurrentView: (view) => set({
        currentView: view,
        selectedArtist: null,
        selectedAlbum: null,
        selectedGenre: null,
        selectedYear: null,
        searchQuery: '',
      }, false),

      setSelectedArtist: (artist) => set({
        selectedArtist: artist,
        currentView: 'albums',
        selectedAlbum: null,
        selectedGenre: null,
        selectedYear: null,
        searchQuery: '',
      }, false),

      setSelectedAlbum: (album) => set({ selectedAlbum: album }, false),
      setSelectedGenre: (genre) => set({ selectedGenre: genre, currentView: 'songs' }, false),
      setSelectedYear: (year) => set({ selectedYear: year, currentView: 'songs' }, false),
      setSelectedPlaylistId: (id) => set({ selectedPlaylistId: id, currentView: 'playlist' }, false),
      setSearchQuery: (query) => set({ searchQuery: query }, false),
      setSortField: (field) => set({ sortField: field }),
      setSortDirection: (direction) => set({ sortDirection: direction }),
      
      toggleSort: (field) => set((state) => ({
        sortField: field,
        sortDirection: state.sortField === field && state.sortDirection === 'asc' ? 'desc' : 'asc',
      })),

      setSelectedTrackIds: (ids) => set({ selectedTrackIds: ids }, false),
      
      toggleTrackSelection: (id) => set((state) => {
        const newSet = new Set(state.selectedTrackIds);
        if (newSet.has(id)) {
          newSet.delete(id);
        } else {
          newSet.add(id);
        }
        return { selectedTrackIds: newSet };
      }, false),

      clearSelection: () => set({ selectedTrackIds: new Set() }, false),

      createPlaylist: (name, trackIds = []) => set((state) => {
        const newPlaylist: Playlist = {
          id: Date.now().toString(),
          name,
          tracks: trackIds.length > 0 
            ? state.tracks.filter(t => trackIds.includes(t.id))
            : [],
          createdAt: new Date().toISOString(),
        };
        
        return { playlists: [...state.playlists, newPlaylist] };
      }),

      addToPlaylist: (playlistId, trackIds) => set((state) => {
        const trackIdArray = Array.isArray(trackIds) ? trackIds : Array.from(trackIds);  // ← ADD THIS LINE
        const playlists = state.playlists.map(p => {
          if (p.id === playlistId) {
            const existingIds = new Set(p.tracks.map(t => t.id));
            const newTracks = state.tracks.filter(
              t => trackIdArray.includes(t.id) && !existingIds.has(t.id)  // ← CHANGE trackIds to trackIdArray
            );
            return { ...p, tracks: [...p.tracks, ...newTracks] };
        }
        return p;
      });
      return { playlists };
    }),

      removeFromPlaylist: (playlistId, trackIds) => set((state) => {
        const trackIdSet = new Set(trackIds);
        const playlists = state.playlists.map(p => {
          if (p.id === playlistId) {
            return { ...p, tracks: p.tracks.filter(t => !trackIdSet.has(t.id)) };
          }
          return p;
        });
        return { playlists };
      }),

      deletePlaylist: (playlistId) => set((state) => ({
        playlists: state.playlists.filter(p => p.id !== playlistId),
        selectedPlaylistId: state.selectedPlaylistId === playlistId ? null : state.selectedPlaylistId,
      })),
    }),
    {
      name: 'cloudstream-library-storage',
      version: 5,
      partialize: (state) => ({
        // Don't persist tracks (loaded from CDN)
        playlists: state.playlists,
        sortField: state.sortField,
        sortDirection: state.sortDirection,
      }),
    }
  )
);
