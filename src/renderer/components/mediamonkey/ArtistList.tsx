import { useState } from 'react';
import { useLibraryStore, ArtistInfo } from '../../store/libraryStore';

interface ArtistListProps {
  artists: ArtistInfo[];
  onArtistClick: (artist: ArtistInfo) => void;
}

export function ArtistList({ artists, onArtistClick }: ArtistListProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const { selectedArtist } = useLibraryStore();

  const filteredArtists = searchQuery
    ? artists.filter(a => a.name.toLowerCase().includes(searchQuery.toLowerCase()))
    : artists;

  if (artists.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-app-text-light bg-app-surface">
        <svg className="w-16 h-16 mb-4 opacity-30" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
        </svg>
        <p className="text-sm font-medium mb-1">No artists</p>
        <p className="text-xs text-app-text-muted">Add music to your library to see artists</p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-app-surface">
      {/* Search Header */}
      <div className="p-3 border-b border-app-border bg-app-surface-dark">
        <div className="relative">
          <svg
            className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-app-text-muted"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Filter artists..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 text-xs bg-app-surface border border-app-border rounded text-app-text placeholder-app-text-muted focus:outline-none focus:border-app-accent focus:ring-1 focus:ring-app-accent"
          />
        </div>
        <div className="mt-2 text-[10px] text-app-text-muted">
          {filteredArtists.length} artist{filteredArtists.length !== 1 ? 's' : ''}
        </div>
      </div>

      {/* Artist List */}
      <div className="flex-1 overflow-y-auto">
        {filteredArtists.map((artist, index) => (
          <button
            key={artist.name}
            onClick={() => onArtistClick(artist)}
            className={`w-full flex items-center gap-3 px-3 py-2 text-left transition-colors ${
              selectedArtist === artist.name
                ? 'bg-app-accent'
                : index % 2 === 0
                ? 'bg-app-surface hover:bg-app-hover'
                : 'bg-app-surface-dark hover:bg-app-hover'
            }`}
          >
            {/* Artist Icon/Avatar */}
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-app-accent to-orange-700 flex items-center justify-center flex-shrink-0">
              <span className="text-white font-semibold text-sm">
                {artist.name.charAt(0).toUpperCase()}
              </span>
            </div>

            {/* Artist Info */}
            <div className="flex-1 min-w-0">
              <p className="text-sm text-app-text truncate">{artist.name}</p>
              <p className="text-[10px] text-app-text-muted">
                {artist.albumCount} album{artist.albumCount !== 1 ? 's' : ''} - {artist.trackCount} track{artist.trackCount !== 1 ? 's' : ''}
              </p>
            </div>

            {/* Arrow */}
            <svg
              className="w-4 h-4 text-app-text-light"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        ))}
      </div>
    </div>
  );
}

interface GenreListProps {
  genres: { name: string; trackCount: number }[];
  onGenreClick: (genre: string) => void;
}

export function GenreList({ genres, onGenreClick }: GenreListProps) {
  const { selectedGenre } = useLibraryStore();

  if (genres.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-app-text-light bg-app-surface">
        <svg className="w-16 h-16 mb-4 opacity-30" fill="currentColor" viewBox="0 0 24 24">
          <path d="M4 6H2v14c0 1.1.9 2 2 2h14v-2H4V6zm16-4H8c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H8V4h12v12z"/>
        </svg>
        <p className="text-sm font-medium mb-1">No genres</p>
        <p className="text-xs text-app-text-muted">Add music with genre tags to see genres</p>
      </div>
    );
  }

  const genreColors = [
    'from-pink-500 to-rose-500',
    'from-purple-500 to-indigo-500',
    'from-blue-500 to-cyan-500',
    'from-green-500 to-emerald-500',
    'from-amber-500 to-orange-500',
    'from-red-500 to-pink-500',
  ];

  return (
    <div className="flex-1 overflow-y-auto bg-app-surface p-4">
      <div className="grid grid-cols-[repeat(auto-fill,minmax(160px,1fr))] gap-3">
        {genres.map((genre, index) => (
          <button
            key={genre.name}
            onClick={() => onGenreClick(genre.name)}
            className={`p-4 rounded-lg text-left transition-all hover:scale-[1.02] hover:shadow-md ${
              selectedGenre === genre.name ? 'ring-2 ring-app-accent' : ''
            } bg-gradient-to-br ${genreColors[index % genreColors.length]}`}
          >
            <p className="text-sm font-semibold text-white truncate">{genre.name}</p>
            <p className="text-[10px] text-white/70">
              {genre.trackCount} track{genre.trackCount !== 1 ? 's' : ''}
            </p>
          </button>
        ))}
      </div>
    </div>
  );
}

interface YearListProps {
  years: { year: number; trackCount: number }[];
  onYearClick: (year: number) => void;
}

export function YearList({ years, onYearClick }: YearListProps) {
  const { selectedYear } = useLibraryStore();

  if (years.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-app-text-light bg-app-surface">
        <svg className="w-16 h-16 mb-4 opacity-30" fill="currentColor" viewBox="0 0 24 24">
          <path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11z"/>
        </svg>
        <p className="text-sm font-medium mb-1">No years</p>
        <p className="text-xs text-app-text-muted">Add music with year tags to see years</p>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto bg-app-surface p-4">
      <div className="grid grid-cols-[repeat(auto-fill,minmax(100px,1fr))] gap-2">
        {years.map((yearInfo) => (
          <button
            key={yearInfo.year}
            onClick={() => onYearClick(yearInfo.year)}
            className={`p-3 rounded-lg text-center transition-colors ${
              selectedYear === yearInfo.year
                ? 'bg-app-accent border-2 border-app-accent-hover'
                : 'bg-app-surface-dark border border-app-border hover:bg-app-hover hover:border-app-accent'
            }`}
          >
            <p className="text-lg font-bold text-app-text">{yearInfo.year}</p>
            <p className="text-[10px] text-app-text-muted">
              {yearInfo.trackCount} track{yearInfo.trackCount !== 1 ? 's' : ''}
            </p>
          </button>
        ))}
      </div>
    </div>
  );
}
