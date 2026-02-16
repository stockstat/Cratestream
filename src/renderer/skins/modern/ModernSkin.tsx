import { useState, useCallback, useMemo } from 'react';
import { usePlayerStore } from '../../store/playerStore';
import { useLibraryStore, AlbumInfo, ArtistInfo } from '../../store/libraryStore';
import { TitleBar } from '../../components/TitleBar';
import { PlaybackControls } from '../../components/PlaybackControls';
import { ProgressBar } from '../../components/ProgressBar';
import { VolumeControl } from '../../components/VolumeControl';
import { CloudBrowser } from '../../components/CloudBrowser';
import {
  TreeNavigation,
  ArtistList,
  GenreList,
  YearList,
  StatusBar,
  Toolbar,
  NowPlayingPanel,
  VirtualizedColumnTrackList,
  VirtualizedAlbumGrid,
} from '../../components/mediamonkey';
import type { Track } from '../../types';

interface ModernSkinProps {
  onSeek: (time: number) => void;
}

export function ModernSkin({ onSeek }: ModernSkinProps) {
  const {
    currentTrack,
    repeatMode,
    shuffleMode,
    cycleRepeatMode,
    toggleShuffle,
    queue,
    setQueue,
  } = usePlayerStore();

  const {
    tracks,
    currentView,
    selectedPlaylistId,
    selectedArtist,
    searchQuery,
    playlists,
    getFilteredTracks,
    getArtists,
    getAlbums,
    getGenres,
    getYears,
    setCurrentView,
    setSelectedArtist,
    setSelectedAlbum,
    setSelectedGenre,
    setSelectedYear,
    addTracks,
  } = useLibraryStore();

  const [showNowPlaying, setShowNowPlaying] = useState(true);
  const [showCloudBrowser, setShowCloudBrowser] = useState(false);
  const [albumViewMode, setAlbumViewMode] = useState<'list' | 'grid'>('grid');
  const [selectedAlbumDetail, setSelectedAlbumDetail] = useState<AlbumInfo | null>(null);

  // PERFORMANCE FIX: Memoize expensive calculations
  // These only recalculate when their dependencies change
  const filteredTracks = useMemo(() => getFilteredTracks(), [
    tracks,
    selectedArtist,
    searchQuery,
    selectedPlaylistId,
    currentView
  ]);

  const artists = useMemo(() => getArtists(), [tracks]);
  const allAlbums = useMemo(() => getAlbums(), [tracks]);
  const genres = useMemo(() => getGenres(), [tracks]);
  const years = useMemo(() => getYears(), [tracks]);

  // Filter albums by selected artist and search query - also memoized
  const albums = useMemo(() => {
    return allAlbums.filter(album => {
      // Filter by selected artist
      if (selectedArtist && album.artist !== selectedArtist) {
        return false;
      }
      // Filter by search query
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        return (
          album.name.toLowerCase().includes(query) ||
          album.artist.toLowerCase().includes(query)
        );
      }
      return true;
    });
  }, [allAlbums, selectedArtist, searchQuery]);

  // Handle rescan artwork for tracks
  const handleRescanArtwork = useCallback(async (tracksToScan: Track[]) => {
    if (!window.electronAPI?.rescanArtwork) return;

    for (const track of tracksToScan) {
      try {
        const newArtwork = await window.electronAPI.rescanArtwork(track.filePath);
        if (newArtwork) {
          // Update the track in the store
          const updatedTracks = tracks.map(t =>
            t.id === track.id ? { ...t, artwork: newArtwork } : t
          );
          // This is a simplified update - in production you'd want a proper updateTrack action
          addTracks(updatedTracks.filter(t => !tracks.some(existing => existing.id === t.id)));
        }
      } catch (error) {
        console.error('Error rescanning artwork:', error);
      }
    }
  }, [tracks, addTracks]);

  // Get tracks to display based on current view - memoized
  const displayTracks = useMemo(() => {
    if (currentView === 'nowPlaying') {
      return queue;
    }
    if (currentView === 'playlist' && selectedPlaylistId) {
      const playlist = playlists.find(p => p.id === selectedPlaylistId);
      return playlist?.tracks || [];
    }
    return filteredTracks;
  }, [currentView, queue, selectedPlaylistId, playlists, filteredTracks]);

  // Handle play track - memoized callback
  const handlePlayTrack = useCallback((track: Track) => {
    setQueue([track, ...displayTracks.filter(t => t.id !== track.id)]);
  }, [displayTracks, setQueue]);

  // Handle play all - memoized callback
  const handlePlayAll = useCallback(() => {
    if (displayTracks.length > 0) {
      setQueue(displayTracks);
    }
  }, [displayTracks, setQueue]);

  // Handle artist click - memoized callback
  const handleArtistClick = useCallback((artist: ArtistInfo) => {
    setSelectedArtist(artist.name);
    setCurrentView('albums');
  }, [setSelectedArtist, setCurrentView]);

  // Handle album click - memoized callback
  const handleAlbumClick = useCallback((album: AlbumInfo) => {
    setSelectedAlbumDetail(album);
  }, []);

  // Handle genre click - memoized callback
  const handleGenreClick = useCallback((genre: string) => {
    setSelectedGenre(genre);
    setCurrentView('songs');
  }, [setSelectedGenre, setCurrentView]);

  // Handle year click - memoized callback
  const handleYearClick = useCallback((year: number) => {
    setSelectedYear(year);
    setCurrentView('songs');
  }, [setSelectedYear, setCurrentView]);

  // Render main content area - USES VIRTUALIZED COMPONENTS
  const renderMainContent = useCallback(() => {
    // Show album detail if selected
    if (selectedAlbumDetail) {
      return (
        <div className="flex-1 flex flex-col overflow-hidden bg-app-surface">
          {/* Album Header */}
          <div className="flex items-start gap-4 p-4 bg-gradient-to-b from-app-surface-dark to-app-surface border-b border-app-border">
            {/* Back Button */}
            <button
              onClick={() => setSelectedAlbumDetail(null)}
              className="p-2 text-app-text-muted hover:text-app-text hover:bg-app-hover rounded transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>

            {/* Album Art */}
            <div className="w-32 h-32 rounded-lg overflow-hidden shadow-medium flex-shrink-0">
              {selectedAlbumDetail.artwork ? (
                <img
                  src={selectedAlbumDetail.artwork}
                  alt={selectedAlbumDetail.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-app-accent to-orange-700">
                  <svg className="w-12 h-12 text-white/30" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 14.5c-2.49 0-4.5-2.01-4.5-4.5S9.51 7.5 12 7.5s4.5 2.01 4.5 4.5-2.01 4.5-4.5 4.5zm0-5.5c-.55 0-1 .45-1 1s.45 1 1 1 1-.45 1-1-.45-1-1-1z"/>
                  </svg>
                </div>
              )}
            </div>

            {/* Album Info */}
            <div className="flex-1 min-w-0 pt-2">
              <p className="text-[10px] font-semibold text-app-text-light uppercase tracking-wide">Album</p>
              <h2 className="text-xl font-bold text-app-text truncate">{selectedAlbumDetail.name}</h2>
              <p className="text-sm text-app-text-muted">{selectedAlbumDetail.artist}</p>
              <p className="text-xs text-app-text-light mt-1">
                {selectedAlbumDetail.trackCount} track{selectedAlbumDetail.trackCount !== 1 ? 's' : ''}
                {selectedAlbumDetail.year && ` · ${selectedAlbumDetail.year}`}
              </p>
              <div className="flex gap-2 mt-3">
                <button
                  onClick={() => {
                    if (selectedAlbumDetail.tracks.length > 0) {
                      // Add album artwork to each track
                      const tracksWithArtwork = selectedAlbumDetail.tracks.map(track => ({
                        ...track,
                        artwork: track.artwork || track.artworkUrl || selectedAlbumDetail.artwork
                      }));
                      setQueue(tracksWithArtwork);
                    }
                  }}
                  className="px-4 py-1.5 text-xs font-medium text-white bg-green-600 hover:bg-green-700 rounded transition-colors flex items-center gap-1"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z"/>
                  </svg>
                  Play Album
                </button>
                <button
                  onClick={() => {
                    setSelectedAlbum(selectedAlbumDetail.name);
                    setCurrentView('songs');
                    setSelectedAlbumDetail(null);
                  }}
                  className="px-4 py-1.5 text-xs font-medium text-white bg-app-accent hover:bg-app-accent-hover rounded transition-colors"
                >
                  View All Tracks
                </button>
                <button
                  onClick={() => setSelectedAlbumDetail(null)}
                  className="px-4 py-1.5 text-xs font-medium text-app-text-muted hover:text-app-text border border-app-border hover:bg-app-hover rounded transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>

          {/* Album Tracks - VIRTUALIZED */}
          <VirtualizedColumnTrackList tracks={selectedAlbumDetail.tracks} onRescanArtwork={handleRescanArtwork} />
        </div>
      );
    }

    switch (currentView) {
      case 'artists':
        return <ArtistList artists={artists} onArtistClick={handleArtistClick} />;

      case 'albums':
        if (albumViewMode === 'grid') {
          // VIRTUALIZED ALBUM GRID
          return <VirtualizedAlbumGrid albums={albums} onAlbumClick={handleAlbumClick} />;
        }
        // List view remains non-virtualized (used less frequently)
        return (
          <div className="flex-1 overflow-y-auto bg-app-surface">
            {albums.map((album, index) => (
              <button
                key={`${album.name}__${album.artist}`}
                onClick={() => handleAlbumClick(album)}
                className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors ${
                  index % 2 === 0 ? 'bg-app-surface' : 'bg-app-surface-dark'
                } hover:bg-app-hover`}
              >
                <div className="w-11 h-11 rounded-lg overflow-hidden flex-shrink-0 bg-app-surface-light shadow-soft">
                  {album.artwork ? (
                    <img src={album.artwork} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-app-accent to-orange-700">
                      <svg className="w-5 h-5 text-white/50" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 14.5c-2.49 0-4.5-2.01-4.5-4.5S9.51 7.5 12 7.5s4.5 2.01 4.5 4.5-2.01 4.5-4.5 4.5zm0-5.5c-.55 0-1 .45-1 1s.45 1 1 1 1-.45 1-1-.45-1-1-1z"/>
                      </svg>
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-app-text truncate">{album.name}</p>
                  <p className="text-xs text-app-text-muted truncate">{album.artist}</p>
                </div>
                <span className="text-xs text-app-text-light">
                  {album.trackCount} track{album.trackCount !== 1 ? 's' : ''}
                </span>
              </button>
            ))}
          </div>
        );

      case 'genres':
        return <GenreList genres={genres} onGenreClick={handleGenreClick} />;

      case 'years':
        return <YearList years={years} onYearClick={handleYearClick} />;

      case 'songs':
      case 'nowPlaying':
      case 'playlist':
      default:
        // VIRTUALIZED TRACK LIST - Handles 65k+ tracks
        return <VirtualizedColumnTrackList tracks={displayTracks} onRescanArtwork={handleRescanArtwork} />;
    }
  }, [
    selectedAlbumDetail,
    currentView,
    albumViewMode,
    artists,
    albums,
    genres,
    years,
    displayTracks,
    handleArtistClick,
    handleAlbumClick,
    handleGenreClick,
    handleYearClick,
    handleRescanArtwork,
    setQueue,
    setSelectedAlbum,
    setCurrentView
  ]);

  return (
    <div className="h-full flex flex-col bg-app-bg text-app-text">
      {/* Title Bar */}
      <TitleBar variant="modern" />

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar - Tree Navigation */}
        <div className="w-56 flex-shrink-0 bg-app-surface-dark border-r border-app-border flex flex-col">
          <TreeNavigation />

          
        </div>

        {/* Center - Main Content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <Toolbar />
          {renderMainContent()}
          <StatusBar />
        </div>

        {/* Right Sidebar - Now Playing */}
        {showNowPlaying && (
          <div className="w-80 flex-shrink-0 bg-app-surface-dark border-l border-app-border">
            <NowPlayingPanel />
          </div>
        )}
      </div>

      {/* Bottom Player Controls */}
      <div className="flex-shrink-0 bg-app-surface-dark border-t border-app-border">
        <div className="flex items-center px-4 py-2 gap-4">
          {/* Current Track Info - Left Side */}
          <div className="w-64 min-w-0 flex-shrink-0">
            {currentTrack && (
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded bg-app-surface flex-shrink-0 overflow-hidden">
                  {(currentTrack.artwork || currentTrack.artworkUrl) ? (
                    <img src={currentTrack.artwork || currentTrack.artworkUrl} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-app-accent to-orange-700" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-app-text truncate">{currentTrack.title}</p>
                  <p className="text-xs text-app-text-muted truncate">{currentTrack.artist}</p>
                </div>
              </div>
            )}
          </div>

          {/* Playback Controls - Center */}
          <div className="flex-1 flex flex-col items-center justify-center gap-2 max-w-2xl mx-auto">
            <PlaybackControls
              repeatMode={repeatMode}
              shuffleMode={shuffleMode}
              onRepeatToggle={cycleRepeatMode}
              onShuffleToggle={toggleShuffle}
            />
            <div className="w-full">
              <ProgressBar onSeek={onSeek} />
            </div>
          </div>

          {/* Volume Control - Right Side */}
          <div className="w-32 flex-shrink-0">
            <VolumeControl />
          </div>
        </div>
      </div>
    </div>
  );
}
