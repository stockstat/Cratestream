import { memo, useCallback, useState, useEffect, useRef } from 'react';
import type { AlbumInfo } from '../../store/libraryStore';

interface VirtualizedAlbumGridProps {
  albums: AlbumInfo[];
  onAlbumClick: (album: AlbumInfo) => void;
}

const CARD_WIDTH = 220;
const CARD_HEIGHT = 300;
const BUFFER_ROWS = 2;

export const VirtualizedAlbumGrid = memo(({ albums, onAlbumClick }: VirtualizedAlbumGridProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState(0);
  const [containerWidth, setContainerWidth] = useState(1200);
  const [containerHeight, setContainerHeight] = useState(600);

  // Update container dimensions
  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        setContainerWidth(containerRef.current.clientWidth);
        setContainerHeight(containerRef.current.clientHeight);
      }
    };
    
    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  }, []);

  // Calculate grid layout
  const columnsPerRow = Math.max(2, Math.floor(containerWidth / CARD_WIDTH));
  const totalRows = Math.ceil(albums.length / columnsPerRow);
  const totalHeight = totalRows * CARD_HEIGHT;

  // Calculate visible range
  const startRow = Math.max(0, Math.floor(scrollTop / CARD_HEIGHT) - BUFFER_ROWS);
  const endRow = Math.min(
    totalRows,
    Math.ceil((scrollTop + containerHeight) / CARD_HEIGHT) + BUFFER_ROWS
  );

  const startIndex = startRow * columnsPerRow;
  const endIndex = Math.min(albums.length, endRow * columnsPerRow);
  const visibleAlbums = albums.slice(startIndex, endIndex);
  const offsetY = startRow * CARD_HEIGHT;

  return (
    <div className="flex-1 overflow-hidden bg-app-surface">
      {albums.length === 0 ? (
        <div className="flex-1 flex items-center justify-center text-app-text-light">
          <p>No albums found</p>
        </div>
      ) : (
        <div 
          ref={containerRef}
          className="flex-1 overflow-y-auto bg-app-surface"
          onScroll={handleScroll}
          style={{ height: '100%' }}
        >
          <div style={{ height: totalHeight, position: 'relative' }}>
            <div 
              style={{ 
                transform: `translateY(${offsetY}px)`,
                display: 'grid',
                gridTemplateColumns: `repeat(${columnsPerRow}, ${CARD_WIDTH}px)`,
                gap: 0
              }}
            >
              {visibleAlbums.map((album) => (
                <div key={`${album.name}-${album.artist}`} className="p-3">
                  <button
                    onClick={() => onAlbumClick(album)}
                    className="group w-full bg-app-surface-dark rounded-lg overflow-hidden hover:bg-app-hover transition-all duration-200 hover:scale-105 shadow-soft hover:shadow-medium"
                  >
                    {/* Album Artwork */}
                    <div className="aspect-square w-full overflow-hidden bg-app-surface-light">
                      {album.artwork ? (
                        <img
                          src={album.artwork}
                          alt={album.name}
                          className="w-full h-full object-cover"
                          loading="lazy"
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
                    <div className="p-3 text-left">
                      <p className="text-sm font-medium text-app-text truncate group-hover:text-app-accent transition-colors">
                        {album.name}
                      </p>
                      <p className="text-xs text-app-text-muted truncate mt-1">
                        {album.artist}
                      </p>
                      <p className="text-[10px] text-app-text-light mt-1">
                        {album.trackCount} track{album.trackCount !== 1 ? 's' : ''}
                        {album.year && ` · ${album.year}`}
                      </p>
                    </div>
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
});

VirtualizedAlbumGrid.displayName = 'VirtualizedAlbumGrid';
