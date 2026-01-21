import { useCallback, useState, useRef, useEffect } from 'react';
import { usePlayerStore } from '../../store/playerStore';
import { useLibraryStore, SortField } from '../../store/libraryStore';
import { ContextMenu } from '../ContextMenu';
import type { Track } from '../../types';

interface ColumnTrackListProps {
  tracks: Track[];
  onTrackSelect?: (track: Track, index: number) => void;
  onRescanArtwork?: (tracks: Track[]) => void;
}

function formatDuration(seconds: number): string {
  if (!isFinite(seconds) || seconds < 0) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

function formatBitrate(bitrate?: number): string {
  if (!bitrate) return '-';
  return `${bitrate} kbps`;
}

interface ColumnConfig {
  id: string;
  label: string;
  width: number;
  minWidth: number;
  sortField?: SortField;
  align?: 'left' | 'right' | 'center';
}

const defaultColumns: ColumnConfig[] = [
  { id: 'trackNumber', label: '#', width: 40, minWidth: 30, sortField: 'trackNumber', align: 'right' },
  { id: 'title', label: 'Title', width: 250, minWidth: 100, sortField: 'title' },
  { id: 'artist', label: 'Artist', width: 180, minWidth: 80, sortField: 'artist' },
  { id: 'album', label: 'Album', width: 180, minWidth: 80, sortField: 'album' },
  { id: 'year', label: 'Year', width: 60, minWidth: 50, sortField: 'year', align: 'center' },
  { id: 'genre', label: 'Genre', width: 100, minWidth: 60, sortField: 'genre' },
  { id: 'duration', label: 'Duration', width: 70, minWidth: 60, sortField: 'duration', align: 'right' },
  { id: 'bitrate', label: 'Bitrate', width: 80, minWidth: 60, sortField: 'bitrate', align: 'right' },
];

export function ColumnTrackList({ tracks, onTrackSelect, onRescanArtwork }: ColumnTrackListProps) {
  const { currentTrack, setQueue } = usePlayerStore();
  const { sortField, sortDirection, toggleSort, selectedTrackIds, setSelectedTrackIds, clearSelection } = useLibraryStore();
  const [columns, setColumns] = useState(defaultColumns);
  const [resizingColumn, setResizingColumn] = useState<string | null>(null);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; track: Track } | null>(null);
  const tableRef = useRef<HTMLDivElement>(null);
  const startXRef = useRef(0);
  const startWidthRef = useRef(0);

  const handleTrackClick = useCallback((track: Track, index: number, event: React.MouseEvent) => {
    if (event.ctrlKey || event.metaKey) {
      const newSelection = new Set(selectedTrackIds);
      if (newSelection.has(track.id)) {
        newSelection.delete(track.id);
      } else {
        newSelection.add(track.id);
      }
      setSelectedTrackIds(newSelection);
    } else if (event.shiftKey && selectedTrackIds.size > 0) {
      const lastSelectedId = Array.from(selectedTrackIds).pop();
      const lastSelectedIndex = tracks.findIndex(t => t.id === lastSelectedId);
      const start = Math.min(lastSelectedIndex, index);
      const end = Math.max(lastSelectedIndex, index);
      const newSelection = new Set<string>();
      for (let i = start; i <= end; i++) {
        newSelection.add(tracks[i].id);
      }
      setSelectedTrackIds(newSelection);
    } else {
      setSelectedTrackIds(new Set([track.id]));
    }
  }, [selectedTrackIds, setSelectedTrackIds, tracks]);

  const handleTrackDoubleClick = useCallback((track: Track, index: number) => {
    if (onTrackSelect) {
      onTrackSelect(track, index);
    } else {
      setQueue(tracks, index);
    }
    clearSelection();
  }, [onTrackSelect, setQueue, tracks, clearSelection]);

  const handleContextMenu = useCallback((e: React.MouseEvent, track: Track) => {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY, track });
  }, []);

  const handleColumnResize = useCallback((columnId: string, event: React.MouseEvent) => {
    event.preventDefault();
    setResizingColumn(columnId);
    startXRef.current = event.clientX;
    const column = columns.find(c => c.id === columnId);
    startWidthRef.current = column?.width || 100;
  }, [columns]);

  useEffect(() => {
    if (!resizingColumn) return;

    const handleMouseMove = (e: MouseEvent) => {
      const delta = e.clientX - startXRef.current;
      const column = columns.find(c => c.id === resizingColumn);
      if (column) {
        const newWidth = Math.max(column.minWidth, startWidthRef.current + delta);
        setColumns(cols => cols.map(c =>
          c.id === resizingColumn ? { ...c, width: newWidth } : c
        ));
      }
    };

    const handleMouseUp = () => {
      setResizingColumn(null);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [resizingColumn, columns]);

  const handleSort = useCallback((field: SortField | undefined) => {
    if (field) {
      toggleSort(field);
    }
  }, [toggleSort]);

  const renderSortIndicator = (field?: SortField) => {
    if (!field || sortField !== field) return null;
    return (
      <span className="ml-1 text-app-accent">
        {sortDirection === 'asc' ? (
          <svg className="w-3 h-3 inline" fill="currentColor" viewBox="0 0 12 12">
            <path d="M6 2l4 6H2z"/>
          </svg>
        ) : (
          <svg className="w-3 h-3 inline" fill="currentColor" viewBox="0 0 12 12">
            <path d="M6 10l4-6H2z"/>
          </svg>
        )}
      </span>
    );
  };

  const renderCell = (track: Track, column: ColumnConfig, index: number) => {
    switch (column.id) {
      case 'trackNumber':
        return (
          <span className="text-app-text-light">
            {currentTrack?.id === track.id ? (
              <span className="text-app-accent">*</span>
            ) : (
              index + 1
            )}
          </span>
        );
      case 'title':
        return (
          <div className="flex items-center gap-2 min-w-0">
            {track.artwork ? (
              <img
                src={track.artwork}
                alt=""
                className="w-6 h-6 rounded flex-shrink-0 object-cover"
              />
            ) : (
              <div className="w-6 h-6 rounded flex-shrink-0 bg-app-surface-light flex items-center justify-center">
                <svg className="w-3 h-3 text-app-text-light" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/>
                </svg>
              </div>
            )}
            <span className="truncate text-app-text">{track.title}</span>
          </div>
        );
      case 'artist':
        return <span className="truncate text-app-text-muted">{track.artist || '-'}</span>;
      case 'album':
        return <span className="truncate text-app-text-muted">{track.album || '-'}</span>;
      case 'year':
        return <span className="text-app-text-muted">{track.year || '-'}</span>;
      case 'genre':
        return <span className="truncate text-app-text-muted">{track.genre || '-'}</span>;
      case 'duration':
        return <span className="text-app-text-muted">{formatDuration(track.duration)}</span>;
      case 'bitrate':
        return <span className="text-app-text-muted">{formatBitrate(track.bitrate)}</span>;
      default:
        return null;
    }
  };

  const getSelectedTracks = () => {
    return tracks.filter(t => selectedTrackIds.has(t.id));
  };

  if (tracks.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-app-text-muted bg-app-surface">
        <svg className="w-16 h-16 mb-4 opacity-30" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/>
        </svg>
        <p className="text-sm font-medium mb-1">No tracks</p>
        <p className="text-xs text-app-text-light">Add music to your library to get started</p>
      </div>
    );
  }

  return (
    <div ref={tableRef} className="flex-1 flex flex-col overflow-hidden bg-app-surface">
      {/* Header */}
      <div className="flex border-b border-app-border bg-app-surface-dark select-none">
        {columns.map((column) => (
          <div
            key={column.id}
            className="relative flex items-center"
            style={{ width: column.width, minWidth: column.minWidth, flexShrink: 0 }}
          >
            <button
              onClick={() => handleSort(column.sortField)}
              className={`flex-1 px-2 py-1.5 text-left text-[11px] font-semibold text-app-text-muted hover:text-app-text hover:bg-app-hover transition-colors truncate ${
                column.align === 'right' ? 'text-right' : column.align === 'center' ? 'text-center' : ''
              } ${column.sortField ? 'cursor-pointer' : 'cursor-default'}`}
            >
              {column.label}
              {renderSortIndicator(column.sortField)}
            </button>
            <div
              onMouseDown={(e) => handleColumnResize(column.id, e)}
              className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-app-accent z-10"
            />
          </div>
        ))}
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto overflow-x-auto">
        {tracks.map((track, index) => {
          const isSelected = selectedTrackIds.has(track.id);
          const isPlaying = currentTrack?.id === track.id;

          return (
            <div
              key={track.id}
              onClick={(e) => handleTrackClick(track, index, e)}
              onDoubleClick={() => handleTrackDoubleClick(track, index)}
              onContextMenu={(e) => handleContextMenu(e, track)}
              className={`flex cursor-pointer transition-colors ${
                isSelected
                  ? 'bg-app-accent-light'
                  : isPlaying
                  ? 'bg-app-selected'
                  : index % 2 === 0
                  ? 'bg-app-surface'
                  : 'bg-app-surface-dark'
              } hover:bg-app-hover`}
            >
              {columns.map((column) => (
                <div
                  key={column.id}
                  className={`px-2 py-1 text-[11px] truncate ${
                    column.align === 'right' ? 'text-right' : column.align === 'center' ? 'text-center' : ''
                  }`}
                  style={{ width: column.width, minWidth: column.minWidth, flexShrink: 0 }}
                >
                  {renderCell(track, column, index)}
                </div>
              ))}
            </div>
          );
        })}
      </div>

      {/* Context Menu */}
      {contextMenu && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          track={contextMenu.track}
          tracks={selectedTrackIds.size > 1 ? getSelectedTracks() : undefined}
          albumName={contextMenu.track.album}
          artistName={contextMenu.track.artist}
          onClose={() => setContextMenu(null)}
          onRescanArtwork={onRescanArtwork}
        />
      )}
    </div>
  );
}
