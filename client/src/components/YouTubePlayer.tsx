import { useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, Check } from 'lucide-react';
import { VideoProgress } from '../types';

interface YouTubePlayerProps {
  videoId: string;
  courseId: string;
  title: string;
  initialTime?: number;
  duration: number;
  onTimeUpdate: (progress: VideoProgress) => void;
  onVideoComplete: () => void;
  onNextVideo?: () => void;
  onPreviousVideo?: () => void;
  hasNext?: boolean;
  hasPrevious?: boolean;
}

// Extend window interface to include YouTube IFrame API
declare global {
  interface Window {
    YT: {
      Player: any;
      PlayerState: {
        PLAYING: number;
        PAUSED: number;
        ENDED: number;
      };
    };
    onYouTubeIframeAPIReady: () => void;
  }
}

export default function YouTubePlayer({
  videoId,
  courseId,
  title,
  initialTime = 0,
  duration,
  onTimeUpdate,
  onVideoComplete,
  onNextVideo,
  onPreviousVideo,
  hasNext = false,
  hasPrevious = false,
}: YouTubePlayerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const playerInstanceRef = useRef<any>(null);
  const lastSavedTimeRef = useRef<number>(initialTime || 0);
  
  // Update the lastSavedTimeRef when initialTime changes
  useEffect(() => {
    lastSavedTimeRef.current = initialTime || 0;
  }, [initialTime]);
  
  // Use a simple iframe embed to avoid issues with the YouTube API
  useEffect(() => {
    let mounted = true;
    let saveInterval: number | undefined;
    
    const setupYouTubeEmbed = () => {
      if (!mounted) return;
      
      // Clear previous interval if it exists
      if (saveInterval) {
        window.clearInterval(saveInterval);
      }
      
      // Set initial loading state
      setIsLoading(true);
      
      // Ensure lastSavedTimeRef has the correct initial time
      lastSavedTimeRef.current = initialTime || 0;
      
      try {
        // Create the iframe
        const iframe = document.createElement('iframe');
        iframe.id = 'youtube-embed';
        iframe.width = '100%';
        iframe.height = '100%';
        iframe.src = `https://www.youtube.com/embed/${videoId}?autoplay=1&start=${Math.floor(initialTime || 0)}&enablejsapi=1&rel=0&modestbranding=1`;
        iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share';
        iframe.allowFullscreen = true;
        iframe.style.border = 'none';
        iframe.onload = () => {
          if (mounted) {
            setIsLoading(false);
          }
        };
        
        // Clear any existing content
        const container = document.getElementById('player-container');
        if (container) {
          container.innerHTML = '';
          container.appendChild(iframe);
        }
        
        // Set up interval to save progress every 5 seconds
        // Using a shorter interval to ensure progress is saved more frequently
        saveInterval = window.setInterval(() => {
          if (!mounted) return;
          
          // We'll use a simplified approach since we can't easily access the current time
          // Increment the saved time by 5 seconds (the interval time)
          lastSavedTimeRef.current += 5;
          
          // Create a progress object
          const progress: VideoProgress = {
            videoId,
            courseId,
            currentTime: lastSavedTimeRef.current,
            duration,
            completed: lastSavedTimeRef.current >= duration * 0.95, // Mark as complete if watched 95%
            lastWatched: new Date().toISOString(),
          };
          
          // Save the progress
          onTimeUpdate(progress);
        }, 5000); // Update every 5 seconds
      } catch (error) {
        console.error('Error setting up YouTube embed:', error);
        setHasError(true);
        setIsLoading(false);
      }
    };
    
    setupYouTubeEmbed();
    
    // Clean up function
    return () => {
      mounted = false;
      if (saveInterval) {
        window.clearInterval(saveInterval);
      }
    };
  }, [videoId, duration, courseId, onTimeUpdate, initialTime]);
  
  // Toggle fullscreen
  const toggleFullScreen = () => {
    if (!containerRef.current) return;
    
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch(err => {
        console.error('Error attempting to enable full-screen mode:', err);
      });
    } else {
      document.exitFullscreen();
    }
  };
  
  // Handle video marking as complete
  const handleMarkComplete = (e: React.MouseEvent) => {
    e.preventDefault();
    onVideoComplete();
  };
  
  return (
    <div 
      className="w-full overflow-hidden rounded-lg border bg-card shadow-sm"
      ref={containerRef}
    >
      {/* Video title bar */}
      <div className="bg-muted p-3 flex items-center justify-between">
        <h3 className="font-medium text-sm truncate">{title}</h3>
        
        {/* Mark as complete button */}
        <button 
          onClick={handleMarkComplete}
          className="text-xs bg-primary text-white px-3 py-1 rounded-full hover:bg-primary/90 flex items-center gap-1"
        >
          <Check className="w-3 h-3" />
          Mark as complete
        </button>
      </div>
      
      {/* Player container */}
      <div className="aspect-video bg-black relative w-full">
        <div id="player-container" className="absolute inset-0 w-full h-full"></div>
        
        {/* Loading overlay */}
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black z-10">
            <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin"></div>
          </div>
        )}
        
        {/* Error overlay */}
        {hasError && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/90 z-10 text-white p-6 text-center">
            <p className="mb-4">There was an error loading the video.</p>
            <button 
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90"
            >
              Reload
            </button>
          </div>
        )}
        
        {/* Navigation buttons overlay */}
        <div className="absolute inset-0 pointer-events-none flex items-center justify-between px-4 z-20">
          {/* Previous button */}
          {hasPrevious && (
            <button 
              onClick={onPreviousVideo}
              className="pointer-events-auto bg-black/70 text-white rounded-full w-10 h-10 flex items-center justify-center hover:bg-black/90 transition-colors"
            >
              <ChevronLeft className="h-6 w-6" />
            </button>
          )}
          
          {/* Empty space */}
          <div></div>
          
          {/* Next button */}
          {hasNext && (
            <button 
              onClick={onNextVideo}
              className="pointer-events-auto bg-black/70 text-white rounded-full w-10 h-10 flex items-center justify-center hover:bg-black/90 transition-colors"
            >
              <ChevronRight className="h-6 w-6" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}