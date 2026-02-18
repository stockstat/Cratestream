import { useState, useRef, useEffect } from 'react';

interface FolderItem {
  type: 'folder';
  name: string;
  prefix: string;
}

interface FileItem {
  type: 'file';
  name: string;
  fileName: string;
  size: number;
  url: string;
}

type BrowseItem = FolderItem | FileItem;

interface BreadcrumbEntry {
  name: string;
  prefix: string;
}

export function WebPlayerPage() {
  const [items, setItems]           = useState<BrowseItem[]>([]);
  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState('');
  const [breadcrumbs, setBreadcrumbs] = useState<BreadcrumbEntry[]>([{ name: 'All Years', prefix: '' }]);
  const [currentTrack, setCurrentTrack] = useState<FileItem | null>(null);
  const [playing, setPlaying]       = useState(false);
  const [progress, setProgress]     = useState(0);
  const [duration, setDuration]     = useState(0);
  const [volume, setVolume]         = useState(1);
  const [queue, setQueue]           = useState<FileItem[]>([]);
  const [queueIndex, setQueueIndex] = useState(0);
  const [search, setSearch]         = useState('');

  const audioRef = useRef<HTMLAudioElement>(null);

  const browse = async (prefix: string) => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/browse?prefix=${encodeURIComponent(prefix)}`);
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setItems([...data.folders, ...data.files]);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    browse('');
  }, []);

  const navigateTo = (folder: FolderItem) => {
    setBreadcrumbs(prev => [...prev, { name: folder.name, prefix: folder.prefix }]);
    browse(folder.prefix);
    setSearch('');
  };

  const navigateToCrumb = (index: number) => {
    const crumb = breadcrumbs[index];
    setBreadcrumbs(prev => prev.slice(0, index + 1));
    browse(crumb.prefix);
    setSearch('');
  };

  const playTrack = (file: FileItem, allFiles: FileItem[], index: number) => {
    setCurrentTrack(file);
    setQueue(allFiles);
    setQueueIndex(index);
    setPlaying(true);
    if (audioRef.current) {
      audioRef.current.src = file.url;
      audioRef.current.play();
    }
  };

  const playNext = () => {
    if (queueIndex < queue.length - 1) {
      const next = queue[queueIndex + 1];
      setCurrentTrack(next);
      setQueueIndex(i => i + 1);
      if (audioRef.current) {
        audioRef.current.src = next.url;
        audioRef.current.play();
      }
    }
  };

  const playPrev = () => {
    if (queueIndex > 0) {
      const prev = queue[queueIndex - 1];
      setCurrentTrack(prev);
      setQueueIndex(i => i - 1);
      if (audioRef.current) {
        audioRef.current.src = prev.url;
        audioRef.current.play();
      }
    }
  };

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (playing) {
      audioRef.current.pause();
      setPlaying(false);
    } else {
      audioRef.current.play();
      setPlaying(true);
    }
  };

  const formatTime = (s: number) => {
    if (!s || isNaN(s)) return '0:00';
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, '0')}`;
  };

  const cleanName = (name: string) =>
    name.replace(/\.(mp3|flac|wav|ogg|m4a|aac)$/i, '').replace(/_/g, ' ');

  const files = items.filter(i => i.type === 'file') as FileItem[];
  const folders = items.filter(i => i.type === 'folder') as FolderItem[];

  const filteredFolders = search
    ? folders.filter(f => f.name.toLowerCase().includes(search.toLowerCase()))
    : folders;
  const filteredFiles = search
    ? files.filter(f => f.name.toLowerCase().includes(search.toLowerCase()))
    : files;

  return (
    <div style={{ backgroundColor: '#0d0d0d', minHeight: '100vh', color: '#fff', fontFamily: 'system-ui, sans-serif' }}>

      {/* Hidden audio element */}
      <audio
        ref={audioRef}
        onTimeUpdate={() => {
          if (audioRef.current) setProgress(audioRef.current.currentTime);
        }}
        onLoadedMetadata={() => {
          if (audioRef.current) setDuration(audioRef.current.duration);
        }}
        onEnded={playNext}
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
      />

      {/* Header */}
      <div style={{
        background: 'linear-gradient(135deg, #1a0800, #2d1200)',
        borderBottom: '2px solid rgba(255,140,0,0.3)',
        padding: '12px 16px',
        position: 'sticky',
        top: 0,
        zIndex: 100,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', maxWidth: '900px', margin: '0 auto' }}>
          <img src="/Cratestream.PNG" alt="CrateStream" style={{ height: '40px', borderRadius: '4px' }} />
          <div>
            <div style={{ fontWeight: 900, fontSize: '16px', color: '#ff8c00', fontFamily: 'Impact, sans-serif', letterSpacing: '1px' }}>
              CRATESTREAM
            </div>
            <div style={{ fontSize: '11px', color: '#888' }}>The Vault of 90s Hip-Hop</div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div style={{ maxWidth: '900px', margin: '0 auto', padding: '0 0 120px 0' }}>

        {/* Breadcrumbs */}
        <div style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
          {breadcrumbs.map((crumb, i) => (
            <span key={i} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              {i > 0 && <span style={{ color: '#555' }}>›</span>}
              <button
                onClick={() => navigateToCrumb(i)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: i === breadcrumbs.length - 1 ? '#ff8c00' : '#888',
                  cursor: 'pointer',
                  fontSize: '13px',
                  fontWeight: i === breadcrumbs.length - 1 ? 700 : 400,
                  padding: '2px 4px',
                }}
              >
                {crumb.name}
              </button>
            </span>
          ))}
        </div>

        {/* Search */}
        <div style={{ padding: '0 16px 12px' }}>
          <input
            type="text"
            placeholder="Search..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{
              width: '100%',
              padding: '10px 14px',
              borderRadius: '10px',
              border: '1px solid rgba(255,140,0,0.2)',
              background: 'rgba(255,255,255,0.05)',
              color: '#fff',
              fontSize: '14px',
              outline: 'none',
              boxSizing: 'border-box',
            }}
          />
        </div>

        {/* Error */}
        {error && (
          <div style={{ margin: '16px', padding: '12px', background: 'rgba(255,0,0,0.1)', border: '1px solid rgba(255,0,0,0.3)', borderRadius: '8px', color: '#ff6b6b', fontSize: '13px' }}>
            Error: {error}
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div style={{ textAlign: 'center', padding: '40px', color: '#ff8c00' }}>
            <div style={{ fontSize: '24px', marginBottom: '8px' }}>⏳</div>
            Loading...
          </div>
        )}

        {/* Folders (Years / Albums) */}
        {!loading && filteredFolders.length > 0 && (
          <div style={{ padding: '0 16px' }}>
            <div style={{ fontSize: '11px', color: '#555', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px' }}>
              {breadcrumbs.length === 1 ? 'Years' : 'Albums'}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '8px' }}>
              {filteredFolders.map(folder => (
                <button
                  key={folder.prefix}
                  onClick={() => navigateTo(folder)}
                  style={{
                    background: 'rgba(255,140,0,0.08)',
                    border: '1px solid rgba(255,140,0,0.2)',
                    borderRadius: '10px',
                    padding: '14px 10px',
                    color: '#fff',
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'all 0.15s',
                    fontSize: '13px',
                    fontWeight: 600,
                    lineHeight: '1.3',
                  }}
                  onMouseEnter={e => {
                    (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,140,0,0.18)';
                    (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(255,140,0,0.5)';
                  }}
                  onMouseLeave={e => {
                    (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,140,0,0.08)';
                    (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(255,140,0,0.2)';
                  }}
                >
                  <div style={{ fontSize: '20px', marginBottom: '6px' }}>
                    {breadcrumbs.length === 1 ? '📅' : '💿'}
                  </div>
                  {folder.name}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Tracks */}
        {!loading && filteredFiles.length > 0 && (
          <div style={{ padding: '16px 16px 0' }}>
            <div style={{ fontSize: '11px', color: '#555', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px' }}>
              {filteredFiles.length} Tracks
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
              {filteredFiles.map((file, i) => (
                <button
                  key={file.fileName}
                  onClick={() => playTrack(file, filteredFiles, i)}
                  style={{
                    background: currentTrack?.fileName === file.fileName
                      ? 'rgba(255,140,0,0.15)'
                      : 'rgba(255,255,255,0.03)',
                    border: currentTrack?.fileName === file.fileName
                      ? '1px solid rgba(255,140,0,0.4)'
                      : '1px solid transparent',
                    borderRadius: '8px',
                    padding: '10px 14px',
                    color: '#fff',
                    cursor: 'pointer',
                    textAlign: 'left',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    fontSize: '13px',
                    transition: 'all 0.1s',
                  }}
                >
                  <span style={{ color: currentTrack?.fileName === file.fileName ? '#ff8c00' : '#555', fontSize: '16px', flexShrink: 0 }}>
                    {currentTrack?.fileName === file.fileName && playing ? '▶' : '♪'}
                  </span>
                  <span style={{
                    flex: 1,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    color: currentTrack?.fileName === file.fileName ? '#ff8c00' : '#ddd',
                    fontWeight: currentTrack?.fileName === file.fileName ? 700 : 400,
                  }}>
                    {cleanName(file.name)}
                  </span>
                  <span style={{ color: '#555', fontSize: '11px', flexShrink: 0 }}>
                    {(file.size / 1024 / 1024).toFixed(1)}MB
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Empty state */}
        {!loading && !error && filteredFolders.length === 0 && filteredFiles.length === 0 && (
          <div style={{ textAlign: 'center', padding: '60px 16px', color: '#555' }}>
            <div style={{ fontSize: '48px', marginBottom: '12px' }}>📦</div>
            <div>Nothing found</div>
          </div>
        )}
      </div>

      {/* ── PLAYER BAR — sticky bottom ── */}
      {currentTrack && (
        <div style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          background: 'linear-gradient(180deg, #1a0800 0%, #0d0500 100%)',
          borderTop: '2px solid rgba(255,140,0,0.4)',
          padding: '10px 16px 16px',
          zIndex: 200,
        }}>
          {/* Progress bar */}
          <div
            style={{ height: '3px', background: 'rgba(255,255,255,0.1)', borderRadius: '2px', marginBottom: '10px', cursor: 'pointer' }}
            onClick={e => {
              const rect = e.currentTarget.getBoundingClientRect();
              const pct = (e.clientX - rect.left) / rect.width;
              if (audioRef.current) audioRef.current.currentTime = pct * duration;
            }}
          >
            <div style={{ height: '100%', width: `${duration ? (progress / duration) * 100 : 0}%`, background: '#ff8c00', borderRadius: '2px', transition: 'width 0.5s linear' }} />
          </div>

          <div style={{ maxWidth: '900px', margin: '0 auto', display: 'flex', alignItems: 'center', gap: '12px' }}>
            {/* Track info */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{
                fontSize: '13px',
                fontWeight: 700,
                color: '#ff8c00',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}>
                {cleanName(currentTrack.name)}
              </div>
              <div style={{ fontSize: '11px', color: '#555' }}>
                {formatTime(progress)} / {formatTime(duration)}
              </div>
            </div>

            {/* Controls */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
              <button onClick={playPrev} style={ctrlBtn} disabled={queueIndex === 0}>⏮</button>
              <button
                onClick={togglePlay}
                style={{
                  ...ctrlBtn,
                  width: '44px',
                  height: '44px',
                  background: '#ff8c00',
                  color: '#000',
                  fontSize: '18px',
                  borderRadius: '50%',
                  border: 'none',
                }}
              >
                {playing ? '⏸' : '▶'}
              </button>
              <button onClick={playNext} style={ctrlBtn} disabled={queueIndex === queue.length - 1}>⏭</button>
            </div>

            {/* Volume */}
            <input
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={volume}
              onChange={e => {
                const v = parseFloat(e.target.value);
                setVolume(v);
                if (audioRef.current) audioRef.current.volume = v;
              }}
              style={{ width: '70px', accentColor: '#ff8c00' }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

const ctrlBtn: React.CSSProperties = {
  background: 'rgba(255,255,255,0.08)',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: '8px',
  color: '#fff',
  cursor: 'pointer',
  width: '36px',
  height: '36px',
  fontSize: '14px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
};
