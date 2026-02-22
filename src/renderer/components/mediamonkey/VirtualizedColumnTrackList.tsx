import { memo, useCallback, useState, useEffect, useRef } from 'react';
import type { Track } from '../../types';
import { usePlayerStore } from '../../store/playerStore';
import { ContextMenu } from '../ContextMenu';

interface VirtualizedColumnTrackListProps {
  tracks: Track[];
  onRescanArtwork?: (tracks: Track[]) => void;
}

const ITEM_HEIGHT = 32;
const BUFFER_SIZE = 10;

type SortField = 'index' | 'title' | 'artist' | 'album' | 'year' | 'duration';
type SortDir = 'asc' | 'desc';

interface ColumnConfig {
  id: SortField;
  label: string;
  width: number;
  minWidth: number;
  align?: 'left' | 'right' | 'center';
  flex?: boolean;
}

const DEFAULT_COLUMNS: ColumnConfig[] = [
  { id: 'index',    label: '#',      width: 48,  minWidth: 30,  align: 'right' },
  { id: 'artist',   label: 'Artist', width: 200, minWidth: 80  },
  { id: 'title',    label: 'Title',  width: 280, minWidth: 100, flex: true },
  { id: 'album',    label: 'Album',  width: 180, minWidth: 80  },
  { id: 'year',     label: 'Year',   width: 64,  minWidth: 50,  align: 'center' },
  { id: 'duration', label: 'Time',   width: 64,  minWidth: 50,  align: 'right'  },
];

