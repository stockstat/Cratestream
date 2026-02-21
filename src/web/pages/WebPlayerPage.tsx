import { useState, useRef, useEffect, useMemo } from 'react';
import { doc, getDoc, setDoc, updateDoc, arrayUnion, arrayRemove, increment, collection, query, orderBy, limit, getDocs } from 'firebase/firestore';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth, db } from '../firebase';

interface AlbumEntry {
  artist: string; album: string; year: number;
  artworkUrl: string | null; folderPrefix: string;
}
interface FileItem { type: 'file'; name: string; fileName: string; size: number; url: string; }
interface FavTrack {
  id: string; name: string; fileName: string; url: string;
  artist: string; album: string; artworkUrl: string | null; addedAt: number;
}
type HomeTab = 'artists' | 'years' | 'favourites' | 'recent' | 'new' | 'community';
type ViewType = 'home' | 'artist' | 'tracks';

interface RecommendedTrack {
  id: string; name: string; fileName: string; url: string;
  artist: string; album: string; artworkUrl: string | null;
  count: number; recommendedBy: string[]; lastRecommended: number;
}

const BUCKET    = '1994HipHop';
const INDEX_URL = `https://f001.backblazeb2.com/file/${BUCKET}/web-index.json`;
const ALPHABET  = '#ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

