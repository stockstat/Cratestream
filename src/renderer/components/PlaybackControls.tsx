import { usePlayerStore } from '../store/playerStore';

interface PlaybackControlsProps {
  variant?: 'modern' | 'winamp';
  repeatMode?: 'off' | 'all' | 'one';
  shuffleMode?: boolean;
  onRepeatToggle?: () => void;
  onShuffleToggle?: () => void;
}

export function PlaybackControls({ 
  variant = 'modern',
  repeatMode = 'off',
  shuffleMode = false,
  onRepeatToggle,
  onShuffleToggle
}: PlaybackControlsProps) {
  const {
    isPlaying,
    togglePlayPause,
    nextTrack,
    previousTrack,
    currentTrack,
  } = usePlayerStore();

  if (variant === 'winamp') {
    return (
      <div className="flex items-center gap-[2px]">
        <button
          onClick={previousTrack}
          disabled={!currentTrack}
          className="winamp-btn w-[23px] h-[18px] bg-[#3a3a5c] border-t border-l border-[#5a5a7c] border-b border-r border-[#1a1a2c] active:border-t-[#1a1a2c] active:border-l-[#1a1a2c] active:border-b-[#5a5a7c] active:border-r-[#5a5a7c] flex items-center justify-center disabled:opacity-50"
          title="Previous"
        >
          <span className="text-[10px] text-[#00ff00]">⮜</span>
        </button>
        <button
          onClick={togglePlayPause}
          disabled={!currentTrack}
          className="winamp-btn w-[23px] h-[18px] bg-[#3a3a5c] border-t border-l border-[#5a5a7c] border-b border-r border-[#1a1a2c] active:border-t-[#1a1a2c] active:border-l-[#1a1a2c] active:border-b-[#5a5a7c] active:border-r-[#5a5a7c] flex items-center justify-center disabled:opacity-50"
          title={isPlaying ? 'Pause' : 'Play'}
        >
          <span className="text-[10px] text-[#00ff00]">{isPlaying ? '⏸' : '▶'}</span>
        </button>
        <button
          onClick={() => usePlayerStore.getState().setIsPlaying(false)}
          disabled={!currentTrack}
          className="winamp-btn w-[23px] h-[18px] bg-[#3a3a5c] border-t border-l border-[#5a5a7c] border-b border-r border-[#1a1a2c] active:border-t-[#1a1a2c] active:border-l-[#1a1a2c] active:border-b-[#5a5a7c] active:border-r-[#5a5a7c] flex items-center justify-center disabled:opacity-50"
          title="Stop"
        >
          <span className="text-[10px] text-[#00ff00]">⏹</span>
        </button>
        <button
          onClick={nextTrack}
          disabled={!currentTrack}
          className="winamp-btn w-[23px] h-[18px] bg-[#3a3a5c] border-t border-l border-[#5a5a7c] border-b border-r border-[#1a1a2c] active:border-t-[#1a1a2c] active:border-l-[#1a1a2c] active:border-b-[#5a5a7c] active:border-r-[#5a5a7c] flex items-center justify-center disabled:opacity-50"
          title="Next"
        >
          <span className="text-[10px] text-[#00ff00]">⮞</span>
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3">
      {/* Shuffle Button */}
      <button
        onClick={onShuffleToggle}
        disabled={!currentTrack}
        className={`w-8 h-8 flex items-center justify-center rounded transition-colors ${
          shuffleMode
            ? 'text-app-accent hover:text-app-accent-hover'
            : 'text-app-text-light hover:text-app-text'
        } disabled:opacity-30`}
        title={shuffleMode ? 'Shuffle: On' : 'Shuffle: Off'}
      >
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
          <path d="M10.59 9.17L5.41 4 4 5.41l5.17 5.17 1.42-1.41zM14.5 4l2.04 2.04L4 18.59 5.41 20 17.96 7.46 20 9.5V4h-5.5zm.33 9.41l-1.41 1.41 3.13 3.13L14.5 20H20v-5.5l-2.04 2.04-3.13-3.13z"/>
        </svg>
      </button>

      {/* Previous Button */}
      <button
        onClick={previousTrack}
        disabled={!currentTrack}
        className="w-9 h-9 flex items-center justify-center text-app-text-muted hover:text-app-text disabled:opacity-30 transition-colors"
        title="Previous"
      >
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M6 6h2v12H6zm3.5 6l8.5 6V6z"/>
        </svg>
      </button>

      {/* Play/Pause Button */}
      <button
        onClick={togglePlayPause}
        disabled={!currentTrack}
        className="w-11 h-11 flex items-center justify-center bg-app-accent hover:bg-app-accent-hover disabled:bg-app-surface-light rounded-full transition-colors"
        title={isPlaying ? 'Pause' : 'Play'}
      >
        {isPlaying ? (
          <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
            <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>
          </svg>
        ) : (
          <svg className="w-5 h-5 text-white ml-0.5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M8 5v14l11-7z"/>
          </svg>
        )}
      </button>

      {/* Next Button */}
      <button
        onClick={nextTrack}
        disabled={!currentTrack}
        className="w-9 h-9 flex items-center justify-center text-app-text-muted hover:text-app-text disabled:opacity-30 transition-colors"
        title="Next"
      >
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z"/>
        </svg>
      </button>

      {/* Repeat Button */}
      <button
        onClick={onRepeatToggle}
        disabled={!currentTrack}
        className={`w-8 h-8 flex items-center justify-center rounded transition-colors relative ${
          repeatMode !== 'off'
            ? 'text-app-accent hover:text-app-accent-hover'
            : 'text-app-text-light hover:text-app-text'
        } disabled:opacity-30`}
        title={
          repeatMode === 'all'
            ? 'Repeat: All'
            : repeatMode === 'one'
            ? 'Repeat: One'
            : 'Repeat: Off'
        }
      >
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
          <path d="M7 7h10v3l4-4-4-4v3H5v6h2V7zm10 10H7v-3l-4 4 4 4v-3h12v-6h-2v4z"/>
        </svg>
        {repeatMode === 'one' && (
          <span className="absolute top-0.5 right-0.5 text-[10px] font-bold">1</span>
        )}
      </button>
    </div>
  );
}
