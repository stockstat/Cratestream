import { memo, useCallback, useState, useEffect, useRef } from 'react';
import type { Track } from '../../types';
import { usePlayerStore } from '../../store/playerStore';
import { ContextMenu } from '../ContextMenu';

interface VirtualizedColumnTrackListProps {
  tracks: Track[];
  onRescanArtwork?: (tracks: Track[]) => void;
}

const ITEM_HEIGHT = 32; // Height of each row
const BUFFER_SIZE = 10; // Extra items to render above/below viewport

function formatDuration(seconds: number): string {
  if (!isFinite(seconds) || seconds < 0) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export const VirtualizedColumnTrackList = memo(({ tracks, onRescanArtwork }: VirtualizedColumnTrackListProps) => {
  const { setQueue } = usePlayerStore();
  const containerRef = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState(0);
  const [containerHeight, setContainerHeight] = useState(600);
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    track: Track;
  } | null>(null);

  // Update container height on mount and resize
  useEffect(() => {
    const updateHeight = () => {
      if (containerRef.current) {
        setContainerHeight(containerRef.current.clientHeight);
      }
    };
    
    updateHeight();
    window.addEventListener('resize', updateHeight);
    return () => window.removeEventListener('resize', updateHeight);
  }, []);

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  }, []);

  const handleContextMenu = useCallback((e: React.MouseEvent, track: Track) => {
    e.preventDefault();
    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      track,
    });
  }, []);

  const handleDoubleClick = useCallback((track: Track) => {
    const trackIndex = tracks.findIndex(t => t.id === track.id);
    const queue = [track, ...tracks.slice(trackIndex + 1), ...tracks.slice(0, trackIndex)];
    setQueue(queue);
  }, [tracks, setQueue]);

  const closeContextMenu = useCallback(() => {
    setContextMenu(null);
  }, []);

  // Calculate which items to render
  const totalHeight = tracks.length * ITEM_HEIGHT;
  const startIndex = Math.max(0, Math.floor(scrollTop / ITEM_HEIGHT) - BUFFER_SIZE);
  const endIndex = Math.min(
    tracks.length,
    Math.ceil((scrollTop + containerHeight) / ITEM_HEIGHT) + BUFFER_SIZE
  );
  const visibleTracks = tracks.slice(startIndex, endIndex);
  const offsetY = startIndex * ITEM_HEIGHT;

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-app-surface">
      {/* Column Headers */}
      <div className="flex items-center px-4 py-2 text-[10px] font-semibold text-app-text-light uppercase tracking-wide bg-app-surface-dark border-b border-app-border">
        <div className="w-12 flex-shrink-0 text-right pr-3">#</div>
        <div className="flex-1 min-w-0 pr-3">Title</div>
        <div className="w-48 flex-shrink-0 pr-3">Artist</div>
        <div className="w-48 flex-shrink-0 pr-3">Album</div>
        <div className="w-16 flex-shrink-0 text-center">Year</div>
        <div className="w-16 flex-shrink-0 text-right">Time</div>
      </div>

      {/* Virtualized Track List */}
      {tracks.length === 0 ? (
        <div className="flex-1 flex items-center justify-center text-app-text-light">
          <p>No tracks found</p>
        </div>
      ) : (
        <div 
          ref={containerRef}
          className="flex-1 overflow-y-auto bg-app-surface"
          onScroll={handleScroll}
        >
          <div style={{ height: totalHeight, position: 'relative' }}>
            <div style={{ transform: `translateY(${offsetY}px)` }}>
              {visibleTracks.map((track, idx) => {
                const actualIndex = startIndex + idx;
                return (
                  <div
                    key={track.id}
                    className={`flex items-center px-4 py-1 text-xs ${
                      actualIndex % 2 === 0 ? 'bg-app-surface' : 'bg-app-surface-dark'
                    } hover:bg-app-hover cursor-pointer transition-colors`}
                    style={{ height: ITEM_HEIGHT }}
                    onContextMenu={(e) => handleContextMenu(e, track)}
                    onDoubleClick={() => handleDoubleClick(track)}
                  >
                    {/* Track Number */}
                    <div className="w-12 flex-shrink-0 text-app-text-light text-right pr-3">
                      {track.trackNumber || actualIndex + 1}
                    </div>

                    {/* Title */}
                    <div className="flex-1 min-w-0 text-app-text truncate pr-3">
                      {track.title}
                    </div>

                    {/* Artist */}
                    <div className="w-48 flex-shrink-0 text-app-text-muted truncate pr-3">
                      {track.artist}
                    </div>

                    {/* Album */}
                    <div className="w-48 flex-shrink-0 text-app-text-muted truncate pr-3">
                      {track.album}
                    </div>

                    {/* Year */}
                    <div className="w-16 flex-shrink-0 text-app-text-light text-center">
                      {track.year || '—'}
                    </div>

                    {/* Duration */}
                    <div className="w-16 flex-shrink-0 text-app-text-light text-right">
                      {formatDuration(track.duration)}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Context Menu */}
      {contextMenu && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          track={contextMenu.track}
          onClose={closeContextMenu}
          onRescanArtwork={onRescanArtwork}
        />
      )}

      {/* Track Count */}
      <div className="flex-shrink-0 px-4 py-1 text-[10px] text-app-text-light bg-app-surface-dark border-t border-app-border">
        {tracks.length.toLocaleString()} tracks
      </div>
    </div>
  );
});

VirtualizedColumnTrackList.displayName = 'VirtualizedColumnTrackList';