function formatDuration(seconds: number): string {
  if (!isFinite(seconds) || seconds < 0) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export const VirtualizedColumnTrackList = memo(({ tracks, onRescanArtwork }: VirtualizedColumnTrackListProps) => {
  const { currentTrack, setQueue } = usePlayerStore();
  const containerRef = useRef<HTMLDivElement>(null);

  const [scrollTop, setScrollTop]       = useState(0);
  const [containerHeight, setContainerHeight] = useState(600);
  const [sortField, setSortField]       = useState<SortField>('index');
  const [sortDir, setSortDir]           = useState<SortDir>('asc');
  const [columns, setColumns]           = useState<ColumnConfig[]>(DEFAULT_COLUMNS);
  const [contextMenu, setContextMenu]   = useState<{ x: number; y: number; track: Track } | null>(null);

  // resize drag state stored in refs so mousemove never reads stale state
  const resizeDrag = useRef<{ id: SortField; startX: number; startW: number } | null>(null);

  // ── Container height tracking ─────────────────────────────────────────────
  useEffect(() => {
    const update = () => {
      if (containerRef.current) setContainerHeight(containerRef.current.clientHeight);
    };
    update();
    const ro = new ResizeObserver(update);
    if (containerRef.current) ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, []);

  // ── Sort ──────────────────────────────────────────────────────────────────
  const handleHeaderClick = useCallback((field: SortField) => {
    setSortDir(prev => (sortField === field ? (prev === 'asc' ? 'desc' : 'asc') : 'asc'));
    setSortField(field);
  }, [sortField]);

  const sortedTracks = [...tracks].sort((a, b) => {
    if (sortField === 'index') return 0;
    let cmp = 0;
    switch (sortField) {
      case 'title':    cmp = (a.title  || '').localeCompare(b.title  || ''); break;
      case 'artist':   cmp = (a.artist || '').localeCompare(b.artist || ''); break;
      case 'album':    cmp = (a.album  || '').localeCompare(b.album  || ''); break;
      case 'year':     cmp = ((a.year  || 0) as number) - ((b.year   || 0) as number); break;
      case 'duration': cmp = (a.duration || 0) - (b.duration || 0); break;
    }
    return sortDir === 'asc' ? cmp : -cmp;
  });

  // ── Column resize ─────────────────────────────────────────────────────────
  const startResize = useCallback((e: React.MouseEvent, id: SortField) => {
    e.preventDefault();
    e.stopPropagation();
    const col = columns.find(c => c.id === id);
    resizeDrag.current = { id, startX: e.clientX, startW: col?.width ?? 100 };

    const onMove = (me: MouseEvent) => {
      if (!resizeDrag.current) return;
      const delta = me.clientX - resizeDrag.current.startX;
      const col   = columns.find(c => c.id === resizeDrag.current!.id);
      const newW  = Math.max(col?.minWidth ?? 30, resizeDrag.current.startW + delta);
      setColumns(prev => prev.map(c => c.id === resizeDrag.current!.id ? { ...c, width: newW } : c));
    };

    const onUp = () => {
      resizeDrag.current = null;
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup',   onUp);
    };

    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup',   onUp);
  }, [columns]);

  // ── Scroll ────────────────────────────────────────────────────────────────
  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  }, []);

  // ── Context menu / playback ───────────────────────────────────────────────
  const handleContextMenu = useCallback((e: React.MouseEvent, track: Track) => {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY, track });
  }, []);

  const handleDoubleClick = useCallback((track: Track, index: number) => {
    setQueue(sortedTracks, index);
  }, [sortedTracks, setQueue]);

  // ── Virtualization ────────────────────────────────────────────────────────
  const totalHeight  = sortedTracks.length * ITEM_HEIGHT;
  const startIndex   = Math.max(0, Math.floor(scrollTop / ITEM_HEIGHT) - BUFFER_SIZE);
  const endIndex     = Math.min(sortedTracks.length, Math.ceil((scrollTop + containerHeight) / ITEM_HEIGHT) + BUFFER_SIZE);
  const visibleTracks = sortedTracks.slice(startIndex, endIndex);
  const offsetY      = startIndex * ITEM_HEIGHT;

  // ── Sort arrow ────────────────────────────────────────────────────────────
  const arrow = (id: SortField) => {
    if (sortField !== id) return <span style={{ opacity: 0.3, marginLeft: 3 }}>↕</span>;
    return <span style={{ color: '#ff8c00', marginLeft: 3 }}>{sortDir === 'asc' ? '↑' : '↓'}</span>;
  };

  // ── Total header width ────────────────────────────────────────────────────
  const totalWidth = columns.reduce((s, c) => s + c.width, 0);

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-app-surface">

      {/* ── Column Headers ─────────────────────────────────────────────── */}
      <div
        style={{
          display:         'flex',
          minWidth:         totalWidth,
          background:       'var(--color-app-surface-dark, #141414)',
          borderBottom:     '1px solid rgba(255,255,255,0.08)',
          userSelect:       'none',
          position:         'relative',
          zIndex:            10,
        }}
      >
        {columns.map(col => (
          <div
            key={col.id}
            onClick={() => handleHeaderClick(col.id)}
            style={{
              width:       col.width,
              minWidth:    col.width,
              flexShrink:  0,
              position:    'relative',
              cursor:      'pointer',
              padding:     '6px 20px 6px 8px',
              textAlign:   col.align || 'left',
              boxSizing:   'border-box',
              whiteSpace:  'nowrap',
              overflow:    'hidden',
            }}
          >
            <span style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.07em', color: '#777' }}>
              {col.label}{arrow(col.id)}
            </span>
            {/* resize handle */}
            <span
              onMouseDown={e => startResize(e, col.id)}
              onClick={e => e.stopPropagation()}
              style={{
                position:   'absolute',
                right:       0, top: 0, bottom: 0,
                width:       5,
                cursor:      'col-resize',
                zIndex:      20,
              }}
              onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,140,0,0.5)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
            />
          </div>
        ))}
      </div>

      {/* ── Track rows ─────────────────────────────────────────────────── */}
      {sortedTracks.length === 0 ? (
        <div className="flex-1 flex items-center justify-center text-app-text-light">
          <p>No tracks found</p>
        </div>
      ) : (
        <div
          ref={containerRef}
          className="flex-1 overflow-y-auto overflow-x-auto bg-app-surface"
          onScroll={handleScroll}
        >
          <div style={{ height: totalHeight, position: 'relative', minWidth: totalWidth }}>
            <div style={{ transform: `translateY(${offsetY}px)` }}>
              {visibleTracks.map((track, idx) => {
                const actualIndex = startIndex + idx;
                const isPlaying   = currentTrack?.id === track.id;

                return (
                  <div
                    key={track.id}
                    style={{
                      display:      'flex',
                      height:        ITEM_HEIGHT,
                      minWidth:      totalWidth,
                      background:    isPlaying
                        ? 'rgba(255,140,0,0.13)'
                        : actualIndex % 2 === 0
                          ? 'transparent'
                          : 'rgba(255,255,255,0.02)',
                      cursor:       'pointer',
                      transition:   'background 0.1s',
                      alignItems:   'center',
                    }}
                    onMouseEnter={e => { if (!isPlaying) (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.06)'; }}
                    onMouseLeave={e => {
                      if (!isPlaying) (e.currentTarget as HTMLElement).style.background =
                        actualIndex % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.02)';
                    }}
                    onContextMenu={e => handleContextMenu(e, track)}
                    onDoubleClick={() => handleDoubleClick(track, actualIndex)}
                  >
                    {columns.map(col => (
                      <div
                        key={col.id}
                        style={{
                          width:      col.width,
                          minWidth:   col.width,
                          flexShrink: 0,
                          padding:    '0 8px',
                          fontSize:   12,
                          textAlign:  col.align || 'left',
                          overflow:   'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          boxSizing:  'border-box',
                          color:      isPlaying ? '#ff8c00' : undefined,
                        }}
                      >
                        {col.id === 'index'    && (isPlaying ? '▶' : actualIndex + 1)}
                        {col.id === 'title'    && <span style={{ color: isPlaying ? '#ff8c00' : '#e0e0e0' }}>{track.title}</span>}
                        {col.id === 'artist'   && <span style={{ color: isPlaying ? '#ff8c00' : '#999' }}>{track.artist || '—'}</span>}
                        {col.id === 'album'    && <span style={{ color: '#777' }}>{track.album  || ''}</span>}
                        {col.id === 'year'     && <span style={{ color: '#666' }}>{(track as any).year || ''}</span>}
                        {col.id === 'duration' && <span style={{ color: '#666' }}>{formatDuration(track.duration)}</span>}
                      </div>
                    ))}
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
          onClose={() => setContextMenu(null)}
          onRescanArtwork={onRescanArtwork}
        />
      )}

      {/* Status bar */}
      <div style={{ padding: '3px 12px', fontSize: 10, color: '#555', background: 'var(--color-app-surface-dark, #141414)', borderTop: '1px solid rgba(255,255,255,0.06)', flexShrink: 0 }}>
        {sortedTracks.length.toLocaleString()} tracks
      </div>
    </div>
  );
});

VirtualizedColumnTrackList.displayName = 'VirtualizedColumnTrackList';
