import { usePlayerStore } from '../../store/playerStore';
import { useLibraryStore } from '../../store/libraryStore';
import { TitleBar } from '../../components/TitleBar';
import { PlaybackControls } from '../../components/PlaybackControls';
import { ProgressBar } from '../../components/ProgressBar';
import { VolumeControl } from '../../components/VolumeControl';
import { TrackList } from '../../components/TrackList';
import { FileOpener } from '../../components/FileOpener';
import { CloudBrowser } from '../../components/CloudBrowser';

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
  } = usePlayerStore();

  const { tracks } = useLibraryStore();

  return (
    <div className="h-full flex flex-col bg-app-bg text-app-text">
      {/* Title Bar */}
      <TitleBar variant="modern" />

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <aside className="w-64 bg-app-surface border-r border-app-surface-light flex flex-col">
          <div className="p-4">
            <h2 className="text-xs font-semibold uppercase tracking-wide text-app-text-muted mb-4">
              Library
            </h2>
            <nav className="space-y-1">
              <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg bg-app-accent/10 text-app-accent">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/>
                </svg>
                <span className="font-medium">All Songs</span>
                <span className="ml-auto text-xs text-app-text-muted">{tracks.length}</span>
              </button>
              <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-app-text-muted hover:bg-app-surface-light transition-colors">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                </svg>
                <span>Artists</span>
              </button>
              <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-app-text-muted hover:bg-app-surface-light transition-colors">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 14.5c-2.49 0-4.5-2.01-4.5-4.5S9.51 7.5 12 7.5s4.5 2.01 4.5 4.5-2.01 4.5-4.5 4.5zm0-5.5c-.55 0-1 .45-1 1s.45 1 1 1 1-.45 1-1-.45-1-1-1z"/>
                </svg>
                <span>Albums</span>
              </button>
            </nav>
          </div>

          <div className="p-4 border-t border-app-surface-light flex-1 overflow-y-auto">
            <CloudBrowser variant="modern" />
          </div>

          <div className="mt-auto p-4 border-t border-app-surface-light">
            <FileOpener variant="modern" />
          </div>
        </aside>

        {/* Main Panel */}
        <main className="flex-1 flex flex-col overflow-hidden">
          {/* Header with Now Playing */}
          <header className="p-6 bg-gradient-to-b from-app-surface to-app-bg">
            <div className="flex items-end gap-6">
              {/* Album Art */}
              <div className="w-48 h-48 rounded-xl overflow-hidden shadow-2xl flex-shrink-0 bg-app-surface-light">
                {currentTrack?.artwork ? (
                  <img
                    src={currentTrack.artwork}
                    alt="Album artwork"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-app-accent to-purple-600">
                    <svg className="w-20 h-20 text-white/50" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/>
                    </svg>
                  </div>
                )}
              </div>

              {/* Track Info */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-app-accent uppercase tracking-wide mb-2">
                  Now Playing
                </p>
                <h1 className="text-4xl font-bold truncate mb-2">
                  {currentTrack?.title || 'No track selected'}
                </h1>
                <p className="text-xl text-app-text-muted truncate">
                  {currentTrack?.artist || 'Select a track to play'}
                </p>
                {currentTrack?.album && (
                  <p className="text-sm text-app-text-muted mt-1">
                    {currentTrack.album}
                    {currentTrack.year && ` • ${currentTrack.year}`}
                  </p>
                )}
              </div>
            </div>
          </header>

          {/* Track List */}
          <TrackList tracks={tracks} variant="modern" />
        </main>
      </div>

      {/* Player Bar */}
      <footer className="h-24 bg-app-surface border-t border-app-surface-light flex items-center px-6 gap-8">
        {/* Track Info (Mini) */}
        <div className="w-64 flex items-center gap-4">
          {currentTrack && (
            <>
              <div className="w-14 h-14 rounded overflow-hidden bg-app-surface-light flex-shrink-0">
                {currentTrack.artwork ? (
                  <img src={currentTrack.artwork} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-app-accent to-purple-600">
                    <span className="text-white text-lg">♪</span>
                  </div>
                )}
              </div>
              <div className="min-w-0">
                <p className="font-medium truncate">{currentTrack.title}</p>
                <p className="text-sm text-app-text-muted truncate">{currentTrack.artist}</p>
              </div>
            </>
          )}
        </div>

        {/* Center Controls */}
        <div className="flex-1 flex flex-col items-center gap-2 max-w-2xl mx-auto">
          <div className="flex items-center gap-4">
            <button
              onClick={toggleShuffle}
              className={`w-8 h-8 flex items-center justify-center rounded transition-colors ${
                shuffleMode === 'on' ? 'text-app-accent' : 'text-app-text-muted hover:text-app-text'
              }`}
              title={`Shuffle: ${shuffleMode}`}
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M10.59 9.17L5.41 4 4 5.41l5.17 5.17 1.42-1.41zM14.5 4l2.04 2.04L4 18.59 5.41 20 17.96 7.46 20 9.5V4h-5.5zm.33 9.41l-1.41 1.41 3.13 3.13L14.5 20H20v-5.5l-2.04 2.04-3.13-3.13z"/>
              </svg>
            </button>
            <PlaybackControls variant="modern" />
            <button
              onClick={cycleRepeatMode}
              className={`w-8 h-8 flex items-center justify-center rounded transition-colors ${
                repeatMode !== 'off' ? 'text-app-accent' : 'text-app-text-muted hover:text-app-text'
              }`}
              title={`Repeat: ${repeatMode}`}
            >
              {repeatMode === 'one' ? (
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M7 7h10v3l4-4-4-4v3H5v6h2V7zm10 10H7v-3l-4 4 4 4v-3h12v-6h-2v4zm-4-2V9h-1l-2 1v1h1.5v4H13z"/>
                </svg>
              ) : (
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M7 7h10v3l4-4-4-4v3H5v6h2V7zm10 10H7v-3l-4 4 4 4v-3h12v-6h-2v4z"/>
                </svg>
              )}
            </button>
          </div>
          <ProgressBar onSeek={onSeek} variant="modern" />
        </div>

        {/* Volume */}
        <div className="w-64 flex justify-end">
          <VolumeControl variant="modern" />
        </div>
      </footer>
    </div>
  );
}
