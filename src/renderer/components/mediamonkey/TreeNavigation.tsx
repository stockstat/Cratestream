import { useState } from 'react';
import { useLibraryStore, ViewType } from '../../store/libraryStore';
import { usePlayerStore } from '../../store/playerStore';
import { PlaylistModal } from '../PlaylistModal';

interface TreeItemProps {
  label: string;
  icon: React.ReactNode;
  count?: number;
  isActive?: boolean;
  onClick?: () => void;
  children?: React.ReactNode;
  defaultExpanded?: boolean;
  indent?: number;
}

function TreeItem({
  label,
  icon,
  count,
  isActive,
  onClick: onClickProp,
  children,
  defaultExpanded = false,
  indent = 0
}: TreeItemProps) {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const hasChildren = !!children;

  return (
    <div>
      <button
        onClick={() => {
          if (onClickProp) onClickProp();
          if (hasChildren) setExpanded(!expanded);
        }}
        className={`w-full flex items-center gap-1.5 px-2 py-1 text-xs hover:bg-app-hover transition-colors ${
          isActive ? 'bg-app-accent/20 text-app-accent font-medium' : 'text-app-text-muted'
        }`}
        style={{ paddingLeft: `${8 + indent * 16}px` }}
      >
        {hasChildren && (
          <span className="w-3 h-3 flex items-center justify-center text-app-text-light">
            {expanded ? (
              <svg className="w-2.5 h-2.5" fill="currentColor" viewBox="0 0 12 12">
                <path d="M2 4l4 4 4-4z"/>
              </svg>
            ) : (
              <svg className="w-2.5 h-2.5" fill="currentColor" viewBox="0 0 12 12">
                <path d="M4 2l4 4-4 4z"/>
              </svg>
            )}
          </span>
        )}
        {!hasChildren && <span className="w-3" />}
        <span className="w-4 h-4 flex items-center justify-center">{icon}</span>
        <span className="flex-1 text-left truncate">{label}</span>
        {count !== undefined && (
          <span className="text-app-text-light text-[10px]">{count}</span>
        )}
      </button>
      {hasChildren && expanded && (
        <div>{children}</div>
      )}
    </div>
  );
}

