import { usePlayerStore } from '../../store/playerStore';

interface NowPlayingPanelProps {
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

function formatDuration(seconds: number): string {
  if (!isFinite(seconds) || seconds < 0) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export function NowPlayingPanel({ isCollapsed = false, onToggleCollapse }: NowPlayingPanelProps) {
  const { currentTrack, queue, queueIndex } = usePlayerStore();

  if (isCollapsed) {
    return (
      <button
        onClick={onToggleCollapse}
        className="h-full w-8 flex flex-col items-center justify-center bg-app-surface-dark border-l border-app-border hover:bg-app-hover transition-colors"
      >
        <svg className="w-4 h-4 text-app-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        <span className="text-[9px] text-app-text-muted mt-2 writing-vertical">Now Playing</span>
      </button>
    );
  }

  // FIXED: Show ALL remaining tracks instead of just 5
  const upNextTracks = queue.slice(queueIndex + 1);

  return (
    <div className="w-64 flex flex-col bg-app-surface border-l border-app-border h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-app-border bg-app-surface-dark flex-shrink-0">
        <span className="text-xs font-semibold text-app-text-muted uppercase tracking-wide">Now Playing</span>
        <button
          onClick={onToggleCollapse}
          className="p-1 text-app-text-muted hover:text-app-text transition-colors"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {/* Current Track */}
      {currentTrack ? (
        <div className="p-4 border-b border-app-border flex-shrink-0">
          {/* Album Art */}
          <div className="aspect-square rounded-lg overflow-hidden bg-app-surface-light mb-3 shadow-medium">
            {(currentTrack.artwork || currentTrack.artworkUrl) ? (
              <img
                src={currentTrack.artwork || currentTrack.artworkUrl}
                alt={currentTrack.album || 'Album artwork'}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-app-accent to-orange-700">
                <svg className="w-16 h-16 text-white/30" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/>
                </svg>
              </div>
            )}
          </div>

          {/* Track Info */}
          <div className="text-center">
            <h3 className="text-sm font-semibold text-app-text truncate">{currentTrack.title}</h3>
            <p className="text-xs text-app-text-muted truncate">{currentTrack.artist}</p>
            <p className="text-[10px] text-app-text-light truncate">{currentTrack.album}</p>
          </div>

          {/* Track Details */}
          <div className="mt-3 grid grid-cols-2 gap-2 text-[10px]">
            {currentTrack.genre && (
              <div className="flex items-center gap-1">
                <span className="text-app-text-light">Genre:</span>
                <span className="text-app-text-muted truncate">{currentTrack.genre}</span>
              </div>
            )}
            {currentTrack.year && (
              <div className="flex items-center gap-1">
                <span className="text-app-text-light">Year:</span>
                <span className="text-app-text-muted">{currentTrack.year}</span>
              </div>
            )}
            {currentTrack.bitrate && (
              <div className="flex items-center gap-1">
                <span className="text-app-text-light">Bitrate:</span>
                <span className="text-app-text-muted">{currentTrack.bitrate} kbps</span>
              </div>
            )}
            {currentTrack.format && (
              <div className="flex items-center gap-1">
                <span className="text-app-text-light">Format:</span>
                <span className="text-app-text-muted">{currentTrack.format}</span>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="p-4 text-center border-b border-app-border flex-shrink-0">
          <div className="w-20 h-20 mx-auto rounded-lg bg-app-surface-light flex items-center justify-center mb-3">
            <svg className="w-10 h-10 text-app-text-light" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/>
            </svg>
          </div>
          <p className="text-xs text-app-text-light">No track playing</p>
        </div>
      )}

      {/* Up Next Queue - FIXED: Now scrollable with visible scrollbar */}
      <div className="flex-1 flex flex-col min-h-0">
        <div className="px-3 py-2 bg-app-surface-dark flex-shrink-0">
          <span className="text-[10px] font-semibold text-app-text-light uppercase tracking-wide">Up Next</span>
          {queue.length > 0 && (
            <span className="text-[10px] text-app-text-light ml-2">
              ({queueIndex + 1} of {queue.length})
            </span>
          )}
        </div>

        {/* FIXED: Force scrollbar to always show */}
        <div 
          className="flex-1 min-h-0" 
          style={{ 
            overflowY: 'scroll',
            scrollbarWidth: 'thin',
            scrollbarColor: '#374151 #1f2937'
          }}
        >
          {upNextTracks.length === 0 ? (
            <div className="px-3 py-4 text-center">
              <p className="text-[10px] text-app-text-light italic">No more tracks in queue</p>
            </div>
          ) : (
            <div className="space-y-0.5">
              {upNextTracks.map((track, index) => (
                <div
                  key={`${track.id}-${index}`}
                  className="flex items-center gap-2 px-3 py-1.5 hover:bg-app-hover transition-colors cursor-pointer"
                >
                  {/* Mini Album Art */}
                  <div className="w-8 h-8 rounded overflow-hidden flex-shrink-0 bg-app-surface-light">
                    {(track.artwork || track.artworkUrl) ? (
                      <img
                        src={track.artwork || track.artworkUrl}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <svg className="w-4 h-4 text-app-text-light" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/>
                        </svg>
                      </div>
                    )}
                  </div>

                  {/* Track Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] text-app-text truncate">{track.title}</p>
                    <p className="text-[10px] text-app-text-light truncate">{track.artist}</p>
                  </div>

                  {/* Duration */}
                  <span className="text-[10px] text-app-text-light flex-shrink-0">
                    {formatDuration(track.duration)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
