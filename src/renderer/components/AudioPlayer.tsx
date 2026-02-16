import { useEffect, useRef } from 'react';
import { usePlayerStore } from '../store/playerStore';

/**
 * AudioPlayer Component
 * Handles actual audio playback for tracks loaded from B2/CDN
 */
export function AudioPlayer() {
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

  // Create audio element on mount
  useEffect(() => {
    const audio = new Audio();
    audioRef.current = audio;

    // Set up event listeners
    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
    };

    const handleDurationChange = () => {
      setDuration(audio.duration);
    };

    const handleEnded = () => {
      nextTrack();
    };

    const handleError = (e: Event) => {
      console.error('[AudioPlayer] Error loading track:', e);
      const audioElement = e.target as HTMLAudioElement;
      if (audioElement.error) {
        console.error('[AudioPlayer] Error code:', audioElement.error.code);
        console.error('[AudioPlayer] Error message:', audioElement.error.message);
      }
      setIsPlaying(false);
    };

    const handleCanPlay = () => {
      console.log('[AudioPlayer] Track loaded and ready to play');
    };

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('durationchange', handleDurationChange);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('error', handleError);
    audio.addEventListener('canplay', handleCanPlay);

    // Cleanup
    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('durationchange', handleDurationChange);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('error', handleError);
      audio.removeEventListener('canplay', handleCanPlay);
      audio.pause();
      audio.src = '';
    };
  }, [setCurrentTime, setDuration, setIsPlaying, nextTrack]);

  // Load new track when currentTrack changes
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (currentTrack) {
      // Get the stream URL from the track
      let streamUrl = currentTrack.streamUrl || currentTrack.dropboxLink || currentTrack.filePath;
      
      console.log('[AudioPlayer] Loading track:', currentTrack.title);
      console.log('[AudioPlayer] Original Stream URL:', streamUrl);

      if (!streamUrl) {
        console.error('[AudioPlayer] No stream URL found for track:', currentTrack);
        return;
      }

      // Properly encode the URL to handle special characters
      try {
        // Parse the URL
        const url = new URL(streamUrl);
        
        // Split the pathname into parts
        const pathParts = url.pathname.split('/');
        
        // Encode each part individually (skip empty parts and the first slash)
        const encodedParts = pathParts.map((part, index) => {
          if (part === '' || index === 0) return part;
          // Decode first in case it's already partially encoded, then encode properly
          return encodeURIComponent(decodeURIComponent(part));
        });
        
        // Reconstruct the URL
        url.pathname = encodedParts.join('/');
        streamUrl = url.toString();
        
        console.log('[AudioPlayer] Encoded Stream URL:', streamUrl);
      } catch (err) {
        console.error('[AudioPlayer] Error encoding URL:', err);
        console.log('[AudioPlayer] Using original URL');
      }

      // Load the new track
      audio.src = streamUrl;
      audio.load();

      // Play if should be playing
      if (isPlaying) {
        audio.play().catch(err => {
          console.error('[AudioPlayer] Failed to play:', err);
          setIsPlaying(false);
        });
      }
    } else {
      // No track - stop and clear
      audio.pause();
      audio.src = '';
      setCurrentTime(0);
      setDuration(0);
    }
  }, [currentTrack, setCurrentTime, setDuration, setIsPlaying]);

  // Handle play/pause changes
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !currentTrack) return;

    if (isPlaying) {
      audio.play().catch(err => {
        console.error('[AudioPlayer] Failed to play:', err);
        setIsPlaying(false);
      });
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

  // Handle seeking (when user drags progress bar)
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    // Only update audio time if it's significantly different (avoid feedback loop)
    if (Math.abs(audio.currentTime - currentTime) > 1) {
      audio.currentTime = currentTime;
    }
  }, [currentTime]);

  // This component doesn't render anything visible
  return null;
}