export function TreeNavigation() {
  const {
    tracks,
    playlists,
    currentView,
    selectedArtist,
    selectedAlbum,
    selectedGenre,
    selectedYear,
    selectedPlaylistId,
    getArtists,
    getAlbums,
    getGenres,
    getYears,
    setCurrentView,
    setSelectedArtist,
    setSelectedAlbum,
    setSelectedGenre,
    setSelectedYear,
    setSelectedPlaylistId,
    createPlaylist,
  } = useLibraryStore();

  const { queue } = usePlayerStore();

  const [showPlaylistModal, setShowPlaylistModal] = useState(false);

  const artists = getArtists();
  const albums = getAlbums();
  const genres = getGenres();
  const years = getYears();

  const handleCreatePlaylist = (name: string) => {
    createPlaylist(name);
  };

  return (
    <>
      <div className="h-full flex flex-col bg-app-surface-dark border-r border-app-border">
        {/* Header */}
        <div className="px-3 py-2 border-b border-app-border">
          <span className="text-xs font-semibold text-app-text-muted uppercase tracking-wide">Media Library</span>
        </div>

        {/* Navigation Tree */}
        <div className="flex-1 overflow-y-auto py-1">
          {/* Now Playing */}
          <TreeItem
            label="Now Playing"
            icon={
              <svg className="w-3.5 h-3.5 text-green-500" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z"/>
              </svg>
            }
            count={queue.length}
            isActive={currentView === 'nowPlaying'}
            onClick={() => setCurrentView('nowPlaying')}
          />

          {/* Music Library */}
          <TreeItem
            label="Music Library"
            icon={
              <svg className="w-3.5 h-3.5 text-app-accent" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/>
              </svg>
            }
            defaultExpanded={true}
          >
            {/* Artists */}
            <TreeItem
              label="Artists"
              icon={
                <svg className="w-3.5 h-3.5 text-purple-400" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                </svg>
              }
              count={artists.length}
              isActive={currentView === 'artists' && !selectedArtist}
              onClick={() => {
                setCurrentView('artists');
                setSelectedArtist(null);
              }}
              indent={1}
              defaultExpanded={false}
            >
              {artists.slice(0, 50).map(artist => (
                <TreeItem
                  key={artist.name}
                  label={artist.name}
                  icon={<span className="text-app-text-light">-</span>}
                  count={artist.trackCount}
                  isActive={selectedArtist === artist.name}
                  onClick={() => setSelectedArtist(artist.name)}
                  indent={2}
                />
              ))}
              {artists.length > 50 && (
                <div className="px-8 py-1 text-[10px] text-app-text-light">
                  +{artists.length - 50} more artists...
                </div>
              )}
            </TreeItem>

            {/* Albums */}
            <TreeItem
              label="Albums"
              icon={
                <svg className="w-3.5 h-3.5 text-app-accent" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 14.5c-2.49 0-4.5-2.01-4.5-4.5S9.51 7.5 12 7.5s4.5 2.01 4.5 4.5-2.01 4.5-4.5 4.5zm0-5.5c-.55 0-1 .45-1 1s.45 1 1 1 1-.45 1-1-.45-1-1-1z"/>
                </svg>
              }
              count={albums.length}
              isActive={currentView === 'albums'}
              onClick={() => setCurrentView('albums')}
              indent={1}
            />

            {/* Songs */}
            <TreeItem
              label="Songs"
              icon={
                <svg className="w-3.5 h-3.5 text-cyan-400" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/>
                </svg>
              }
              count={tracks.length}
              isActive={currentView === 'songs' && !selectedArtist && !selectedAlbum && !selectedGenre && !selectedYear}
              onClick={() => setCurrentView('songs')}
              indent={1}
            />

            {/* Genres */}
            <TreeItem
              label="Genres"
              icon={
                <svg className="w-3.5 h-3.5 text-pink-400" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M4 6H2v14c0 1.1.9 2 2 2h14v-2H4V6zm16-4H8c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H8V4h12v12z"/>
                </svg>
              }
              count={genres.length}
              isActive={currentView === 'genres'}
              onClick={() => setCurrentView('genres')}
              indent={1}
              defaultExpanded={false}
            >
              {genres.slice(0, 20).map(genre => (
                <TreeItem
                  key={genre.name}
                  label={genre.name}
                  icon={<span className="text-app-text-light">-</span>}
                  count={genre.trackCount}
                  isActive={selectedGenre === genre.name}
                  onClick={() => setSelectedGenre(genre.name)}
                  indent={2}
                />
              ))}
            </TreeItem>

            {/* Years */}
            <TreeItem
              label="Years"
              icon={
                <svg className="w-3.5 h-3.5 text-amber-400" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11z"/>
                </svg>
              }
              count={years.length}
              isActive={currentView === 'years'}
              onClick={() => setCurrentView('years')}
              indent={1}
              defaultExpanded={false}
            >
              {years.slice(0, 20).map(yearInfo => (
                <TreeItem
                  key={yearInfo.year}
                  label={String(yearInfo.year)}
                  icon={<span className="text-app-text-light">-</span>}
                  count={yearInfo.trackCount}
                  isActive={selectedYear === yearInfo.year}
                  onClick={() => setSelectedYear(yearInfo.year)}
                  indent={2}
                />
              ))}
            </TreeItem>
          </TreeItem>

          {/* Playlists */}
          <div className="mt-2 pt-2 border-t border-app-border">
            <div className="flex items-center justify-between px-3 py-1">
              <span className="text-xs font-semibold text-app-text-muted uppercase tracking-wide">Playlists</span>
              <button
                onClick={() => setShowPlaylistModal(true)}
                className="p-1 text-app-text-light hover:text-app-accent transition-colors"
                title="Create Playlist"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </button>
            </div>
            {playlists && playlists.length > 0 ? playlists.map(playlist => (
              <TreeItem
                key={playlist.id}
                label={playlist.name}
                icon={
                  <svg className="w-3.5 h-3.5 text-green-400" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M4 6H2v14c0 1.1.9 2 2 2h14v-2H4V6zm16-4H8c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-1 9h-4v4h-2v-4H9V9h4V5h2v4h4v2z"/>
                  </svg>
                }
                count={(playlist as any).tracks?.length || (playlist as any).trackIds?.length || 0}
                isActive={currentView === 'playlist' && selectedPlaylistId === playlist.id}
                onClick={() => setSelectedPlaylistId(playlist.id)}
              />
            )) : null}
            {playlists && playlists.length === 0 && (
              <div className="px-3 py-2 text-[10px] text-app-text-light italic">
                No playlists yet
              </div>
            )}
          </div>
        </div>
      </div>

      <PlaylistModal
        isOpen={showPlaylistModal}
        onClose={() => setShowPlaylistModal(false)}
        onConfirm={handleCreatePlaylist}
      />
    </>
  );
}
