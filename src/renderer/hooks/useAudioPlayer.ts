import { useEffect, useRef, useCallback } from 'react';
import { usePlayerStore } from '../store/playerStore';

export function useAudioPlayer() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const {
    currentTrack,
    isPlaying,
    volume,
    isMuted,
    currentTime,
    setCurrentTime,
    setDuration,
    setIsPlaying,
    nextTrack,
  } = usePlayerStore();

  // Initialize audio element
  useEffect(() => {
    if (!audioRef.current) {
      audioRef.current = new Audio();
      audioRef.current.preload = 'metadata';
    }

    const audio = audioRef.current;

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
    };

    const handleLoadedMetadata = () => {
      setDuration(audio.duration);
    };

    const handleEnded = () => {
      nextTrack();
    };

    const handleError = (e: Event) => {
      console.error('Audio playback error:', e);
      const audioElement = e.target as HTMLAudioElement;
      if (audioElement.error) {
        console.error('Error code:', audioElement.error.code);
        console.error('Error message:', audioElement.error.message);
      }
      setIsPlaying(false);
    };

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('error', handleError);

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('error', handleError);
    };
  }, [setCurrentTime, setDuration, setIsPlaying, nextTrack]);

  // Load track when it changes
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !currentTrack) return;

    // Determine URL based on source
let url: string;
if (currentTrack.isDropbox) {
  // Dropbox file - use temporary link or get new one
  if (currentTrack.dropboxLink) {
    url = currentTrack.dropboxLink;
  } else {
    // This shouldn't happen, but fallback to getting new link
    console.warn('[Audio] Dropbox track missing temporary link');
    url = currentTrack.filePath; // Will fail, but won't crash
  }
} else if (currentTrack.fileUrl) {
  // Remote URL (for other cloud services)
  url = currentTrack.fileUrl;
} else {
  // Local file - use custom protocol
  const encodedPath = encodeURIComponent(currentTrack.filePath);
  url = `local-music://${encodedPath}`;
}
    
    console.log('[Audio] Loading track:', currentTrack.title);
    console.log('[Audio] URL:', url);
    
    audio.src = url;
    audio.load();

    if (isPlaying) {
      audio.play().catch(err => {
        console.error('[Audio] Play error:', err);
        setIsPlaying(false);
      });
    }
  }, [currentTrack?.id, isPlaying]);

  // Handle play/pause
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !currentTrack) return;

    if (isPlaying) {
      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise.catch(err => {
          console.error('[Audio] Play error:', err);
          setIsPlaying(false);
        });
      }
    } else {
      audio.pause();
    }
  }, [isPlaying, currentTrack, setIsPlaying]);

  // Handle volume changes
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    audio.volume = isMuted ? 0 : volume;
  }, [volume, isMuted]);

  // Seek function
  const seek = useCallback((time: number) => {
    const audio = audioRef.current;
    if (!audio) return;

    audio.currentTime = time;
    setCurrentTime(time);
  }, [setCurrentTime]);

  return {
    audioRef,
    seek,
  };
}