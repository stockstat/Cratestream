import { useState, useRef, useEffect, useMemo } from 'react';
import { doc, getDoc, setDoc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth, db } from '../firebase';

interface AlbumEntry {
  artist: string;
  album: string;
  year: number;
  artworkUrl: string | null;
  folderPrefix: string;
}

interface FileItem { type: 'file'; name: string; fileName: string; size: number; url: string; }

interface FavTrack {
  id: string; // unique key = fileName
  name: string;
  fileName: string;
  url: string;
  artist: string;
  album: string;
  artworkUrl: string | null;
  addedAt: number;
}

type ViewType = 'home' | 'artist' | 'tracks';

const BUCKET = '1994HipHop';
const INDEX_URL = `https://f001.backblazeb2.com/file/${BUCKET}/web-index.json`;
const ALPHABET = '#ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

export function WebPlayerPage() {
  const [user, setUser]                     = useState<User | null>(null);
  const [index, setIndex]                   = useState<AlbumEntry[]>([]);
  const [indexLoading, setIndexLoading]     = useState(true);
  const [view, setView]                     = useState<ViewType>('home');
  const [selectedArtist, setSelectedArtist] = useState<string | null>(null);
  const [selectedYear, setSelectedYear]     = useState<number | null>(null);
  const [tracks, setTracks]                 = useState<FileItem[]>([]);
  const [currentAlbum, setCurrentAlbum]     = useState<AlbumEntry | null>(null);
  const [tracksLoading, setTracksLoading]   = useState(false);
  const [search, setSearch]                 = useState('');
  const [activeLetter, setActiveLetter]     = useState('A');
  const [homeTab, setHomeTab]               = useState<'artists' | 'years' | 'favourites'>('artists');
  const [favourites, setFavourites]         = useState<FavTrack[]>([]);
  const [favIds, setFavIds]                 = useState<Set<string>>(new Set());
  const [favLoading, setFavLoading]         = useState(false);

  // Playback
  const [currentTrack, setCurrentTrack]   = useState<FileItem | null>(null);
  const [playing, setPlaying]             = useState(false);
  const [progress, setProgress]           = useState(0);
  const [duration, setDuration]           = useState(0);
  const [volume, setVolume]               = useState(1);
  const [queue, setQueue]                 = useState<FileItem[]>([]);
  const [queueIndex, setQueueIndex]       = useState(0);
  const [shuffle, setShuffle]             = useState(false);
  const [isYearShuffle, setIsYearShuffle] = useState(false);

  const audioRef   = useRef<HTMLAudioElement>(null);
  const letterRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const yearQueueRef = useRef<{ albums: AlbumEntry[]; usedAlbums: Set<string> } | null>(null);

  // Auth listener
  useEffect(() => {
    return onAuthStateChanged(auth, u => setUser(u));
  }, []);

  // Load index
  useEffect(() => {
    fetch(INDEX_URL).then(r => r.json())
      .then(data => { setIndex(data.albums || []); setIndexLoading(false); })
      .catch(() => setIndexLoading(false));
  }, []);

  // Load favourites when user logs in
  useEffect(() => {
    if (!user) { setFavourites([]); setFavIds(new Set()); return; }
    setFavLoading(true);
    const ref = doc(db, 'users', user.uid);
    getDoc(ref).then(snap => {
      const data = snap.data();
      const favs: FavTrack[] = data?.favourites || [];
      setFavourites(favs.sort((a, b) => b.addedAt - a.addedAt));
      setFavIds(new Set(favs.map(f => f.id)));
      setFavLoading(false);
    }).catch(() => setFavLoading(false));
  }, [user]);

  const toggleFavourite = async () => {
    if (!user || !currentTrack || !currentAlbum) return;
    const ref = doc(db, 'users', user.uid);
    const trackId = currentTrack.fileName;

    const favTrack: FavTrack = {
      id: trackId,
      name: currentTrack.name,
      fileName: currentTrack.fileName,
      url: currentTrack.url,
      artist: currentAlbum.artist,
      album: currentAlbum.album,
      artworkUrl: currentAlbum.artworkUrl,
      addedAt: Date.now(),
    };

    if (favIds.has(trackId)) {
      // Remove
      const updated = favourites.filter(f => f.id !== trackId);
      setFavourites(updated);
      setFavIds(prev => { const s = new Set(prev); s.delete(trackId); return s; });
      try {
        const snap = await getDoc(ref);
        const existing: FavTrack[] = snap.data()?.favourites || [];
        await setDoc(ref, { favourites: existing.filter(f => f.id !== trackId) }, { merge: true });
      } catch {}
    } else {
      // Add
      setFavourites(prev => [favTrack, ...prev]);
      setFavIds(prev => new Set([...prev, trackId]));
      try {
        const snap = await getDoc(ref);
        if (!snap.exists()) {
          await setDoc(ref, { favourites: [favTrack] }, { merge: true });
        } else {
          await updateDoc(ref, { favourites: arrayUnion(favTrack) });
        }
      } catch {}
    }
  };

  // Derived data
  const years = useMemo(() => [...new Set(index.map(a => a.year))].filter(Boolean).sort(), [index]);

  const artists = useMemo(() => {
    const map: Record<string, AlbumEntry[]> = {};
    index.forEach(a => {
      if (!a.artist || a.artist.startsWith('--')) return;
      if (!map[a.artist]) map[a.artist] = [];
      map[a.artist].push(a);
    });
    return map;
  }, [index]);

  const sortedArtists = useMemo(() => Object.keys(artists).sort((a, b) => a.localeCompare(b)), [artists]);

  const filteredArtists = useMemo(() => {
    if (!search) return sortedArtists;
    return sortedArtists.filter(a => a.toLowerCase().includes(search.toLowerCase()));
  }, [sortedArtists, search]);

  const getLetterKey = (name: string) => {
    const c = name.replace(/^(the |a |an )/i, '')[0]?.toUpperCase();
    return c && /[A-Z]/.test(c) ? c : '#';
  };

  const artistsByLetter = useMemo(() => {
    const map: Record<string, string[]> = {};
    filteredArtists.forEach(a => {
      const l = getLetterKey(a);
      if (!map[l]) map[l] = [];
      map[l].push(a);
    });
    return map;
  }, [filteredArtists]);

  const scrollToLetter = (letter: string) => {
    setActiveLetter(letter);
    letterRefs.current[letter]?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const fetchTracks = async (album: AlbumEntry): Promise<FileItem[]> => {
    const res = await fetch(`/api/browse?prefix=${encodeURIComponent(album.folderPrefix)}`);
    const data = await res.json();
    return data.files || [];
  };

  const openAlbum = async (album: AlbumEntry) => {
    setCurrentAlbum(album);
    setTracksLoading(true);
    setView('tracks');
    setIsYearShuffle(false);
    yearQueueRef.current = null;
    try { const files = await fetchTracks(album); setTracks(files); }
    catch { setTracks([]); }
    finally { setTracksLoading(false); }
  };

  const openArtist = (artist: string) => { setSelectedArtist(artist); setSelectedYear(null); setView('artist'); setSearch(''); };

  const shuffleYear = async (year: number) => {
    const yearAlbums = index.filter(a => a.year === year);
    if (!yearAlbums.length) return;
    setIsYearShuffle(true);
    yearQueueRef.current = { albums: [...yearAlbums], usedAlbums: new Set() };
    await playNextYearAlbum(yearAlbums, new Set());
  };

  const playNextYearAlbum = async (albums: AlbumEntry[], used: Set<string>) => {
    let available = albums.filter(a => !used.has(a.folderPrefix));
    if (!available.length) { used.clear(); available = albums; }
    const randomAlbum = available[Math.floor(Math.random() * available.length)];
    used.add(randomAlbum.folderPrefix);
    try {
      const files = await fetchTracks(randomAlbum);
      if (!files.length) return playNextYearAlbum(albums, used);
      const shuffled = [...files].sort(() => Math.random() - 0.5);
      setCurrentAlbum(randomAlbum); setTracks(files); setQueue(shuffled);
      setQueueIndex(0); setCurrentTrack(shuffled[0]); setPlaying(true); setShuffle(true);
      if (audioRef.current) { audioRef.current.src = shuffled[0].url; audioRef.current.play(); }
      if (yearQueueRef.current) yearQueueRef.current.usedAlbums = used;
    } catch { playNextYearAlbum(albums, used); }
  };

  const handleTrackEnd = () => {
    if (isYearShuffle && yearQueueRef.current) {
      playNextYearAlbum(yearQueueRef.current.albums, yearQueueRef.current.usedAlbums);
    } else { playNext(); }
  };

  const handleSkipNext = () => {
    if (isYearShuffle && yearQueueRef.current) {
      playNextYearAlbum(yearQueueRef.current.albums, yearQueueRef.current.usedAlbums);
    } else { playNext(); }
  };

  const playTracks = (trackList: FileItem[], startIndex: number, shuffled = false) => {
    setIsYearShuffle(false); yearQueueRef.current = null;
    let list = [...trackList]; let idx = startIndex;
    if (shuffled) { for (let i = list.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [list[i], list[j]] = [list[j], list[i]]; } idx = 0; }
    setQueue(list); setQueueIndex(idx); setCurrentTrack(list[idx]); setPlaying(true); setShuffle(shuffled);
    if (audioRef.current) { audioRef.current.src = list[idx].url; audioRef.current.play(); }
  };

  // Play a favourite track
  const playFav = (fav: FavTrack) => {
    const fileItem: FileItem = { type: 'file', name: fav.name, fileName: fav.fileName, url: fav.url, size: 0 };
    const favAlbum: AlbumEntry = { artist: fav.artist, album: fav.album, year: 0, artworkUrl: fav.artworkUrl, folderPrefix: '' };
    setCurrentAlbum(favAlbum);
    setCurrentTrack(fileItem);
    setQueue([fileItem]);
    setQueueIndex(0);
    setPlaying(true);
    setIsYearShuffle(false);
    if (audioRef.current) { audioRef.current.src = fav.url; audioRef.current.play(); }
  };

  const playNext = () => {
    const next = queueIndex + 1;
    if (next < queue.length) { setCurrentTrack(queue[next]); setQueueIndex(next); if (audioRef.current) { audioRef.current.src = queue[next].url; audioRef.current.play(); } }
  };
  const playPrev = () => {
    const prev = queueIndex - 1;
    if (prev >= 0) { setCurrentTrack(queue[prev]); setQueueIndex(prev); if (audioRef.current) { audioRef.current.src = queue[prev].url; audioRef.current.play(); } }
  };
  const togglePlay = () => {
    if (!audioRef.current) return;
    if (playing) { audioRef.current.pause(); setPlaying(false); }
    else { audioRef.current.play(); setPlaying(true); }
  };

  const fmt = (s: number) => !s || isNaN(s) ? '0:00' : `${Math.floor(s/60)}:${Math.floor(s%60).toString().padStart(2,'0')}`;
  const cleanName = (n: string) => n.replace(/\.(mp3|flac|wav|ogg|m4a|aac)$/i,'').replace(/^\d+\s*[-_.]\s*/,'').trim();

  const isFavd = currentTrack ? favIds.has(currentTrack.fileName) : false;
  const artistAlbums = selectedArtist ? (artists[selectedArtist] || []) : [];
  const yearAlbums   = selectedYear   ? index.filter(a => a.year === selectedYear) : [];

  return (
    <div className="web-player-root" style={{ backgroundColor:'#0a0a0a', minHeight:'100vh', color:'#fff', fontFamily:'system-ui,-apple-system,sans-serif' }}>
      <audio ref={audioRef}
        onTimeUpdate={() => { if (audioRef.current) setProgress(audioRef.current.currentTime); }}
        onLoadedMetadata={() => { if (audioRef.current) setDuration(audioRef.current.duration); }}
        onEnded={handleTrackEnd} onPlay={() => setPlaying(true)} onPause={() => setPlaying(false)}
      />

      {/* Header */}
      <div style={{ background:'linear-gradient(135deg,#1a0800,#2a1000)', borderBottom:'2px solid rgba(255,140,0,0.35)', padding:'10px 16px', position:'sticky', top:0, zIndex:100, display:'flex', alignItems:'center', gap:'12px' }}>
        <img src="/Cratestream.PNG" alt="" style={{ height:'38px', borderRadius:'4px', cursor:'pointer' }} onClick={() => { setView('home'); setSearch(''); setSelectedArtist(null); }} />
        <div style={{ flex:1 }}>
          <div style={{ fontWeight:900, fontSize:'15px', color:'#ff8c00', fontFamily:'Impact,sans-serif', letterSpacing:'1px', cursor:'pointer' }} onClick={() => { setView('home'); setSearch(''); }}>CRATESTREAM</div>
          <div style={{ fontSize:'10px', color:'#666' }}>The Vault of 90s Hip-Hop</div>
        </div>
        {view !== 'home' && (
          <button onClick={() => { setView('home'); setSearch(''); setSelectedArtist(null); }} style={{ background:'rgba(255,255,255,0.08)', border:'none', borderRadius:'8px', color:'#aaa', padding:'6px 12px', cursor:'pointer', fontSize:'13px' }}>← Home</button>
        )}
      </div>

      <div style={{ maxWidth:'900px', margin:'0 auto', padding:'0 0 130px 0' }}>

        {/* ── HOME ── */}
        {view === 'home' && (
          <div>
            <div style={{ padding:'12px 16px 8px' }}>
              <input type="text" placeholder="Search artists..."
                value={search} onChange={e => setSearch(e.target.value)}
                style={{ width:'100%', padding:'11px 16px', borderRadius:'12px', boxSizing:'border-box' as any, border:'1px solid rgba(255,140,0,0.25)', background:'rgba(255,255,255,0.06)', color:'#fff', fontSize:'15px', outline:'none' }}
              />
            </div>

            {!search && (
              <div style={{ display:'flex', padding:'4px 16px 0', gap:'4px', borderBottom:'1px solid rgba(255,255,255,0.06)' }}>
                {(['artists','years','favourites'] as const).map(tab => (
                  <button key={tab} onClick={() => setHomeTab(tab)} style={{
                    background:'none', border:'none', padding:'10px 14px', cursor:'pointer',
                    color: homeTab===tab ? '#ff8c00' : '#555',
                    fontWeight: homeTab===tab ? 700 : 400,
                    fontSize:'13px',
                    borderBottom: homeTab===tab ? '2px solid #ff8c00' : '2px solid transparent',
                    textTransform:'capitalize', display:'flex', alignItems:'center', gap:'6px',
                  }}>
                    {tab === 'favourites' ? '❤️' : ''}{tab}
                    {tab === 'favourites' && favourites.length > 0 && (
                      <span style={{ background:'rgba(255,140,0,0.2)', color:'#ff8c00', borderRadius:'10px', padding:'1px 6px', fontSize:'10px', fontWeight:900 }}>{favourites.length}</span>
                    )}
                  </button>
                ))}
              </div>
            )}

            {indexLoading ? (
              <div style={{ textAlign:'center', padding:'60px', color:'#ff8c00' }}>Loading library...</div>
            ) : search ? (
              /* Search results */
              <div style={{ padding:'12px 16px' }}>
                <div style={{ fontSize:'11px', color:'#555', textTransform:'uppercase', letterSpacing:'1px', marginBottom:'10px' }}>{filteredArtists.length} Artists found</div>
                {filteredArtists.slice(0, 50).map(artist => (
                  <button key={artist} onClick={() => openArtist(artist)} style={{ display:'flex', alignItems:'center', gap:'12px', width:'100%', background:'rgba(255,255,255,0.03)', border:'1px solid transparent', borderRadius:'8px', padding:'10px 14px', color:'#fff', cursor:'pointer', marginBottom:'2px', textAlign:'left' }}
                    onMouseEnter={e => (e.currentTarget as HTMLButtonElement).style.background='rgba(255,140,0,0.1)'}
                    onMouseLeave={e => (e.currentTarget as HTMLButtonElement).style.background='rgba(255,255,255,0.03)'}
                  >
                    <div style={{ width:'40px', height:'40px', borderRadius:'6px', background:'#1a1a1a', overflow:'hidden', flexShrink:0, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'18px' }}>
                      {artists[artist]?.[0]?.artworkUrl ? <img src={artists[artist][0].artworkUrl!} alt="" style={{ width:'100%', height:'100%', objectFit:'cover' }} onError={e => { (e.currentTarget as HTMLImageElement).style.display='none'; }} /> : '🎤'}
                    </div>
                    <div style={{ flex:1 }}><div style={{ fontSize:'14px', fontWeight:600 }}>{artist}</div><div style={{ fontSize:'11px', color:'#555' }}>{artists[artist]?.length} albums</div></div>
                    <span style={{ color:'#444' }}>›</span>
                  </button>
                ))}
                {filteredArtists.length > 50 && <div style={{ textAlign:'center', padding:'12px', color:'#555', fontSize:'12px' }}>Showing 50 of {filteredArtists.length} — type more to narrow</div>}
              </div>

            ) : homeTab === 'favourites' ? (
              /* ── FAVOURITES TAB ── */
              <div style={{ padding:'12px 16px' }}>
                {!user ? (
                  <div style={{ textAlign:'center', padding:'40px 20px' }}>
                    <div style={{ fontSize:'48px', marginBottom:'12px' }}>❤️</div>
                    <div style={{ fontSize:'16px', fontWeight:700, color:'#fff', marginBottom:'8px' }}>Sign in to save favourites</div>
                    <div style={{ fontSize:'13px', color:'#555', marginBottom:'20px' }}>Your liked tracks will appear here</div>
                    <button onClick={() => window.location.href='/login'} style={{ background:'#ff8c00', border:'none', borderRadius:'10px', padding:'10px 28px', color:'#000', fontWeight:900, fontSize:'14px', cursor:'pointer' }}>
                      Sign In
                    </button>
                  </div>
                ) : favLoading ? (
                  <div style={{ textAlign:'center', padding:'40px', color:'#ff8c00' }}>Loading favourites...</div>
                ) : favourites.length === 0 ? (
                  <div style={{ textAlign:'center', padding:'40px 20px' }}>
                    <div style={{ fontSize:'48px', marginBottom:'12px' }}>🎵</div>
                    <div style={{ fontSize:'16px', fontWeight:700, color:'#fff', marginBottom:'8px' }}>No favourites yet</div>
                    <div style={{ fontSize:'13px', color:'#555' }}>Tap ❤️ in the player bar while a track is playing</div>
                  </div>
                ) : (
                  <>
                    <div style={{ fontSize:'11px', color:'#555', textTransform:'uppercase', letterSpacing:'1px', marginBottom:'10px' }}>{favourites.length} Saved Tracks</div>
                    {favourites.map(fav => (
                      <button key={fav.id} onClick={() => playFav(fav)} style={{
                        display:'flex', alignItems:'center', gap:'12px', width:'100%',
                        background: currentTrack?.fileName===fav.fileName ? 'rgba(255,140,0,0.15)' : 'rgba(255,255,255,0.03)',
                        border: currentTrack?.fileName===fav.fileName ? '1px solid rgba(255,140,0,0.4)' : '1px solid transparent',
                        borderRadius:'10px', padding:'10px 12px', color:'#fff', cursor:'pointer', marginBottom:'4px', textAlign:'left',
                      }}>
                        <div style={{ width:'46px', height:'46px', borderRadius:'6px', background:'#1a1a1a', overflow:'hidden', flexShrink:0, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'20px' }}>
                          {fav.artworkUrl ? <img src={fav.artworkUrl} alt="" style={{ width:'100%', height:'100%', objectFit:'cover' }} onError={e => { (e.currentTarget as HTMLImageElement).style.display='none'; }} /> : '💿'}
                        </div>
                        <div style={{ flex:1, minWidth:0 }}>
                          <div style={{ fontSize:'13px', fontWeight:700, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', color: currentTrack?.fileName===fav.fileName ? '#ff8c00' : '#fff' }}>
                            {cleanName(fav.name)}
                          </div>
                          <div style={{ fontSize:'11px', color:'#555', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{fav.artist} — {fav.album}</div>
                        </div>
                        {currentTrack?.fileName===fav.fileName && playing && <span style={{ color:'#ff8c00', fontSize:'14px', flexShrink:0 }}>▶</span>}
                      </button>
                    ))}
                  </>
                )}
              </div>

            ) : homeTab === 'artists' ? (
              /* ── ARTISTS A-Z ── */
              <div style={{ display:'flex' }}>
                <div style={{ flex:1, padding:'0 8px 0 16px' }}>
                  {ALPHABET.map(letter => {
                    const la = artistsByLetter[letter];
                    if (!la?.length) return null;
                    return (
                      <div key={letter} ref={el => { letterRefs.current[letter] = el; }}>
                        <div style={{ fontSize:'13px', fontWeight:900, color:'#ff8c00', padding:'12px 0 6px', fontFamily:'Impact,sans-serif', letterSpacing:'2px' }}>{letter}</div>
                        {la.map(artist => (
                          <button key={artist} onClick={() => openArtist(artist)} style={{ display:'flex', alignItems:'center', gap:'12px', width:'100%', background:'rgba(255,255,255,0.02)', border:'1px solid transparent', borderRadius:'8px', padding:'9px 12px', color:'#fff', cursor:'pointer', marginBottom:'2px', textAlign:'left' }}>
                            <div style={{ width:'38px', height:'38px', borderRadius:'6px', background:'#161616', overflow:'hidden', flexShrink:0, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'16px' }}>
                              {artists[artist]?.[0]?.artworkUrl ? <img src={artists[artist][0].artworkUrl!} alt="" style={{ width:'100%', height:'100%', objectFit:'cover' }} onError={e => { (e.currentTarget as HTMLImageElement).style.display='none'; }} /> : '🎤'}
                            </div>
                            <div style={{ flex:1, minWidth:0 }}>
                              <div style={{ fontSize:'13px', fontWeight:600, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{artist}</div>
                              <div style={{ fontSize:'11px', color:'#555' }}>{artists[artist]?.length} album{artists[artist]?.length !== 1 ? 's' : ''}</div>
                            </div>
                            <span style={{ color:'#333', fontSize:'12px' }}>›</span>
                          </button>
                        ))}
                      </div>
                    );
                  })}
                </div>
                {/* Alphabet scroller */}
                <div style={{ width:'24px', display:'flex', flexDirection:'column', alignItems:'center', padding:'8px 0', position:'sticky', top:'60px', alignSelf:'flex-start', height:'calc(100vh - 130px)', overflowY:'auto', flexShrink:0 }}>
                  {ALPHABET.map(letter => (
                    <button key={letter} onClick={() => scrollToLetter(letter)} style={{ background:'none', border:'none', color: activeLetter===letter ? '#ff8c00' : artistsByLetter[letter]?.length ? '#777' : '#2a2a2a', fontSize:'10px', fontWeight: activeLetter===letter ? 900 : 400, padding:'2px 0', cursor: artistsByLetter[letter]?.length ? 'pointer' : 'default', lineHeight:'1.4', width:'100%', textAlign:'center' }}>{letter}</button>
                  ))}
                </div>
              </div>

            ) : (
              /* ── YEARS TAB ── */
              <div style={{ padding:'12px 16px' }}>
                <div style={{ fontSize:'11px', color:'#555', textTransform:'uppercase', letterSpacing:'1px', marginBottom:'10px' }}>Browse by Year</div>
                <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(90px,1fr))', gap:'10px' }}>
                  {years.map(year => (
                    <div key={year} style={{ display:'flex', flexDirection:'column', gap:'6px' }}>
                      <button onClick={() => { setSelectedYear(year); setSelectedArtist(null); setView('artist'); }} style={{ background:'linear-gradient(135deg,rgba(255,140,0,0.12),rgba(255,100,0,0.06))', border:'1px solid rgba(255,140,0,0.25)', borderRadius:'10px', padding:'16px 8px', color:'#fff', cursor:'pointer', textAlign:'center', fontSize:'20px', fontWeight:900, fontFamily:'Impact,sans-serif', letterSpacing:'1px' }}>{year}</button>
                      <button onClick={() => shuffleYear(year)} style={{ background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:'8px', padding:'5px', color:'#aaa', cursor:'pointer', fontSize:'11px', display:'flex', alignItems:'center', justifyContent:'center', gap:'4px' }}>🔀 Shuffle</button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── ARTIST / YEAR ALBUMS ── */}
        {view === 'artist' && (
          <div style={{ padding:'0 16px' }}>
            <div style={{ padding:'12px 0 16px', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
              <div>
                <div style={{ fontSize:'22px', fontWeight:900, color:'#fff' }}>{selectedArtist || `${selectedYear}`}</div>
                <div style={{ fontSize:'12px', color:'#555' }}>{(selectedArtist ? artistAlbums : yearAlbums).length} albums</div>
              </div>
              {selectedYear && !selectedArtist && (
                <button onClick={() => shuffleYear(selectedYear)} style={{ background:'rgba(255,140,0,0.15)', border:'1px solid rgba(255,140,0,0.4)', borderRadius:'10px', padding:'10px 18px', color:'#ff8c00', cursor:'pointer', fontWeight:700, fontSize:'13px' }}>🔀 Shuffle {selectedYear}</button>
              )}
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(150px,1fr))', gap:'12px' }}>
              {(selectedArtist ? artistAlbums : yearAlbums).map(album => (
                <button key={album.folderPrefix} onClick={() => openAlbum(album)} style={{ background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:'10px', padding:'0', color:'#fff', cursor:'pointer', textAlign:'left', overflow:'hidden', transition:'all 0.15s' }}
                  onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.transform='scale(1.03)'; (e.currentTarget as HTMLButtonElement).style.borderColor='rgba(255,140,0,0.5)'; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.transform='scale(1)'; (e.currentTarget as HTMLButtonElement).style.borderColor='rgba(255,255,255,0.08)'; }}
                >
                  <div style={{ width:'100%', aspectRatio:'1', overflow:'hidden', background:'#111', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'36px' }}>
                    {album.artworkUrl ? <img src={album.artworkUrl} alt={album.album} style={{ width:'100%', height:'100%', objectFit:'cover' }} onError={e => { (e.currentTarget as HTMLImageElement).style.display='none'; }} /> : '💿'}
                  </div>
                  <div style={{ padding:'8px 10px 10px' }}>
                    <div style={{ fontSize:'12px', fontWeight:700, color:'#fff', lineHeight:'1.3', marginBottom:'3px', overflow:'hidden', display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical' }}>{album.album}</div>
                    <div style={{ fontSize:'11px', color:'#ff8c00' }}>{album.year}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── TRACKS ── */}
        {view === 'tracks' && currentAlbum && (
          <div style={{ padding:'0 16px' }}>
            <div style={{ display:'flex', gap:'16px', marginBottom:'20px', alignItems:'flex-start', paddingTop:'12px' }}>
              <div style={{ width:'100px', height:'100px', flexShrink:0, borderRadius:'8px', overflow:'hidden', background:'#151515', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'40px' }}>
                {currentAlbum.artworkUrl ? <img src={currentAlbum.artworkUrl} alt="" style={{ width:'100%', height:'100%', objectFit:'cover' }} /> : '💿'}
              </div>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:'18px', fontWeight:900, color:'#fff', marginBottom:'2px', lineHeight:'1.2' }}>{currentAlbum.album}</div>
                <div style={{ fontSize:'13px', color:'#ff8c00', marginBottom:'12px' }}>{currentAlbum.artist} · {currentAlbum.year}</div>
                <div style={{ display:'flex', gap:'8px' }}>
                  <button onClick={() => playTracks(tracks, 0)} style={{ background:'#ff8c00', border:'none', borderRadius:'8px', padding:'8px 18px', color:'#000', fontWeight:900, fontSize:'13px', cursor:'pointer' }}>▶ Play</button>
                  <button onClick={() => playTracks(tracks, 0, true)} style={{ background:'rgba(255,255,255,0.1)', border:'none', borderRadius:'8px', padding:'8px 18px', color:'#fff', fontWeight:700, fontSize:'13px', cursor:'pointer' }}>🔀 Shuffle</button>
                </div>
              </div>
            </div>
            {tracksLoading ? <div style={{ textAlign:'center', padding:'40px', color:'#ff8c00' }}>Loading tracks...</div> : (
              <div style={{ display:'flex', flexDirection:'column', gap:'2px' }}>
                <div style={{ fontSize:'11px', color:'#555', textTransform:'uppercase', letterSpacing:'1px', marginBottom:'8px' }}>{tracks.length} Tracks</div>
                {tracks.map((file, i) => (
                  <button key={file.fileName} onClick={() => playTracks(tracks, i)} style={{ background: currentTrack?.fileName===file.fileName ? 'rgba(255,140,0,0.15)' : 'rgba(255,255,255,0.03)', border: currentTrack?.fileName===file.fileName ? '1px solid rgba(255,140,0,0.4)' : '1px solid transparent', borderRadius:'8px', padding:'10px 14px', color:'#fff', cursor:'pointer', textAlign:'left', display:'flex', alignItems:'center', gap:'12px', fontSize:'13px' }}>
                    <span style={{ color: currentTrack?.fileName===file.fileName ? '#ff8c00' : '#444', width:'24px', textAlign:'center', flexShrink:0 }}>{currentTrack?.fileName===file.fileName && playing ? '▶' : i+1}</span>
                    <span style={{ flex:1, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', color: currentTrack?.fileName===file.fileName ? '#ff8c00' : '#ddd', fontWeight: currentTrack?.fileName===file.fileName ? 700 : 400 }}>{cleanName(file.name)}</span>
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
          <div onClick={e => { const rect = e.currentTarget.getBoundingClientRect(); if (audioRef.current) audioRef.current.currentTime = ((e.clientX-rect.left)/rect.width)*duration; }} style={{ height:'3px', background:'rgba(255,255,255,0.1)', borderRadius:'2px', marginBottom:'10px', cursor:'pointer' }}>
            <div style={{ height:'100%', width:`${duration?(progress/duration)*100:0}%`, background:'linear-gradient(90deg,#ff6a00,#ff8c00)', borderRadius:'2px', transition:'width 0.5s linear' }} />
          </div>
          <div style={{ maxWidth:'900px', margin:'0 auto', display:'flex', alignItems:'center', gap:'10px' }}>
            {currentAlbum?.artworkUrl && <img src={currentAlbum.artworkUrl} alt="" style={{ width:'44px', height:'44px', borderRadius:'6px', objectFit:'cover', flexShrink:0 }} onError={e => { (e.currentTarget as HTMLImageElement).style.display='none'; }} />}
            <div style={{ flex:1, minWidth:0 }}>
              <div style={{ fontSize:'13px', fontWeight:700, color:'#ff8c00', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{cleanName(currentTrack.name)}</div>
              <div style={{ fontSize:'11px', color:'#555' }}>{isYearShuffle ? `🔀 Shuffling ${currentAlbum?.year}` : currentAlbum?.artist || ''} · {fmt(progress)} / {fmt(duration)}</div>
            </div>
            <div style={{ display:'flex', alignItems:'center', gap:'5px', flexShrink:0 }}>
              <button onClick={playPrev} disabled={isYearShuffle} style={ctrlBtn}>⏮</button>
              <button onClick={togglePlay} style={{ ...ctrlBtn, width:'46px', height:'46px', background:'#ff8c00', color:'#000', fontSize:'18px', borderRadius:'50%', border:'none' }}>
                {playing ? '⏸' : '▶'}
              </button>
              <button onClick={handleSkipNext} style={ctrlBtn}>⏭</button>
              <button onClick={toggleFavourite} disabled={!user} title={user ? (isFavd ? 'Remove from favourites' : 'Add to favourites') : 'Sign in to save favourites'} style={{ ...ctrlBtn, color: isFavd ? '#ff4d6d' : '#555', fontSize:'18px', border: isFavd ? '1px solid rgba(255,77,109,0.4)' : '1px solid rgba(255,255,255,0.1)' }}>
                {isFavd ? '❤️' : '🤍'}
              </button>
              <button onClick={() => setShuffle(s => !s)} style={{ ...ctrlBtn, color: shuffle ? '#ff8c00' : '#555' }}>🔀</button>
            </div>
            <input type="range" min={0} max={1} step={0.01} value={volume} onChange={e => { const v=parseFloat(e.target.value); setVolume(v); if(audioRef.current) audioRef.current.volume=v; }} style={{ width:'55px', accentColor:'#ff8c00' }} />
          </div>
        </div>
      )}
      <style>{`button:disabled{opacity:0.3;cursor:default;}`}</style>
    </div>
  );
}

const ctrlBtn: React.CSSProperties = {
  background:'rgba(255,255,255,0.08)', border:'1px solid rgba(255,255,255,0.1)',
  borderRadius:'8px', color:'#fff', cursor:'pointer', width:'38px', height:'38px',
  fontSize:'14px', display:'flex', alignItems:'center', justifyContent:'center',
};