export function WebPlayerPage() {
  const [user, setUser]                       = useState<User | null>(null);
  const [index, setIndex]                     = useState<AlbumEntry[]>([]);
  const [indexLoading, setIndexLoading]       = useState(true);
  const [navStack, setNavStack]               = useState<Array<{ view: ViewType; artist: string | null; year: number | null; scrollY: number }>>([{ view: 'home', artist: null, year: null, scrollY: 0 }]);
  const [tracks, setTracks]                   = useState<FileItem[]>([]);
  const [currentAlbum, setCurrentAlbum]       = useState<AlbumEntry | null>(null);
  const [tracksLoading, setTracksLoading]     = useState(false);
  const [search, setSearch]                   = useState('');
  const [activeLetter, setActiveLetter]       = useState('A');
  const [homeTab, setHomeTab]                 = useState<HomeTab>('artists');
  const [favourites, setFavourites]           = useState<FavTrack[]>([]);
  const [favIds, setFavIds]                   = useState<Set<string>>(new Set());
  const [recentlyPlayed, setRecentlyPlayed]   = useState<FavTrack[]>([]);
  const [newAlbums, setNewAlbums]             = useState<AlbumEntry[]>([]);
  const [showNowPlaying, setShowNowPlaying]   = useState(false);
  const [currentTrack, setCurrentTrack]       = useState<FileItem | null>(null);
  const [playing, setPlaying]                 = useState(false);
  const [progress, setProgress]               = useState(0);
  const [duration, setDuration]               = useState(0);
  const [volume, setVolume]                   = useState(1);
  const [queue, setQueue]                     = useState<FileItem[]>([]);
  const [queueIndex, setQueueIndex]           = useState(0);
  const [shuffle, setShuffle]                 = useState(false);
  const [repeat, setRepeat]                   = useState<'off' | 'all' | 'one'>('off');
  const [isYearShuffle, setIsYearShuffle]     = useState(false);
  const [isDiscover, setIsDiscover]           = useState(false);
  const [communityTracks, setCommunityTracks] = useState<RecommendedTrack[]>([]);
  const [communityLoading, setCommunityLoading] = useState(false);
  const [myRecommendIds, setMyRecommendIds]   = useState<Set<string>>(new Set());

  const audioRef       = useRef<HTMLAudioElement>(null);
  const letterRefs     = useRef<Record<string, HTMLDivElement | null>>({});
  const yearQueueRef   = useRef<{ albums: AlbumEntry[]; usedAlbums: Set<string> } | null>(null);
  const containerRef   = useRef<HTMLDivElement>(null);
  const discoverUsedRef = useRef<Set<string>>(new Set());

  const currentNav     = navStack[navStack.length - 1];
  const view           = currentNav.view;
  const selectedArtist = currentNav.artist;
  const selectedYear   = currentNav.year;
  const canGoBack      = navStack.length > 1;

  // ── Navigation ──
  const pushNav = (next: { view: ViewType; artist?: string | null; year?: number | null }) => {
    const scrollY = containerRef.current?.scrollTop || 0;
    setNavStack(prev => [...prev, { view: next.view, artist: next.artist ?? null, year: next.year ?? null, scrollY }]);
  };
  const popNav = () => {
    if (navStack.length <= 1) return;
    setNavStack(prev => {
      const newStack = prev.slice(0, -1);
      const prevScrollY = newStack[newStack.length - 1].scrollY;
      setTimeout(() => { if (containerRef.current) containerRef.current.scrollTop = prevScrollY; }, 50);
      return newStack;
    });
    setSearch('');
  };
  const goHome = () => { setNavStack([{ view: 'home', artist: null, year: null, scrollY: 0 }]); setSearch(''); };

  // ── Auth ──
  useEffect(() => { return onAuthStateChanged(auth, u => setUser(u)); }, []);

  // ── Load index ──
  useEffect(() => {
    fetch(INDEX_URL).then(r => r.json())
      .then(data => { setIndex(data.albums || []); setIndexLoading(false); })
      .catch(() => setIndexLoading(false));
  }, []);

  // ── Load favourites ──
  useEffect(() => {
    if (!user) { setFavourites([]); setFavIds(new Set()); return; }
    getDoc(doc(db, 'users', user.uid)).then(snap => {
      const favs: FavTrack[] = snap.data()?.favourites || [];
      setFavourites(favs.sort((a, b) => b.addedAt - a.addedAt));
      setFavIds(new Set(favs.map(f => f.id)));
    }).catch(() => {});
  }, [user]);

  // ── Recently played (localStorage) ──
  useEffect(() => {
    try {
      const s = localStorage.getItem('cs_recently_played');
      if (s) setRecentlyPlayed(JSON.parse(s));
    } catch {}
  }, []);

  // ── New additions (compare index to last known) ──
  useEffect(() => {
    if (!index.length) return;
    try {
      const prevKeys = new Set<string>(JSON.parse(localStorage.getItem('cs_known_albums') || '[]'));
      const brandNew = prevKeys.size > 0 ? index.filter(a => !prevKeys.has(a.folderPrefix)) : [];
      setNewAlbums(brandNew.slice(0, 100));
      localStorage.setItem('cs_known_albums', JSON.stringify(index.map(a => a.folderPrefix)));
    } catch {}
  }, [index]);

  // ── Track recently played on track change ──
  useEffect(() => {
    if (!currentTrack || !currentAlbum) return;
    const entry: FavTrack = {
      id: currentTrack.fileName, name: currentTrack.name, fileName: currentTrack.fileName,
      url: currentTrack.url, artist: currentAlbum.artist, album: currentAlbum.album,
      artworkUrl: currentAlbum.artworkUrl, addedAt: Date.now(),
    };
    setRecentlyPlayed(prev => {
      const updated = [entry, ...prev.filter(t => t.id !== entry.id)].slice(0, 20);
      try { localStorage.setItem('cs_recently_played', JSON.stringify(updated)); } catch {}
      return updated;
    });
  }, [currentTrack?.fileName]); // eslint-disable-line

  // ── Favourites toggle ──
  const toggleFavourite = async () => {
    if (!user || !currentTrack || !currentAlbum) return;
    const ref = doc(db, 'users', user.uid);
    const trackId = currentTrack.fileName;
    const favTrack: FavTrack = {
      id: trackId, name: currentTrack.name, fileName: currentTrack.fileName, url: currentTrack.url,
      artist: currentAlbum.artist, album: currentAlbum.album, artworkUrl: currentAlbum.artworkUrl, addedAt: Date.now(),
    };
    if (favIds.has(trackId)) {
      const updated = favourites.filter(f => f.id !== trackId);
      setFavourites(updated);
      setFavIds(prev => { const s = new Set(prev); s.delete(trackId); return s; });
      const snap = await getDoc(ref);
      await setDoc(ref, { favourites: (snap.data()?.favourites || []).filter((f: FavTrack) => f.id !== trackId) }, { merge: true });
    } else {
      setFavourites(prev => [favTrack, ...prev]);
      setFavIds(prev => new Set([...prev, trackId]));
      const snap = await getDoc(ref);
      if (!snap.exists()) await setDoc(ref, { favourites: [favTrack] }, { merge: true });
      else await updateDoc(ref, { favourites: arrayUnion(favTrack) });
    }
  };

  // ── Community recommendations ──
  const loadCommunityTracks = async () => {
    setCommunityLoading(true);
    try {
      const q = query(collection(db, 'recommendations'), orderBy('count', 'desc'), limit(50));
      const snap = await getDocs(q);
      const tracks: RecommendedTrack[] = snap.docs.map(d => d.data() as RecommendedTrack);
      setCommunityTracks(tracks);
      // Mark which ones current user has recommended
      if (user) {
        const myRecs = new Set(tracks.filter(t => t.recommendedBy?.includes(user.uid)).map(t => t.id));
        setMyRecommendIds(myRecs);
      }
    } catch (e) { console.error(e); }
    finally { setCommunityLoading(false); }
  };

  const toggleRecommend = async () => {
    if (!user || !currentTrack || !currentAlbum) return;
    // Sanitize fileName for use as Firestore doc ID (no slashes or special chars)
    const trackId = currentTrack.fileName.replace(/[/\\#%?]/g, '_').substring(0, 500);
    const ref = doc(db, 'recommendations', trackId);
    const alreadyRecommended = myRecommendIds.has(trackId);
    // Optimistic UI update
    if (alreadyRecommended) {
      setMyRecommendIds(prev => { const s = new Set(prev); s.delete(trackId); return s; });
      setCommunityTracks(prev => prev.map(t => t.id === trackId ? { ...t, count: t.count - 1, recommendedBy: t.recommendedBy.filter(u => u !== user.uid) } : t).filter(t => t.count > 0));
    } else {
      setMyRecommendIds(prev => new Set([...prev, trackId]));
    }
    try {
      const snap = await getDoc(ref);
      if (!snap.exists()) {
        // Create new recommendation doc
        const newRec: RecommendedTrack = {
          id: trackId, name: currentTrack.name, fileName: currentTrack.fileName,
          url: currentTrack.url, artist: currentAlbum.artist, album: currentAlbum.album,
          artworkUrl: currentAlbum.artworkUrl, count: 1,
          recommendedBy: [user.uid], lastRecommended: Date.now(),
        };
        await setDoc(ref, newRec);
        setCommunityTracks(prev => [newRec, ...prev].sort((a, b) => b.count - a.count));
      } else if (alreadyRecommended) {
        await updateDoc(ref, {
          count: increment(-1),
          recommendedBy: arrayRemove(user.uid),
        });
      } else {
        await updateDoc(ref, {
          count: increment(1),
          recommendedBy: arrayUnion(user.uid),
          lastRecommended: Date.now(),
        });
        setCommunityTracks(prev => prev.map(t => t.id === trackId ? { ...t, count: t.count + 1 } : t).sort((a, b) => b.count - a.count));
      }
    } catch (e) { console.error(e); }
  };

  // Load community when tab is opened
  useEffect(() => {
    if (homeTab === 'community') loadCommunityTracks();
  }, [homeTab]); // eslint-disable-line

  // Update myRecommendIds when user changes
  useEffect(() => {
    if (!user) { setMyRecommendIds(new Set()); return; }
    setMyRecommendIds(new Set(communityTracks.filter(t => t.recommendedBy?.includes(user.uid)).map(t => t.id)));
  }, [user]); // eslint-disable-line

  // ── Derived data ──
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
  const filteredArtists = useMemo(() =>
    !search ? sortedArtists : sortedArtists.filter(a => a.toLowerCase().includes(search.toLowerCase())),
  [sortedArtists, search]);
  const getLetterKey = (name: string) => {
    const c = name.replace(/^(the |a |an )/i, '')[0]?.toUpperCase();
    return c && /[A-Z]/.test(c) ? c : '#';
  };
  const artistsByLetter = useMemo(() => {
    const map: Record<string, string[]> = {};
    filteredArtists.forEach(a => { const l = getLetterKey(a); if (!map[l]) map[l] = []; map[l].push(a); });
    return map;
  }, [filteredArtists]);
  const scrollToLetter = (letter: string) => {
    setActiveLetter(letter);
    letterRefs.current[letter]?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  // ── Fetch tracks ──
  const fetchTracks = async (album: AlbumEntry): Promise<FileItem[]> => {
    const res = await fetch(`/api/browse?prefix=${encodeURIComponent(album.folderPrefix)}`);
    return (await res.json()).files || [];
  };

  // ── Open album/artist/year ──
  const openAlbum = async (album: AlbumEntry) => {
    setCurrentAlbum(album);
    setTracksLoading(true);
    pushNav({ view: 'tracks' });
    setIsYearShuffle(false);
    setIsDiscover(false);
    yearQueueRef.current = null;
    try { setTracks(await fetchTracks(album)); } catch { setTracks([]); }
    finally { setTracksLoading(false); }
  };
  const openArtist = (artist: string) => { pushNav({ view: 'artist', artist }); setSearch(''); };
  const openYear   = (year: number)   => { pushNav({ view: 'artist', year }); };

  // ── Year shuffle ──
  const shuffleYear = async (year: number) => {
    const yearAlbums = index.filter(a => a.year === year);
    if (!yearAlbums.length) return;
    setIsYearShuffle(true);
    setIsDiscover(false);
    yearQueueRef.current = { albums: [...yearAlbums], usedAlbums: new Set() };
    await playNextYearAlbum(yearAlbums, new Set());
  };
  const playNextYearAlbum = async (albums: AlbumEntry[], used: Set<string>) => {
    let available = albums.filter(a => !used.has(a.folderPrefix));
    if (!available.length) { used.clear(); available = albums; }
    const pick = available[Math.floor(Math.random() * available.length)];
    used.add(pick.folderPrefix);
    try {
      const files = await fetchTracks(pick);
      if (!files.length) return playNextYearAlbum(albums, used);
      const shuffled = [...files].sort(() => Math.random() - 0.5);
      setCurrentAlbum(pick); setTracks(files); setQueue(shuffled);
      setQueueIndex(0); setCurrentTrack(shuffled[0]); setPlaying(true); setShuffle(true);
      if (audioRef.current) { audioRef.current.src = shuffled[0].url; audioRef.current.play(); }
      if (yearQueueRef.current) yearQueueRef.current.usedAlbums = used;
    } catch { playNextYearAlbum(albums, used); }
  };

  // ── Discover mode ──
  const startDiscover = async () => {
    if (isDiscover) { setIsDiscover(false); return; }
    setIsDiscover(true);
    setIsYearShuffle(false);
    yearQueueRef.current = null;
    discoverUsedRef.current = new Set();
    await playNextDiscoverAlbum();
  };
  const playNextDiscoverAlbum = async () => {
    const all = index.filter(a => a.folderPrefix);
    let available = all.filter(a => !discoverUsedRef.current.has(a.folderPrefix));
    if (!available.length) { discoverUsedRef.current = new Set(); available = all; }
    const pick = available[Math.floor(Math.random() * available.length)];
    discoverUsedRef.current.add(pick.folderPrefix);
    try {
      const files = await fetchTracks(pick);
      if (!files.length) return playNextDiscoverAlbum();
      const track = files[Math.floor(Math.random() * files.length)];
      setCurrentAlbum(pick); setTracks(files); setQueue([track]);
      setQueueIndex(0); setCurrentTrack(track); setPlaying(true);
      if (audioRef.current) { audioRef.current.src = track.url; audioRef.current.play(); }
    } catch { playNextDiscoverAlbum(); }
  };

  // ── Playback ──
  const handleTrackEnd = () => {
    if (repeat === 'one') {
      if (audioRef.current) { audioRef.current.currentTime = 0; audioRef.current.play(); }
      return;
    }
    if (isDiscover) { playNextDiscoverAlbum(); return; }
    if (isYearShuffle && yearQueueRef.current) {
      playNextYearAlbum(yearQueueRef.current.albums, yearQueueRef.current.usedAlbums);
    } else {
      const isLast = queueIndex >= queue.length - 1;
      if (isLast && repeat === 'all' && queue.length > 0) {
        setCurrentTrack(queue[0]); setQueueIndex(0);
        if (audioRef.current) { audioRef.current.src = queue[0].url; audioRef.current.play(); }
      } else { playNext(); }
    }
  };
  const handleSkipNext = () => {
    if (isDiscover) { playNextDiscoverAlbum(); return; }
    if (isYearShuffle && yearQueueRef.current) playNextYearAlbum(yearQueueRef.current.albums, yearQueueRef.current.usedAlbums);
    else playNext();
  };
  const playTracks = (trackList: FileItem[], startIndex: number, shuffled = false) => {
    setIsYearShuffle(false); setIsDiscover(false); yearQueueRef.current = null;
    let list = [...trackList]; let idx = startIndex;
    if (shuffled) {
      for (let i = list.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [list[i], list[j]] = [list[j], list[i]];
      }
      idx = 0;
    }
    setQueue(list); setQueueIndex(idx); setCurrentTrack(list[idx]); setPlaying(true); setShuffle(shuffled);
    if (audioRef.current) { audioRef.current.src = list[idx].url; audioRef.current.play(); }
  };
  const playFav = (fav: FavTrack) => {
    const fi: FileItem = { type: 'file', name: fav.name, fileName: fav.fileName, url: fav.url, size: 0 };
    setCurrentAlbum({ artist: fav.artist, album: fav.album, year: 0, artworkUrl: fav.artworkUrl, folderPrefix: '' });
    setQueue([fi]); setQueueIndex(0); setCurrentTrack(fi); setPlaying(true);
    setIsYearShuffle(false); setIsDiscover(false);
    if (audioRef.current) { audioRef.current.src = fav.url; audioRef.current.play(); }
  };
  const playNext = () => {
    const n = queueIndex + 1;
    if (n < queue.length) { setCurrentTrack(queue[n]); setQueueIndex(n); if (audioRef.current) { audioRef.current.src = queue[n].url; audioRef.current.play(); } }
  };
  const playPrev = () => {
    const p = queueIndex - 1;
    if (p >= 0) { setCurrentTrack(queue[p]); setQueueIndex(p); if (audioRef.current) { audioRef.current.src = queue[p].url; audioRef.current.play(); } }
  };
  const togglePlay = () => {
    if (!audioRef.current) return;
    if (playing) { audioRef.current.pause(); setPlaying(false); }
    else { audioRef.current.play(); setPlaying(true); }
  };
  const handleScrub = (e: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const pct = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    if (audioRef.current && duration) audioRef.current.currentTime = pct * duration;
  };

  const fmt = (s: number) => !s || isNaN(s) ? '0:00' : `${Math.floor(s / 60)}:${Math.floor(s % 60).toString().padStart(2, '0')}`;
  const cleanName = (n: string) => n.replace(/\.(mp3|flac|wav|ogg|m4a|aac)$/i, '').replace(/^\d+\s*[-_.]\s*/, '').trim();
  const isFavd = currentTrack ? favIds.has(currentTrack.fileName) : false;
  const sanitizedTrackId = currentTrack ? currentTrack.fileName.replace(/[/\\#%?]/g, '_').substring(0, 500) : '';
  const isRecommended = currentTrack ? myRecommendIds.has(sanitizedTrackId) : false;
  const recCount = communityTracks.find(t => t.id === sanitizedTrackId)?.count ?? 0;
  const artistAlbums = selectedArtist ? (artists[selectedArtist] || []) : [];
  const yearAlbums   = selectedYear   ? index.filter(a => a.year === selectedYear) : [];

  // ── FULL SCREEN NOW PLAYING ──
  if (showNowPlaying && currentTrack) {
    return (
      <div style={{ position: 'fixed', inset: 0, zIndex: 999, background: '#0d0d0d', display: 'flex', flexDirection: 'column', fontFamily: 'system-ui,-apple-system,sans-serif' }}>
        <audio ref={audioRef}
          onTimeUpdate={() => { if (audioRef.current) setProgress(audioRef.current.currentTime); }}
          onLoadedMetadata={() => { if (audioRef.current) setDuration(audioRef.current.duration); }}
          onEnded={handleTrackEnd} onPlay={() => setPlaying(true)} onPause={() => setPlaying(false)}
        />
        {/* Top bar */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px 8px', paddingTop: 'max(16px, env(safe-area-inset-top))' }}>
          <button onClick={() => setShowNowPlaying(false)} style={{ background: 'none', border: 'none', color: '#fff', fontSize: '22px', cursor: 'pointer', padding: '8px', lineHeight: 1 }}>✕</button>
          <div style={{ textAlign: 'center', flex: 1, padding: '0 12px' }}>
            <div style={{ fontSize: '15px', fontWeight: 700, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{cleanName(currentTrack.name)}</div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', marginTop: '2px' }}>
              {isDiscover && <span style={{ fontSize: '10px', color: '#a78bfa', background: 'rgba(124,58,237,0.2)', borderRadius: '6px', padding: '1px 6px' }}>🎲 Discover</span>}
              <button
                onClick={() => {
                  if (currentAlbum?.artist) {
                    setShowNowPlaying(false);
                    openArtist(currentAlbum.artist);
                  }
                }}
                style={{ background: 'none', border: 'none', color: '#ff8c00', fontSize: '12px', cursor: 'pointer', padding: '0', fontWeight: 600 }}
              >
                {currentAlbum?.artist}
              </button>
            </div>
          </div>
          {currentAlbum?.artworkUrl
            ? <img src={currentAlbum.artworkUrl} alt="" style={{ width: '44px', height: '44px', borderRadius: '6px', objectFit: 'cover', flexShrink: 0 }} onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }} />
            : <div style={{ width: '44px', height: '44px', borderRadius: '6px', background: '#222', flexShrink: 0 }} />
          }
        </div>
        {/* Progress bar */}
        <div style={{ padding: '8px 20px' }}>
          <div onMouseDown={handleScrub} onTouchStart={handleScrub} onTouchMove={handleScrub}
            style={{ position: 'relative', height: '28px', display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
            <div style={{ width: '100%', height: '4px', background: 'rgba(255,255,255,0.15)', borderRadius: '2px', overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${duration ? (progress / duration) * 100 : 0}%`, background: '#4da6ff', borderRadius: '2px', transition: 'width 0.3s linear' }} />
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '2px' }}>
            <span style={{ fontSize: '11px', color: '#4da6ff', fontWeight: 600 }}>{fmt(progress)}</span>
            <span style={{ fontSize: '11px', color: '#666' }}>{fmt(duration)}</span>
          </div>
        </div>
        {/* Big artwork */}
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '12px 24px' }}>
          <div style={{ width: '100%', maxWidth: '380px', aspectRatio: '1', borderRadius: '12px', overflow: 'hidden', background: '#1a1a1a', boxShadow: '0 20px 60px rgba(0,0,0,0.8)' }}>
            {currentAlbum?.artworkUrl
              ? <img src={currentAlbum.artworkUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '80px' }}>💿</div>
            }
          </div>
        </div>
        {/* Heart + Recommend */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '32px', padding: '8px 40px', touchAction: 'manipulation' }}>
          <button onClick={toggleFavourite} disabled={!user} title={user ? 'Save to favourites' : 'Sign in to save'} style={{ background: 'none', border: 'none', fontSize: '28px', cursor: 'pointer', padding: '16px', opacity: user ? 1 : 0.3, touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent', minWidth: '64px', minHeight: '64px' }}>
            {isFavd ? '❤️' : '🤍'}
          </button>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px' }}>
            <button
              onClick={toggleRecommend}
              disabled={!user}
              title={user ? (currentTrack && isRecommended ? 'Remove recommendation' : 'Recommend to community') : 'Sign in to recommend'}
              style={{
                background: isRecommended ? 'rgba(255,50,50,0.15)' : 'none',
                border: isRecommended ? '1px solid rgba(255,50,50,0.4)' : '1px solid transparent',
                borderRadius: '50%', fontSize: '28px', cursor: 'pointer', padding: '16px',
                opacity: user ? 1 : 0.3,
                filter: isRecommended ? 'sepia(1) saturate(5) hue-rotate(-15deg)' : 'grayscale(1) brightness(0.4)',
                touchAction: 'manipulation',
                WebkitTapHighlightColor: 'transparent',
                minWidth: '64px', minHeight: '64px',
              }}
            >
              👍
            </button>
            {recCount > 0 && (
              <span style={{ fontSize: '10px', color: isRecommended ? '#ff5555' : '#4da6ff', fontWeight: 700 }}>
                {recCount}
              </span>
            )}
          </div>
        </div>
        {/* Controls: shuffle | prev | play | next | repeat */}
        <div style={{ padding: '0 20px 8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <button onClick={() => setShuffle(s => !s)} style={{ background: 'none', border: 'none', color: shuffle ? '#4da6ff' : '#555', fontSize: '22px', cursor: 'pointer', padding: '12px', touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent' }}>🔀</button>
            <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
              <button onClick={playPrev} disabled={isYearShuffle || isDiscover} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', padding: '8px' }}>
                <svg width="36" height="36" viewBox="0 0 24 24" fill="currentColor"><path d="M6 6h2v12H6zm3.5 6l8.5 6V6z" /></svg>
              </button>
              <button onClick={togglePlay} style={{ width: '70px', height: '70px', borderRadius: '50%', background: '#4da6ff', border: 'none', color: '#000', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {playing
                  ? <svg width="30" height="30" viewBox="0 0 24 24" fill="currentColor"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" /></svg>
                  : <svg width="30" height="30" viewBox="0 0 24 24" fill="currentColor" style={{ marginLeft: '4px' }}><path d="M8 5v14l11-7z" /></svg>
                }
              </button>
              <button onClick={handleSkipNext} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', padding: '8px' }}>
                <svg width="36" height="36" viewBox="0 0 24 24" fill="currentColor"><path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z" /></svg>
              </button>
            </div>
            {/* Repeat */}
            <button onClick={() => setRepeat(r => r === 'off' ? 'all' : r === 'all' ? 'one' : 'off')} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '12px', position: 'relative', touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent' }}>
              {repeat === 'one'
                ? <svg width="24" height="24" viewBox="0 0 24 24" fill="#4da6ff"><path d="M7 7h10v3l4-4-4-4v3H5v6h2V7zm10 10H7v-3l-4 4 4 4v-3h12v-6h-2v4zm-4-2V9h-1l-2 1v1h1.5v4H13z" /></svg>
                : <svg width="24" height="24" viewBox="0 0 24 24" fill={repeat === 'all' ? '#4da6ff' : '#555'}><path d="M7 7h10v3l4-4-4-4v3H5v6h2V7zm10 10H7v-3l-4 4 4 4v-3h12v-6h-2v4z" /></svg>
              }
              {repeat !== 'off' && <div style={{ position: 'absolute', bottom: '4px', left: '50%', transform: 'translateX(-50%)', width: '4px', height: '4px', borderRadius: '50%', background: '#4da6ff' }} />}
            </button>
          </div>
          {/* Volume */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', paddingBottom: 'max(16px, env(safe-area-inset-bottom))' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="#666"><path d="M3 9v6h4l5 5V4L7 9H3z" /></svg>
            <input type="range" min={0} max={1} step={0.01} value={volume}
              onChange={e => { const v = parseFloat(e.target.value); setVolume(v); if (audioRef.current) audioRef.current.volume = v; }}
              style={{ flex: 1, accentColor: '#4da6ff', height: '4px' }}
            />
            <svg width="20" height="20" viewBox="0 0 24 24" fill="#666"><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z" /></svg>
          </div>
        </div>
      </div>
    );
  }

  // ── MAIN APP ──
  return (
    <div className="web-player-root" style={{ backgroundColor: '#0a0a0a', minHeight: '100vh', color: '#fff', fontFamily: 'system-ui,-apple-system,sans-serif' }}>
      <audio ref={audioRef}
        onTimeUpdate={() => { if (audioRef.current) setProgress(audioRef.current.currentTime); }}
        onLoadedMetadata={() => { if (audioRef.current) setDuration(audioRef.current.duration); }}
        onEnded={handleTrackEnd} onPlay={() => setPlaying(true)} onPause={() => setPlaying(false)}
      />

      {/* Header */}
      <div style={{ background: 'linear-gradient(135deg,#1a0800,#2a1000)', borderBottom: '2px solid rgba(255,140,0,0.35)', padding: '10px 16px', position: 'sticky', top: 0, zIndex: 100, display: 'flex', alignItems: 'center', gap: '10px' }}>
        {canGoBack
          ? <button onClick={popNav} style={{ background: 'rgba(255,255,255,0.08)', border: 'none', borderRadius: '8px', color: '#fff', padding: '6px 12px', cursor: 'pointer', fontSize: '16px', flexShrink: 0 }}>←</button>
          : <img src="/Cratestream.PNG" alt="" style={{ height: '38px', borderRadius: '4px', cursor: 'pointer', flexShrink: 0 }} onClick={goHome} />
        }
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 900, fontSize: '15px', color: '#ff8c00', fontFamily: 'Impact,sans-serif', letterSpacing: '1px', cursor: 'pointer', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} onClick={goHome}>CRATESTREAM</div>
          <div style={{ fontSize: '10px', color: '#666' }}>
            {view === 'artist' && (selectedArtist || selectedYear) ? (selectedArtist || `${selectedYear}`) : 'The Vault of 90s Hip-Hop'}
          </div>
        </div>
        {canGoBack && <button onClick={goHome} style={{ background: 'none', border: 'none', color: '#555', padding: '6px 8px', cursor: 'pointer', fontSize: '11px', flexShrink: 0 }}>⌂ Home</button>}
      </div>

      <div ref={containerRef} style={{ maxWidth: '900px', margin: '0 auto', padding: '0 0 120px 0' }}>

        {/* ── HOME ── */}
        {view === 'home' && (
          <div>
            {/* Search */}
            <div style={{ padding: '12px 16px 8px' }}>
              <input type="text" placeholder="Search artists..." value={search} onChange={e => setSearch(e.target.value)}
                style={{ width: '100%', padding: '11px 16px', borderRadius: '12px', boxSizing: 'border-box', border: '1px solid rgba(255,140,0,0.25)', background: 'rgba(255,255,255,0.06)', color: '#fff', fontSize: '15px', outline: 'none' }}
              />
            </div>

            {/* Discover button */}
            <div style={{ padding: '0 16px 12px' }}>
              <button onClick={startDiscover} style={{
                width: '100%', padding: '14px', borderRadius: '14px', cursor: 'pointer', outline: 'none',
                background: isDiscover ? 'linear-gradient(135deg,#7c3aed,#4f46e5)' : 'linear-gradient(135deg,rgba(124,58,237,0.2),rgba(79,70,229,0.2))',
                borderWidth: '1px', borderStyle: 'solid', borderColor: isDiscover ? 'transparent' : 'rgba(124,58,237,0.4)',
                color: isDiscover ? '#fff' : '#a78bfa',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
                fontSize: '15px', fontWeight: 900, fontFamily: 'Impact,sans-serif', letterSpacing: '1px',
                boxShadow: isDiscover ? '0 4px 20px rgba(124,58,237,0.5)' : 'none',
              }}>
                <span style={{ fontSize: '20px' }}>🎲</span>
                {isDiscover ? '⏹ STOP DISCOVER' : 'DISCOVER MODE'}
                <span style={{ fontSize: '11px', fontWeight: 400, opacity: 0.8, fontFamily: 'system-ui' }}>
                  {isDiscover ? 'Playing random tracks from the vault' : 'Random tracks · All years · Never stops'}
                </span>
              </button>
            </div>

            {/* Tabs */}
            {!search && (
              <div style={{ display: 'flex', padding: '0 16px', gap: '2px', borderBottom: '1px solid rgba(255,255,255,0.06)', overflowX: 'auto' }}>
                {([
                  { id: 'artists',    label: 'Artists' },
                  { id: 'years',      label: 'Years' },
                  { id: 'new',        label: '🆕 New' },
                  { id: 'recent',     label: '🕐 Recent' },
                  { id: 'favourites', label: '❤️', badge: favourites.length },
                  { id: 'community',  label: '👍 Community' },
                ] as Array<{ id: HomeTab; label: string; badge?: number }>).map(tab => (
                  <button key={tab.id} onClick={() => setHomeTab(tab.id)} style={{
                    background: 'none', border: 'none', padding: '10px 12px', cursor: 'pointer', whiteSpace: 'nowrap',
                    color: homeTab === tab.id ? '#ff8c00' : '#555', fontWeight: homeTab === tab.id ? 700 : 400,
                    fontSize: '12px', borderBottom: homeTab === tab.id ? '2px solid #ff8c00' : '2px solid transparent',
                    display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0,
                  }}>
                    {tab.label}
                    {tab.badge ? <span style={{ background: 'rgba(255,140,0,0.2)', color: '#ff8c00', borderRadius: '10px', padding: '1px 5px', fontSize: '9px', fontWeight: 900 }}>{tab.badge}</span> : null}
                  </button>
                ))}
              </div>
            )}

            {/* Tab content */}
            {indexLoading ? (
              <div style={{ textAlign: 'center', padding: '60px', color: '#ff8c00' }}>Loading library...</div>
            ) : search ? (
              // Search results
              <div style={{ padding: '12px 16px' }}>
                <div style={{ fontSize: '11px', color: '#555', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '10px' }}>{filteredArtists.length} Artists found</div>
                {filteredArtists.slice(0, 50).map(artist => (
                  <button key={artist} onClick={() => openArtist(artist)} style={{ display: 'flex', alignItems: 'center', gap: '12px', width: '100%', background: 'rgba(255,255,255,0.03)', border: '1px solid transparent', borderRadius: '8px', padding: '10px 14px', color: '#fff', cursor: 'pointer', marginBottom: '2px', textAlign: 'left' }}>
                    <div style={{ width: '40px', height: '40px', borderRadius: '6px', background: '#1a1a1a', overflow: 'hidden', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px' }}>
                      {artists[artist]?.[0]?.artworkUrl ? <img src={artists[artist][0].artworkUrl!} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }} /> : '🎤'}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '14px', fontWeight: 600 }}>{artist}</div>
                      <div style={{ fontSize: '11px', color: '#555' }}>{artists[artist]?.length} albums</div>
                    </div>
                    <span style={{ color: '#444' }}>›</span>
                  </button>
                ))}
                {filteredArtists.length > 50 && <div style={{ textAlign: 'center', padding: '12px', color: '#555', fontSize: '12px' }}>Showing 50 of {filteredArtists.length} — type more to narrow</div>}
              </div>
            ) : homeTab === 'favourites' ? (
              // Favourites
              <div style={{ padding: '12px 16px' }}>
                {!user ? (
                  <div style={{ textAlign: 'center', padding: '40px 20px' }}>
                    <div style={{ fontSize: '48px', marginBottom: '12px' }}>❤️</div>
                    <div style={{ fontSize: '16px', fontWeight: 700, marginBottom: '8px' }}>Sign in to save favourites</div>
                    <div style={{ fontSize: '13px', color: '#555', marginBottom: '20px' }}>Your liked tracks will appear here</div>
                    <button onClick={() => window.location.href = '/login?redirect=/listen'} style={{ background: '#ff8c00', border: 'none', borderRadius: '10px', padding: '10px 28px', color: '#000', fontWeight: 900, fontSize: '14px', cursor: 'pointer' }}>Sign In</button>
                  </div>
                ) : favourites.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '40px 20px' }}>
                    <div style={{ fontSize: '48px', marginBottom: '12px' }}>🎵</div>
                    <div style={{ fontSize: '16px', fontWeight: 700, marginBottom: '8px' }}>No favourites yet</div>
                    <div style={{ fontSize: '13px', color: '#555' }}>Tap ❤️ in the now playing screen</div>
                  </div>
                ) : (
                  <>
                    <div style={{ fontSize: '11px', color: '#555', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '10px' }}>{favourites.length} Saved Tracks</div>
                    {favourites.map(fav => (
                      <button key={fav.id} onClick={() => playFav(fav)} style={{ display: 'flex', alignItems: 'center', gap: '12px', width: '100%', background: currentTrack?.fileName === fav.fileName ? 'rgba(255,140,0,0.15)' : 'rgba(255,255,255,0.03)', border: currentTrack?.fileName === fav.fileName ? '1px solid rgba(255,140,0,0.4)' : '1px solid transparent', borderRadius: '10px', padding: '10px 12px', color: '#fff', cursor: 'pointer', marginBottom: '4px', textAlign: 'left' }}>
                        <div style={{ width: '46px', height: '46px', borderRadius: '6px', background: '#1a1a1a', overflow: 'hidden', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>
                          {fav.artworkUrl ? <img src={fav.artworkUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }} /> : '💿'}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: '13px', fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: currentTrack?.fileName === fav.fileName ? '#ff8c00' : '#fff' }}>{cleanName(fav.name)}</div>
                          <div style={{ fontSize: '11px', color: '#555', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{fav.artist} — {fav.album}</div>
                        </div>
                        {currentTrack?.fileName === fav.fileName && playing && <span style={{ color: '#ff8c00' }}>▶</span>}
                      </button>
                    ))}
                  </>
                )}
              </div>
            ) : homeTab === 'recent' ? (
              // Recently played
              <div style={{ padding: '12px 16px' }}>
                {recentlyPlayed.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '40px 20px' }}>
                    <div style={{ fontSize: '48px', marginBottom: '12px' }}>🕐</div>
                    <div style={{ fontSize: '16px', fontWeight: 700, marginBottom: '8px' }}>Nothing played yet</div>
                    <div style={{ fontSize: '13px', color: '#555' }}>Tracks you play will appear here</div>
                  </div>
                ) : (
                  <>
                    <div style={{ fontSize: '11px', color: '#555', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '10px' }}>Last {recentlyPlayed.length} Played</div>
                    {recentlyPlayed.map(track => (
                      <button key={track.id} onClick={() => playFav(track)} style={{ display: 'flex', alignItems: 'center', gap: '12px', width: '100%', background: currentTrack?.fileName === track.fileName ? 'rgba(255,140,0,0.15)' : 'rgba(255,255,255,0.03)', border: currentTrack?.fileName === track.fileName ? '1px solid rgba(255,140,0,0.4)' : '1px solid transparent', borderRadius: '10px', padding: '10px 12px', color: '#fff', cursor: 'pointer', marginBottom: '4px', textAlign: 'left' }}>
                        <div style={{ width: '46px', height: '46px', borderRadius: '6px', background: '#1a1a1a', overflow: 'hidden', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>
                          {track.artworkUrl ? <img src={track.artworkUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }} /> : '💿'}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: '13px', fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: currentTrack?.fileName === track.fileName ? '#ff8c00' : '#fff' }}>{cleanName(track.name)}</div>
                          <div style={{ fontSize: '11px', color: '#555', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{track.artist} — {track.album}</div>
                        </div>
                        {currentTrack?.fileName === track.fileName && playing && <span style={{ color: '#ff8c00' }}>▶</span>}
                      </button>
                    ))}
                  </>
                )}
              </div>
            ) : homeTab === 'new' ? (
              // New additions
              <div style={{ padding: '12px 16px' }}>
                {newAlbums.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '40px 20px' }}>
                    <div style={{ fontSize: '48px', marginBottom: '12px' }}>🆕</div>
                    <div style={{ fontSize: '16px', fontWeight: 700, marginBottom: '8px' }}>No new additions yet</div>
                    <div style={{ fontSize: '13px', color: '#555' }}>New albums added since your last visit appear here</div>
                  </div>
                ) : (
                  <>
                    <div style={{ fontSize: '11px', color: '#555', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '10px' }}>{newAlbums.length} New Additions</div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(140px,1fr))', gap: '10px' }}>
                      {newAlbums.map(album => (
                        <button key={album.folderPrefix} onClick={() => openAlbum(album)} style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px', padding: '0', color: '#fff', cursor: 'pointer', textAlign: 'left', overflow: 'hidden' }}>
                          <div style={{ width: '100%', aspectRatio: '1', overflow: 'hidden', background: '#111', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '32px' }}>
                            {album.artworkUrl ? <img src={album.artworkUrl} alt={album.album} style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }} /> : '💿'}
                          </div>
                          <div style={{ padding: '7px 9px 9px' }}>
                            <div style={{ fontSize: '11px', fontWeight: 700, lineHeight: '1.3', overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>{album.album}</div>
                            <div style={{ fontSize: '10px', color: '#ff8c00', marginTop: '2px' }}>{album.artist}</div>
                          </div>
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
            ) : homeTab === 'community' ? (
              // Community recommendations
              <div style={{ padding: '12px 16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                  <div>
                    <div style={{ fontSize: '11px', color: '#555', textTransform: 'uppercase', letterSpacing: '1px' }}>What the community is feeling 👍</div>
                    <div style={{ fontSize: '10px', color: '#333', marginTop: '2px' }}>Tap 👍 in now playing to recommend a track</div>
                  </div>
                  <button onClick={loadCommunityTracks} style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#888', fontSize: '11px', padding: '5px 10px', cursor: 'pointer' }}>↻ Refresh</button>
                </div>
                {communityLoading ? (
                  <div style={{ textAlign: 'center', padding: '40px', color: '#4da6ff' }}>Loading...</div>
                ) : communityTracks.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '40px 20px' }}>
                    <div style={{ fontSize: '48px', marginBottom: '12px' }}>👍</div>
                    <div style={{ fontSize: '16px', fontWeight: 700, marginBottom: '8px' }}>No recommendations yet</div>
                    <div style={{ fontSize: '13px', color: '#555', marginBottom: '6px' }}>Be the first to recommend a track!</div>
                    <div style={{ fontSize: '12px', color: '#333' }}>Play something and tap 👍 in the now playing screen</div>
                  </div>
                ) : (
                  communityTracks.map((track, i) => (
                    <button key={track.id} onClick={() => playFav(track as any)} style={{
                      display: 'flex', alignItems: 'center', gap: '12px', width: '100%',
                      background: currentTrack?.fileName === track.fileName ? 'rgba(77,166,255,0.12)' : 'rgba(255,255,255,0.03)',
                      border: currentTrack?.fileName === track.fileName ? '1px solid rgba(77,166,255,0.4)' : '1px solid transparent',
                      borderRadius: '10px', padding: '10px 12px', color: '#fff', cursor: 'pointer', marginBottom: '4px', textAlign: 'left',
                    }}>
                      {/* Rank */}
                      <div style={{ width: '24px', textAlign: 'center', flexShrink: 0 }}>
                        <span style={{ fontSize: i < 3 ? '18px' : '12px', color: '#444' }}>
                          {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}`}
                        </span>
                      </div>
                      {/* Artwork */}
                      <div style={{ width: '46px', height: '46px', borderRadius: '6px', background: '#1a1a1a', overflow: 'hidden', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>
                        {track.artworkUrl ? <img src={track.artworkUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }} /> : '💿'}
                      </div>
                      {/* Info */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: '13px', fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: currentTrack?.fileName === track.fileName ? '#4da6ff' : '#fff' }}>{cleanName(track.name)}</div>
                        <div style={{ fontSize: '11px', color: '#555', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{track.artist} — {track.album}</div>
                      </div>
                      {/* Count badge */}
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px', flexShrink: 0 }}>
                        <span style={{ fontSize: '16px' }}>{user && myRecommendIds.has(track.id) ? '👍' : '👍'}</span>
                        <span style={{ fontSize: '11px', fontWeight: 900, color: user && myRecommendIds.has(track.id) ? '#4da6ff' : '#555' }}>{track.count}</span>
                      </div>
                    </button>
                  ))
                )}
              </div>
            ) : homeTab === 'artists' ? (
              // A-Z Artists
              <div style={{ display: 'flex', maxWidth: '600px', margin: '0 auto', width: '100%' }}>
                <div style={{ flex: 1, padding: '0 8px 0 16px' }}>
                  {ALPHABET.map(letter => {
                    const la = artistsByLetter[letter];
                    if (!la?.length) return null;
                    return (
                      <div key={letter} ref={el => { letterRefs.current[letter] = el; }}>
                        <div style={{ fontSize: '13px', fontWeight: 900, color: '#ff8c00', padding: '12px 0 6px', fontFamily: 'Impact,sans-serif', letterSpacing: '2px' }}>{letter}</div>
                        {la.map(artist => (
                          <button key={artist} onClick={() => openArtist(artist)} style={{ display: 'flex', alignItems: 'center', gap: '12px', width: '100%', background: 'rgba(255,255,255,0.02)', border: '1px solid transparent', borderRadius: '8px', padding: '9px 12px', color: '#fff', cursor: 'pointer', marginBottom: '2px', textAlign: 'left' }}>
                            <div style={{ width: '38px', height: '38px', borderRadius: '6px', background: '#161616', overflow: 'hidden', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px' }}>
                              {artists[artist]?.[0]?.artworkUrl ? <img src={artists[artist][0].artworkUrl!} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }} /> : '🎤'}
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ fontSize: '13px', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{artist}</div>
                              <div style={{ fontSize: '11px', color: '#555' }}>{artists[artist]?.length} album{artists[artist]?.length !== 1 ? 's' : ''}</div>
                            </div>
                            <span style={{ color: '#333', fontSize: '12px' }}>›</span>
                          </button>
                        ))}
                      </div>
                    );
                  })}
                </div>
                <div style={{ width: '18px', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '8px 2px', position: 'sticky', top: '60px', alignSelf: 'flex-start', height: 'calc(100vh - 130px)', overflowY: 'auto', flexShrink: 0 }}>
                  {ALPHABET.map(letter => (
                    <button key={letter} onClick={() => scrollToLetter(letter)} style={{ background: 'none', border: 'none', color: activeLetter === letter ? '#ff8c00' : artistsByLetter[letter]?.length ? '#777' : '#2a2a2a', fontSize: '9px', fontWeight: activeLetter === letter ? 900 : 400, padding: '1px 0', cursor: artistsByLetter[letter]?.length ? 'pointer' : 'default', lineHeight: '1.4', width: '100%', textAlign: 'center' }}>{letter}</button>
                  ))}
                </div>
              </div>
            ) : (
              // Years grid
              <div style={{ padding: '12px 16px' }}>
                <div style={{ fontSize: '11px', color: '#555', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '10px' }}>Browse by Year</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(90px,1fr))', gap: '10px' }}>
                  {years.map(year => (
                    <div key={year} style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <button onClick={() => openYear(year)} style={{ background: 'linear-gradient(135deg,rgba(255,140,0,0.12),rgba(255,100,0,0.06))', border: '1px solid rgba(255,140,0,0.25)', borderRadius: '10px', padding: '16px 8px', color: '#fff', cursor: 'pointer', textAlign: 'center', fontSize: '20px', fontWeight: 900, fontFamily: 'Impact,sans-serif' }}>{year}</button>
                      <button onClick={() => shuffleYear(year)} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '5px', color: '#aaa', cursor: 'pointer', fontSize: '11px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>🔀 Shuffle</button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── ARTIST / YEAR ALBUMS ── */}
        {view === 'artist' && (
          <div style={{ padding: '0 16px' }}>
            <div style={{ padding: '12px 0 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontSize: '22px', fontWeight: 900 }}>{selectedArtist || `${selectedYear}`}</div>
                <div style={{ fontSize: '12px', color: '#555' }}>{(selectedArtist ? artistAlbums : yearAlbums).length} albums</div>
              </div>
              {selectedYear && !selectedArtist && (
                <button onClick={() => shuffleYear(selectedYear)} style={{ background: 'rgba(255,140,0,0.15)', border: '1px solid rgba(255,140,0,0.4)', borderRadius: '10px', padding: '10px 18px', color: '#ff8c00', cursor: 'pointer', fontWeight: 700, fontSize: '13px' }}>🔀 Shuffle {selectedYear}</button>
              )}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(150px,1fr))', gap: '12px' }}>
              {(selectedArtist ? artistAlbums : yearAlbums).map(album => (
                <button key={album.folderPrefix} onClick={() => openAlbum(album)} style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px', padding: '0', color: '#fff', cursor: 'pointer', textAlign: 'left', overflow: 'hidden', transition: 'all 0.15s' }}>
                  <div style={{ width: '100%', aspectRatio: '1', overflow: 'hidden', background: '#111', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '36px' }}>
                    {album.artworkUrl ? <img src={album.artworkUrl} alt={album.album} style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }} /> : '💿'}
                  </div>
                  <div style={{ padding: '8px 10px 10px' }}>
                    <div style={{ fontSize: '12px', fontWeight: 700, lineHeight: '1.3', marginBottom: '3px', overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>{album.album}</div>
                    <div style={{ fontSize: '11px', color: '#ff8c00' }}>{album.year}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── TRACKS ── */}
        {view === 'tracks' && currentAlbum && (
          <div style={{ padding: '0 16px' }}>
            <div style={{ display: 'flex', gap: '16px', marginBottom: '20px', alignItems: 'flex-start', paddingTop: '12px' }}>
              <div style={{ width: '90px', height: '90px', flexShrink: 0, borderRadius: '8px', overflow: 'hidden', background: '#151515', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '36px' }}>
                {currentAlbum.artworkUrl ? <img src={currentAlbum.artworkUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : '💿'}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '17px', fontWeight: 900, marginBottom: '2px', lineHeight: '1.2' }}>{currentAlbum.album}</div>
                <div style={{ fontSize: '13px', color: '#ff8c00', marginBottom: '12px' }}>{currentAlbum.artist} · {currentAlbum.year}</div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button onClick={() => playTracks(tracks, 0)} style={{ background: '#ff8c00', border: 'none', borderRadius: '8px', padding: '8px 18px', color: '#000', fontWeight: 900, fontSize: '13px', cursor: 'pointer' }}>▶ Play</button>
                  <button onClick={() => playTracks(tracks, 0, true)} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: '8px', padding: '8px 18px', color: '#fff', fontWeight: 700, fontSize: '13px', cursor: 'pointer' }}>🔀 Shuffle</button>
                </div>
              </div>
            </div>
            {tracksLoading ? (
              <div style={{ textAlign: 'center', padding: '40px', color: '#ff8c00' }}>Loading tracks...</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                <div style={{ fontSize: '11px', color: '#555', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px' }}>{tracks.length} Tracks</div>
                {tracks.map((file, i) => (
                  <button key={file.fileName} onClick={() => playTracks(tracks, i)} style={{ background: currentTrack?.fileName === file.fileName ? 'rgba(255,140,0,0.15)' : 'rgba(255,255,255,0.03)', border: currentTrack?.fileName === file.fileName ? '1px solid rgba(255,140,0,0.4)' : '1px solid transparent', borderRadius: '8px', padding: '10px 14px', color: '#fff', cursor: 'pointer', textAlign: 'left', display: 'flex', alignItems: 'center', gap: '12px', fontSize: '13px' }}>
                    <span style={{ color: currentTrack?.fileName === file.fileName ? '#ff8c00' : '#444', width: '24px', textAlign: 'center', flexShrink: 0 }}>{currentTrack?.fileName === file.fileName && playing ? '▶' : i + 1}</span>
                    <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: currentTrack?.fileName === file.fileName ? '#ff8c00' : '#ddd', fontWeight: currentTrack?.fileName === file.fileName ? 700 : 400 }}>{cleanName(file.name)}</span>
                    <span style={{ color: '#444', fontSize: '11px', flexShrink: 0 }}>{(file.size / 1024 / 1024).toFixed(1)}MB</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── MINI PLAYER BAR ── */}
      {currentTrack && (
        <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 200, background: '#1a1a1a', borderTop: '1px solid rgba(255,140,0,0.3)' }}>
          <div style={{ height: '2px', background: 'rgba(255,255,255,0.08)' }}>
            <div style={{ height: '100%', width: `${duration ? (progress / duration) * 100 : 0}%`, background: '#ff8c00', transition: 'width 0.5s linear' }} />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 14px', paddingBottom: 'max(8px, env(safe-area-inset-bottom))' }}>
            <div onClick={() => setShowNowPlaying(true)} style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, minWidth: 0, cursor: 'pointer' }}>
              {currentAlbum?.artworkUrl
                ? <img src={currentAlbum.artworkUrl} alt="" style={{ width: '42px', height: '42px', borderRadius: '6px', objectFit: 'cover', flexShrink: 0 }} onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }} />
                : <div style={{ width: '42px', height: '42px', borderRadius: '6px', background: '#333', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px' }}>💿</div>
              }
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: '13px', fontWeight: 700, color: '#ff8c00', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{cleanName(currentTrack.name)}</div>
                <div style={{ fontSize: '11px', color: '#666', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {isDiscover
                    ? <span style={{ display:'flex', alignItems:'center', gap:'4px' }}>
                        <span style={{ fontSize:'9px', color:'#a78bfa', background:'rgba(124,58,237,0.2)', borderRadius:'4px', padding:'1px 4px' }}>🎲</span>
                        <span>{currentAlbum?.artist}</span>
                      </span>
                    : isYearShuffle ? `🔀 ${currentAlbum?.year}` : currentAlbum?.artist
                  }
                </div>
              </div>
            </div>
            <button onClick={playPrev} disabled={isYearShuffle || isDiscover} style={miniBtn}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M6 6h2v12H6zm3.5 6l8.5 6V6z" /></svg>
            </button>
            <button onClick={togglePlay} style={{ ...miniBtn, width: '42px', height: '42px', background: '#ff8c00', color: '#000', borderRadius: '50%', border: 'none' }}>
              {playing
                ? <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" /></svg>
                : <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" style={{ marginLeft: '2px' }}><path d="M8 5v14l11-7z" /></svg>
              }
            </button>
            <button onClick={handleSkipNext} style={miniBtn}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z" /></svg>
            </button>
          </div>
        </div>
      )}
      <style>{`button:disabled{opacity:0.3;cursor:default;}`}</style>
    </div>
  );
}

const miniBtn: React.CSSProperties = {
  background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: '8px', color: '#fff', cursor: 'pointer', width: '36px', height: '36px',
  fontSize: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
};
