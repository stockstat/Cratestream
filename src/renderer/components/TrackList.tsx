import { useState, useRef, useCallback } from 'react';
import { usePlayerStore } from '../store/playerStore';
import type { Track } from '../types';

interface TrackListProps {
  tracks: Track[];
  variant?: 'modern' | 'winamp';
  onTrackSelect?: (track: Track, index: number) => void;
}

type SortKey = 'index' | 'title' | 'artist' | 'album' | 'year' | 'duration';
type SortDir = 'asc' | 'desc';

function formatDuration(seconds: number): string {
  if (!isFinite(seconds) || seconds < 0) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

const DEFAULT_WIDTHS: Record<SortKey, number> = {
  index:    50,
  title:    340,
  artist:   200,
  album:    240,
  year:     70,
  duration: 70,
};

export function TrackList({ tracks, variant = 'modern', onTrackSelect }: TrackListProps) {
  const { currentTrack, setQueue } = usePlayerStore();

  const [sortKey, setSortKey] = useState<SortKey>('index');
  const [sortDir, setSortDir] = useState<SortDir>('asc');
  const [colWidths, setColWidths] = useState<Record<SortKey, number>>({ ...DEFAULT_WIDTHS });

  const resizeState = useRef<{
    col: SortKey;
    startX: number;
    startW: number;
  } | null>(null);

  // ── Sort ──────────────────────────────────────────────────────────────────
  const handleHeaderClick = (key: SortKey) => {
    setSortDir(prev => (sortKey === key ? (prev === 'asc' ? 'desc' : 'asc') : 'asc'));
    setSortKey(key);
  };

  const sortedTracks = [...tracks].sort((a, b) => {
    if (sortKey === 'index') return 0;
    let cmp = 0;
    switch (sortKey) {
      case 'title':    cmp = (a.title  || '').localeCompare(b.title  || ''); break;
      case 'artist':   cmp = (a.artist || '').localeCompare(b.artist || ''); break;
      case 'album':    cmp = (a.album  || '').localeCompare(b.album  || ''); break;
      case 'year':     cmp = ((a as any).year || 0) - ((b as any).year || 0); break;
      case 'duration': cmp = (a.duration || 0) - (b.duration || 0); break;
    }
    return sortDir === 'asc' ? cmp : -cmp;
  });

  // ── Column resize ─────────────────────────────────────────────────────────
  const startResize = useCallback((e: React.MouseEvent, col: SortKey) => {
    e.preventDefault();
    e.stopPropagation();

    const startX = e.clientX;
    const startW = colWidths[col];

    resizeState.current = { col, startX, startW };

    const onMove = (me: MouseEvent) => {
      const delta = me.clientX - startX;
      const newW  = Math.max(50, startW + delta);
      setColWidths(prev => ({ ...prev, [col]: newW }));
    };

    const onUp = () => {
      resizeState.current = null;
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };

    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  }, [colWidths]);

  const handleTrackClick = (track: Track, index: number) => {
    if (onTrackSelect) {
      onTrackSelect(track, index);
    } else {
      setQueue(sortedTracks, index);
    }
  };

  // ── Sort indicator ────────────────────────────────────────────────────────
  const arrow = (key: SortKey) => {
    if (sortKey !== key) return <span style={{ opacity: 0.25, marginLeft: 4 }}>↕</span>;
    return <span style={{ marginLeft: 4, color: '#ff8c00' }}>{sortDir === 'asc' ? '↑' : '↓'}</span>;
  };

  // Total table width so tableLayout:fixed actually works
  const totalWidth = (Object.values(colWidths) as number[]).reduce((a, b) => a + b, 0);

  // ── Header cell ───────────────────────────────────────────────────────────
  const Th = ({ col, label, align = 'left' }: { col: SortKey; label: string; align?: 'left' | 'right' }) => (
    <th
      style={{
        width:        colWidths[col],
        minWidth:     colWidths[col],
        maxWidth:     colWidths[col],
        position:     'relative',
        userSelect:   'none',
        cursor:       'pointer',
        paddingLeft:  col === 'index' ? 16 : 12,
        paddingRight: 20,
        paddingTop:   10,
        paddingBottom:10,
        textAlign:    align,
        borderRight:  '1px solid rgba(255,255,255,0.08)',
        whiteSpace:   'nowrap',
        overflow:     'hidden',
        boxSizing:    'border-box',
      }}
      onClick={() => handleHeaderClick(col)}
    >
      <span style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#888' }}>
        {label}{arrow(col)}
      </span>
      {/* Resize handle */}
      <span
        onMouseDown={e => startResize(e, col)}
        onClick={e => e.stopPropagation()}
        style={{
          position:  'absolute',
          right:      0,
          top:        0,
          bottom:     0,
          width:      6,
          cursor:     'col-resize',
          zIndex:     10,
          background: 'transparent',
        }}
        onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,140,0,0.5)')}
        onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
      />
    </th>
  );

  // ── Winamp variant ────────────────────────────────────────────────────────
  if (variant === 'winamp') {
    return (
      <div className="flex-1 overflow-y-auto bg-[#0a0a0a] border border-[#3a3a5c]">
        {tracks.length === 0 ? (
          <div className="flex items-center justify-center h-full text-[#00aa00] text-[10px]">
            No tracks — Open files or connect cloud
          </div>
        ) : (
          tracks.map((track, index) => (
            <div
              key={track.id}
              onClick={() => handleTrackClick(track, index)}
              className={`flex items-center gap-2 px-2 py-1 cursor-pointer text-[10px] ${
                currentTrack?.id === track.id
                  ? 'bg-[#0000aa] text-white'
                  : 'text-[#00ff00] hover:bg-[#1a1a3a]'
              }`}
            >
              <span className="w-6 text-right text-[#00aa00]">{index + 1}.</span>
              <span className="flex-1 truncate">
                {track.artist ? `${track.artist} - ` : ''}{track.title}
              </span>
              <span className="text-[#00aa00]">{formatDuration(track.duration)}</span>
            </div>
          ))
        )}
      </div>
    );
  }

  // ── Modern variant ────────────────────────────────────────────────────────
  return (
    <div
      className="flex-1"
      style={{ overflowX: 'auto', overflowY: 'auto', height: '100%' }}
    >
      {tracks.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-full text-app-text-muted">
          <svg className="w-16 h-16 mb-4 opacity-50" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/>
          </svg>
          <p className="text-lg font-medium mb-2">No tracks yet</p>
          <p className="text-sm">Open audio files or connect your cloud storage</p>
        </div>
      ) : (
        <table
          style={{
            width:          totalWidth,
            minWidth:       totalWidth,
            tableLayout:    'fixed',
            borderCollapse: 'collapse',
          }}
        >
          <colgroup>
            {(Object.keys(DEFAULT_WIDTHS) as SortKey[]).map(col => (
              <col key={col} style={{ width: colWidths[col] }} />
            ))}
          </colgroup>

          <thead style={{ position: 'sticky', top: 0, zIndex: 10, background: 'var(--color-app-surface, #1a1a1a)' }}>
            <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.10)' }}>
              <Th col="index"    label="#"    />
              <Th col="title"    label="Title"    />
              <Th col="artist"   label="Artist"   />
              <Th col="album"    label="Album"    />
              <Th col="year"     label="Year"     />
              <Th col="duration" label="Time" align="right" />
            </tr>
          </thead>

          <tbody>
            {sortedTracks.map((track, index) => {
              const isActive = currentTrack?.id === track.id;
              return (
                <tr
                  key={track.id}
                  onClick={() => handleTrackClick(track, index)}
                  style={{
                    cursor:       'pointer',
                    background:    isActive ? 'rgba(255,140,0,0.12)' : 'transparent',
                    borderBottom: '1px solid rgba(255,255,255,0.04)',
                    transition:   'background 0.12s',
                  }}
                  onMouseEnter={e => { if (!isActive) (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.05)'; }}
                  onMouseLeave={e => { if (!isActive) (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
                >
                  {/* # */}
                  <td style={{
                    width: colWidths.index, minWidth: colWidths.index, maxWidth: colWidths.index,
                    padding: '10px 8px 10px 16px',
                    fontSize: 13,
                    color: isActive ? '#ff8c00' : '#666',
                    borderRight: '1px solid rgba(255,255,255,0.06)',
                    textAlign: 'center',
                    boxSizing: 'border-box',
                  }}>
                    {isActive ? '▶' : index + 1}
                  </td>

                  {/* Title */}
                  <td style={{
                    width: colWidths.title, minWidth: colWidths.title, maxWidth: colWidths.title,
                    padding: '8px 12px',
                    borderRight: '1px solid rgba(255,255,255,0.06)',
                    overflow: 'hidden',
                    boxSizing: 'border-box',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      {track.artwork ? (
                        <img src={track.artwork} alt="" style={{ width: 36, height: 36, borderRadius: 4, objectFit: 'cover', flexShrink: 0 }} />
                      ) : (
                        <div style={{ width: 36, height: 36, borderRadius: 4, background: 'rgba(255,255,255,0.07)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <span style={{ color: '#555', fontSize: 14 }}>♪</span>
                        </div>
                      )}
                      <span style={{ fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: isActive ? '#ff8c00' : '#e0e0e0', fontSize: 13 }}>
                        {track.title}
                      </span>
                    </div>
                  </td>

                  {/* Artist */}
                  <td style={{
                    width: colWidths.artist, minWidth: colWidths.artist, maxWidth: colWidths.artist,
                    padding: '10px 12px',
                    fontSize: 13, color: isActive ? '#ff8c00' : '#999',
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    borderRight: '1px solid rgba(255,255,255,0.06)',
                    boxSizing: 'border-box',
                  }}>
                    {track.artist || 'Unknown Artist'}
                  </td>

                  {/* Album */}
                  <td style={{
                    width: colWidths.album, minWidth: colWidths.album, maxWidth: colWidths.album,
                    padding: '10px 12px',
                    fontSize: 13, color: '#777',
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    borderRight: '1px solid rgba(255,255,255,0.06)',
                    boxSizing: 'border-box',
                  }}>
                    {track.album || ''}
                  </td>

                  {/* Year */}
                  <td style={{
                    width: colWidths.year, minWidth: colWidths.year, maxWidth: colWidths.year,
                    padding: '10px 12px',
                    fontSize: 13, color: '#666',
                    borderRight: '1px solid rgba(255,255,255,0.06)',
                    textAlign: 'center',
                    boxSizing: 'border-box',
                  }}>
                    {(track as any).year || ''}
                  </td>

                  {/* Duration */}
                  <td style={{
                    width: colWidths.duration, minWidth: colWidths.duration, maxWidth: colWidths.duration,
                    padding: '10px 16px 10px 8px',
                    fontSize: 13, color: '#666',
                    textAlign: 'right',
                    boxSizing: 'border-box',
                  }}>
                    {formatDuration(track.duration)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </div>
  );
}
