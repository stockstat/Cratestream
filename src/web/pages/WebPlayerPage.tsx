import { useState, useRef, useEffect } from 'react';

interface FolderItem { type: 'folder'; name: string; prefix: string; }
interface FileItem { type: 'file'; name: string; fileName: string; size: number; url: string; }
interface Album { 
  realFolder: FolderItem;   // the deep folder with real name + mp3s + jpg
  artworkUrl: string | null; 
  artistName: string; 
  albumName: string; 
  loaded: boolean; 
}
interface BreadcrumbEntry { name: string; prefix: string; type: 'root' | 'year' | 'album'; }

export function WebPlayerPage() {
  const [view, setView]                     = useState<'years' | 'albums' | 'tracks'>('years');
  const [years, setYears]                   = useState<FolderItem[]>([]);
  const [albums, setAlbums]                 = useState<Album[]>([]);
  const [tracks, setTracks]                 = useState<FileItem[]>([]);
  const [currentAlbum, setCurrentAlbum]     = useState<Album | null>(null);
  const [loading, setLoading]               = useState(false);
  const [loadingAlbums, setLoadingAlbums]   = useState(false);
  const [artworkLoading, setArtworkLoading] = useState(false);
  const [error, setError]                   = useState('');
  const [breadcrumbs, setBreadcrumbs]       = useState<BreadcrumbEntry[]>([{ name: 'All Years', prefix: '', type: 'root' }]);
  const [currentTrack, setCurrentTrack]     = useState<FileItem | null>(null);
  const [playing, setPlaying]               = useState(false);
  const [progress, setProgress]             = useState(0);
  const [duration, setDuration]             = useState(0);
  const [volume, setVolume]                 = useState(1);
  const [queueIndex, setQueueIndex]         = useState(0);
  const [search, setSearch]                 = useState('');

  const audioRef = useRef<HTMLAudioElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  const browse = async (prefix: string, signal?: AbortSignal) => {
    const res = await fetch(`/api/browse?prefix=${encodeURIComponent(prefix)}`, { signal });
    const data = await res.json();
    if (data.error) throw new Error(data.error);
    return data;
  };

  useEffect(() => {
    setLoading(true);
    browse('').then(data => { setYears(data.folders); setLoading(false); })
      .catch(e => { setError(e.message); setLoading(false); });
  }, []);

  // Parse "2 In A Room - (1990) Wiggle It [320]" → {artist: "2 In A Room", album: "Wiggle It"}
  const parseFolderName = (name: string) => {
    const idx = name.indexOf(' - ');
    if (idx > -1) {
      const artist = name.substring(0, idx).trim();
      // Clean up album: remove year like "(1990)" and quality like "[320]"
      const rawAlbum = name.substring(idx + 3).trim();
      const album = rawAlbum.replace(/\(\d{4}\)\s*/g, '').replace(/\[\d+\]\s*/g, '').trim();
      return { artist, album };
    }
    // No dash — just clean up the name
    const album = name.replace(/\(\d{4}\)\s*/g, '').replace(/\[\d+\]\s*/g, '').trim();
    return { artist: '', album };
  };

  const openYear = async (year: FolderItem) => {
    if (abortRef.current) abortRef.current.abort();
    const abort = new AbortController();
    abortRef.current = abort;

    setLoadingAlbums(true);
    setArtworkLoading(false);
    setSearch('');
    setView('albums');
    setAlbums([]);
    setBreadcrumbs([
      { name: 'All Years', prefix: '', type: 'root' },
      { name: year.name, prefix: year.prefix, type: 'year' },
    ]);

    try {
      // Step 1: Get abbreviated folders in the year
      const yearData = await browse(year.prefix, abort.signal);
      const abbrevFolders: FolderItem[] = yearData.folders;

      // Show placeholder albums immediately
      const placeholders: Album[] = abbrevFolders.map(f => {
        const parsed = parseFolderName(f.name);
        return { realFolder: f, artworkUrl: null, artistName: parsed.artist, albumName: parsed.album || f.name, loaded: false };
      });
      setAlbums(placeholders);
      setLoadingAlbums(false);
      setArtworkLoading(true);

      // Step 2: For each abbreviated folder, browse one level deeper to get real album folder
      const chunkSize = 4;
      for (let i = 0; i < abbrevFolders.length; i += chunkSize) {
        if (abort.signal.aborted) break;
        const chunk = abbrevFolders.slice(i, i + chunkSize);

        const results = await Promise.all(chunk.map(async (abbrevFolder) => {
          if (abort.signal.aborted) return null;
          try {
            // Browse into the abbreviated folder to find the real album subfolder
            const innerData = await browse(abbrevFolder.prefix, abort.signal);
            
            // The real album folder is the first subfolder inside
            const realFolder: FolderItem | undefined = innerData.folders?.[0];
            
            if (realFolder) {
              // Browse into real folder to get the jpg
              const albumData = await browse(realFolder.prefix, abort.signal);
              const jpg = albumData.images?.[0];
              const parsed = parseFolderName(realFolder.name);
              return {
                realFolder,  // use the REAL folder for track browsing
                artworkUrl: jpg?.url || null,
                artistName: parsed.artist,
                albumName: parsed.album || realFolder.name,
                loaded: true,
              } as Album;
            } else {
              // No subfolder — files are directly in abbrev folder
              const jpg = innerData.images?.[0];
              const parsed = parseFolderName(abbrevFolder.name);
              return {
                realFolder: abbrevFolder,
                artworkUrl: jpg?.url || null,
                artistName: parsed.artist,
                albumName: parsed.album || abbrevFolder.name,
                loaded: true,
              } as Album;
            }
          } catch (e: any) {
            if (e.name === 'AbortError') return null;
            return { realFolder: abbrevFolder, artworkUrl: null, artistName: '', albumName: abbrevFolder.name, loaded: true } as Album;
          }
        }));

        if (!abort.signal.aborted) {
          setAlbums(prev => {
            const updated = [...prev];
            results.forEach((r, ri) => { if (r) updated[i + ri] = r; });
            return updated;
          });
          if (i + chunkSize < abbrevFolders.length) await new Promise(r => setTimeout(r, 150));
        }
      }
      setArtworkLoading(false);
    } catch (e: any) {
      if (e.name !== 'AbortError') setError(e.message);
      setLoadingAlbums(false);
      setArtworkLoading(false);
    }
  };

  const openAlbum = async (album: Album) => {
    setLoading(true);
    setSearch('');
    setCurrentAlbum(album);
    setBreadcrumbs(prev => [
      ...prev.slice(0, 2),
      { name: album.albumName || album.realFolder.name, prefix: album.realFolder.prefix, type: 'album' },
    ]);
    setView('tracks');
    try {
      const data = await browse(album.realFolder.prefix);
      setTracks(data.files);
    } catch (e: any) { setError(e.message); }
    finally { setLoading(false); }
  };

  const navigateToCrumb = (index: number) => {
    const crumb = breadcrumbs[index];
    setBreadcrumbs(prev => prev.slice(0, index + 1));
    setSearch('');
    if (crumb.type === 'root') setView('years');
    else if (crumb.type === 'year') setView('albums');
  };

  const playTrack = (file: FileItem, index: number) => {
    setCurrentTrack(file); setQueueIndex(index); setPlaying(true);
    if (audioRef.current) { audioRef.current.src = file.url; audioRef.current.play(); }
  };
  const playNext = () => {
    if (queueIndex < tracks.length - 1) {
      const n = tracks[queueIndex + 1]; setCurrentTrack(n); setQueueIndex(i => i + 1);
      if (audioRef.current) { audioRef.current.src = n.url; audioRef.current.play(); }
    }
  };
  const playPrev = () => {
    if (queueIndex > 0) {
      const p = tracks[queueIndex - 1]; setCurrentTrack(p); setQueueIndex(i => i - 1);
      if (audioRef.current) { audioRef.current.src = p.url; audioRef.current.play(); }
    }
  };
  const togglePlay = () => {
    if (!audioRef.current) return;
    if (playing) { audioRef.current.pause(); setPlaying(false); }
    else { audioRef.current.play(); setPlaying(true); }
  };

  const fmt = (s: number) => !s || isNaN(s) ? '0:00' : `${Math.floor(s/60)}:${Math.floor(s%60).toString().padStart(2,'0')}`;
  const cleanName = (n: string) => n.replace(/\.(mp3|flac|wav|ogg|m4a|aac)$/i,'').replace(/^\d+\s*[-_.]\s*/,'').trim();

  const filteredYears  = years.filter(y => !search || y.name.includes(search));
  const filteredAlbums = albums.filter(a => !search ||
    a.albumName.toLowerCase().includes(search.toLowerCase()) ||
    a.artistName.toLowerCase().includes(search.toLowerCase())
  );
  const filteredTracks = tracks.filter(t => !search || t.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div style={{ backgroundColor:'#0a0a0a', minHeight:'100vh', color:'#fff', fontFamily:'system-ui,-apple-system,sans-serif' }}>
      <audio ref={audioRef}
        onTimeUpdate={() => { if (audioRef.current) setProgress(audioRef.current.currentTime); }}
        onLoadedMetadata={() => { if (audioRef.current) setDuration(audioRef.current.duration); }}
        onEnded={playNext} onPlay={() => setPlaying(true)} onPause={() => setPlaying(false)}
      />

      {/* Header */}
      <div style={{ background:'linear-gradient(135deg,#1a0800,#2a1000)', borderBottom:'2px solid rgba(255,140,0,0.35)', padding:'10px 16px', position:'sticky', top:0, zIndex:100, display:'flex', alignItems:'center', gap:'12px' }}>
        <img src="/Cratestream.PNG" alt="CrateStream" style={{ height:'38px', borderRadius:'4px' }} />
        <div>
          <div style={{ fontWeight:900, fontSize:'15px', color:'#ff8c00', fontFamily:'Impact,sans-serif', letterSpacing:'1px' }}>CRATESTREAM</div>
          <div style={{ fontSize:'10px', color:'#666' }}>The Vault of 90s Hip-Hop</div>
        </div>
        {artworkLoading && <div style={{ marginLeft:'auto', fontSize:'11px', color:'#555', animation:'pulse 1.5s infinite' }}>Loading artwork...</div>}
      </div>

      <div style={{ maxWidth:'900px', margin:'0 auto', padding:'0 0 130px 0' }}>

        {/* Breadcrumbs */}
        <div style={{ padding:'10px 16px', display:'flex', alignItems:'center', gap:'4px', flexWrap:'wrap' }}>
          {breadcrumbs.map((crumb, i) => (
            <span key={i} style={{ display:'flex', alignItems:'center', gap:'4px' }}>
              {i > 0 && <span style={{ color:'#444' }}>›</span>}
              <button onClick={() => navigateToCrumb(i)} style={{
                background:'none', border:'none', padding:'2px 6px', borderRadius:'4px',
                color: i===breadcrumbs.length-1 ? '#ff8c00' : '#777',
                fontWeight: i===breadcrumbs.length-1 ? 700 : 400,
                fontSize:'13px', cursor:'pointer',
              }}>{crumb.name}</button>
            </span>
          ))}
        </div>

        {/* Search */}
        <div style={{ padding:'0 16px 12px' }}>
          <input type="text"
            placeholder={view==='years' ? 'Search years...' : view==='albums' ? 'Search artist or album...' : 'Search tracks...'}
            value={search} onChange={e => setSearch(e.target.value)}
            style={{ width:'100%', padding:'10px 14px', borderRadius:'10px', boxSizing:'border-box' as any, border:'1px solid rgba(255,140,0,0.2)', background:'rgba(255,255,255,0.05)', color:'#fff', fontSize:'14px', outline:'none' }}
          />
        </div>

        {error && <div style={{ margin:'16px', padding:'12px', background:'rgba(255,0,0,0.1)', border:'1px solid rgba(255,0,0,0.3)', borderRadius:'8px', color:'#ff6b6b', fontSize:'13px' }}>{error}</div>}

        {/* ── YEARS ── */}
        {view === 'years' && (
          <div style={{ padding:'0 16px' }}>
            <div style={{ fontSize:'11px', color:'#555', textTransform:'uppercase', letterSpacing:'1px', marginBottom:'10px' }}>Browse by Year</div>
            {loading ? <div style={{ textAlign:'center', padding:'40px', color:'#ff8c00' }}>Loading...</div> : (
              <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(100px,1fr))', gap:'10px' }}>
                {filteredYears.map(year => (
                  <button key={year.prefix} onClick={() => openYear(year)} style={{
                    background:'linear-gradient(135deg,rgba(255,140,0,0.12),rgba(255,100,0,0.06))',
                    border:'1px solid rgba(255,140,0,0.25)', borderRadius:'12px',
                    padding:'20px 10px', color:'#fff', cursor:'pointer', textAlign:'center',
                    fontSize:'22px', fontWeight:900, fontFamily:'Impact,sans-serif', letterSpacing:'1px', transition:'all 0.15s',
                  }}
                    onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background='rgba(255,140,0,0.22)'; (e.currentTarget as HTMLButtonElement).style.transform='scale(1.04)'; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background='linear-gradient(135deg,rgba(255,140,0,0.12),rgba(255,100,0,0.06))'; (e.currentTarget as HTMLButtonElement).style.transform='scale(1)'; }}
                  >{year.name}</button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── ALBUMS ── */}
        {view === 'albums' && (
          <div style={{ padding:'0 16px' }}>
            <div style={{ fontSize:'11px', color:'#555', textTransform:'uppercase', letterSpacing:'1px', marginBottom:'10px' }}>
              {loadingAlbums ? 'Loading albums...' : `${filteredAlbums.length} Albums`}
            </div>
            {loadingAlbums && <div style={{ textAlign:'center', padding:'40px', color:'#ff8c00' }}>Loading albums...</div>}
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(150px,1fr))', gap:'12px' }}>
              {filteredAlbums.map(album => (
                <button key={album.realFolder.prefix} onClick={() => openAlbum(album)} style={{
                  background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.08)',
                  borderRadius:'10px', padding:'0', color:'#fff', cursor:'pointer',
                  textAlign:'left', overflow:'hidden', transition:'all 0.15s',
                }}
                  onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.transform='scale(1.03)'; (e.currentTarget as HTMLButtonElement).style.borderColor='rgba(255,140,0,0.5)'; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.transform='scale(1)'; (e.currentTarget as HTMLButtonElement).style.borderColor='rgba(255,255,255,0.08)'; }}
                >
                  <div style={{ width:'100%', aspectRatio:'1', overflow:'hidden', background:'#111', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'36px' }}>
                    {album.artworkUrl
                      ? <img src={album.artworkUrl} alt={album.albumName} style={{ width:'100%', height:'100%', objectFit:'cover' }}
                          onError={e => { (e.currentTarget as HTMLImageElement).style.display='none'; }}
                        />
                      : <span style={{ color: album.loaded ? '#333' : '#1a1a1a' }}>{album.loaded ? '💿' : '⏳'}</span>
                    }
                  </div>
                  <div style={{ padding:'8px 10px 10px' }}>
                    <div style={{ fontSize:'12px', fontWeight:700, color:'#fff', lineHeight:'1.3', marginBottom:'3px', overflow:'hidden', display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical' }}>
                      {album.albumName || album.realFolder.name}
                    </div>
                    {album.artistName && <div style={{ fontSize:'11px', color:'#ff8c00', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{album.artistName}</div>}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── TRACKS ── */}
        {view === 'tracks' && currentAlbum && (
          <div style={{ padding:'0 16px' }}>
            <div style={{ display:'flex', gap:'16px', marginBottom:'20px', alignItems:'flex-start' }}>
              <div style={{ width:'100px', height:'100px', flexShrink:0, borderRadius:'8px', overflow:'hidden', background:'#151515', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'40px' }}>
                {currentAlbum.artworkUrl ? <img src={currentAlbum.artworkUrl} alt="" style={{ width:'100%', height:'100%', objectFit:'cover' }} /> : '💿'}
              </div>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:'18px', fontWeight:900, color:'#fff', marginBottom:'4px', lineHeight:'1.2' }}>{currentAlbum.albumName}</div>
                {currentAlbum.artistName && <div style={{ fontSize:'14px', color:'#ff8c00', marginBottom:'10px' }}>{currentAlbum.artistName}</div>}
                <button onClick={() => { if (filteredTracks.length > 0) playTrack(filteredTracks[0], 0); }} style={{
                  background:'#ff8c00', border:'none', borderRadius:'8px', padding:'8px 20px',
                  color:'#000', fontWeight:900, fontSize:'13px', cursor:'pointer',
                }}>▶ Play All</button>
              </div>
            </div>
            {loading ? <div style={{ textAlign:'center', padding:'40px', color:'#ff8c00' }}>Loading tracks...</div> : (
              <div style={{ display:'flex', flexDirection:'column', gap:'2px' }}>
                <div style={{ fontSize:'11px', color:'#555', textTransform:'uppercase', letterSpacing:'1px', marginBottom:'8px' }}>{filteredTracks.length} Tracks</div>
                {filteredTracks.map((file, i) => (
                  <button key={file.fileName} onClick={() => playTrack(file, i)} style={{
                    background: currentTrack?.fileName===file.fileName ? 'rgba(255,140,0,0.15)' : 'rgba(255,255,255,0.03)',
                    border: currentTrack?.fileName===file.fileName ? '1px solid rgba(255,140,0,0.4)' : '1px solid transparent',
                    borderRadius:'8px', padding:'10px 14px', color:'#fff', cursor:'pointer',
                    textAlign:'left', display:'flex', alignItems:'center', gap:'12px', fontSize:'13px',
                  }}>
                    <span style={{ color: currentTrack?.fileName===file.fileName ? '#ff8c00' : '#444', fontSize:'14px', flexShrink:0, width:'24px', textAlign:'center' }}>
                      {currentTrack?.fileName===file.fileName && playing ? '▶' : `${i+1}`}
                    </span>
                    <span style={{ flex:1, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', color: currentTrack?.fileName===file.fileName ? '#ff8c00' : '#ddd', fontWeight: currentTrack?.fileName===file.fileName ? 700 : 400 }}>
                      {cleanName(file.name)}
                    </span>
                    <span style={{ color:'#444', fontSize:'11px', flexShrink:0 }}>{(file.size/1024/1024).toFixed(1)}MB</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── PLAYER BAR ── */}
      {currentTrack && (
        <div style={{ position:'fixed', bottom:0, left:0, right:0, zIndex:200, background:'linear-gradient(180deg,rgba(20,8,0,0.97),rgba(8,3,0,0.99))', borderTop:'2px solid rgba(255,140,0,0.4)', padding:'8px 16px 20px' }}>
          <div onClick={e => {
            const rect = e.currentTarget.getBoundingClientRect();
            if (audioRef.current) audioRef.current.currentTime = ((e.clientX-rect.left)/rect.width)*duration;
          }} style={{ height:'3px', background:'rgba(255,255,255,0.1)', borderRadius:'2px', marginBottom:'10px', cursor:'pointer' }}>
            <div style={{ height:'100%', width:`${duration?(progress/duration)*100:0}%`, background:'linear-gradient(90deg,#ff6a00,#ff8c00)', borderRadius:'2px', transition:'width 0.5s linear' }} />
          </div>
          <div style={{ maxWidth:'900px', margin:'0 auto', display:'flex', alignItems:'center', gap:'12px' }}>
            {currentAlbum?.artworkUrl && <img src={currentAlbum.artworkUrl} alt="" style={{ width:'44px', height:'44px', borderRadius:'6px', objectFit:'cover', flexShrink:0 }} />}
            <div style={{ flex:1, minWidth:0 }}>
              <div style={{ fontSize:'13px', fontWeight:700, color:'#ff8c00', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{cleanName(currentTrack.name)}</div>
              <div style={{ fontSize:'11px', color:'#555' }}>{currentAlbum?.artistName || ''} • {fmt(progress)} / {fmt(duration)}</div>
            </div>
            <div style={{ display:'flex', alignItems:'center', gap:'8px', flexShrink:0 }}>
              <button onClick={playPrev} disabled={queueIndex===0} style={ctrlBtn}>⏮</button>
              <button onClick={togglePlay} style={{ ...ctrlBtn, width:'46px', height:'46px', background:'#ff8c00', color:'#000', fontSize:'18px', borderRadius:'50%', border:'none' }}>
                {playing ? '⏸' : '▶'}
              </button>
              <button onClick={playNext} disabled={queueIndex===tracks.length-1} style={ctrlBtn}>⏭</button>
            </div>
            <input type="range" min={0} max={1} step={0.01} value={volume}
              onChange={e => { const v=parseFloat(e.target.value); setVolume(v); if(audioRef.current) audioRef.current.volume=v; }}
              style={{ width:'70px', accentColor:'#ff8c00' }}
            />
          </div>
        </div>
      )}
      <style>{`
        button:disabled { opacity:0.3; cursor:default; }
        @keyframes pulse { 0%,100%{opacity:0.4} 50%{opacity:1} }
      `}</style>
    </div>
  );
}

const ctrlBtn: React.CSSProperties = {
  background:'rgba(255,255,255,0.08)', border:'1px solid rgba(255,255,255,0.1)',
  borderRadius:'8px', color:'#fff', cursor:'pointer', width:'38px', height:'38px',
  fontSize:'14px', display:'flex', alignItems:'center', justifyContent:'center',
};
