import { useCallback, useRef, useState } from 'react';
import { usePlayerStore } from '../store/playerStore';

interface ProgressBarProps {
  onSeek: (time: number) => void;
  variant?: 'modern' | 'winamp';
}

function formatTime(seconds: number): string {
  if (!isFinite(seconds) || seconds < 0) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export function ProgressBar({ onSeek, variant = 'modern' }: ProgressBarProps) {
  const { currentTime, duration, currentTrack } = usePlayerStore();
  const progressRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragTime, setDragTime] = useState(0);

  // FIXED: Separate display progress to prevent jitter
  const displayProgress = duration > 0 ? ((isDragging ? dragTime : currentTime) / duration) * 100 : 0;

  const handleSeek = useCallback((e: React.MouseEvent | MouseEvent) => {
    if (!progressRef.current || !duration) return;

    const rect = progressRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
    const percent = x / rect.width;
    const newTime = percent * duration;

    return newTime;
  }, [duration]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (!currentTrack) return;

    setIsDragging(true);
    const time = handleSeek(e);
    if (time !== undefined) setDragTime(time);

    const handleMouseMove = (e: MouseEvent) => {
      const time = handleSeek(e);
      if (time !== undefined) setDragTime(time);
    };

    const handleMouseUp = (e: MouseEvent) => {
      const time = handleSeek(e);
      if (time !== undefined) {
        onSeek(time);
      }
      setIsDragging(false);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }, [currentTrack, handleSeek, onSeek]);

  const displayTime = isDragging ? dragTime : currentTime;

  if (variant === 'winamp') {
    return (
      <div className="flex items-center gap-2">
        <span className="text-[10px] text-[#00ff00] font-lcd w-10 text-right">
          {formatTime(displayTime)}
        </span>
        <div
          ref={progressRef}
          onMouseDown={handleMouseDown}
          className="flex-1 h-[10px] bg-[#0a0a0a] border border-[#3a3a5c] cursor-pointer relative"
        >
          <div
            className="absolute top-0 left-0 h-full bg-gradient-to-r from-[#00aa00] to-[#00ff00]"
            style={{ width: `${displayProgress}%` }}
          />
          <div
            className="absolute top-1/2 -translate-y-1/2 w-[8px] h-[8px] bg-[#00ff00] border border-[#00aa00]"
            style={{ left: `calc(${displayProgress}% - 4px)` }}
          />
        </div>
        <span className="text-[10px] text-[#00ff00] font-lcd w-10">
          {formatTime(duration)}
        </span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3 w-full">
      <span className="text-xs text-app-text-muted w-10 text-right font-mono">
        {formatTime(displayTime)}
      </span>
      <div
        ref={progressRef}
        onMouseDown={handleMouseDown}
        className="flex-1 h-1 bg-app-surface-light rounded-full cursor-pointer group relative"
      >
        <div
          className="absolute top-0 left-0 h-full bg-app-accent rounded-full"
          style={{ width: `${displayProgress}%` }}
        />
        <div
          className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full shadow opacity-0 group-hover:opacity-100 transition-opacity"
          style={{ left: `calc(${displayProgress}% - 6px)` }}
        />
      </div>
      <span className="text-xs text-app-text-muted w-10 font-mono">
        {formatTime(duration)}
      </span>
    </div>
  );
}
