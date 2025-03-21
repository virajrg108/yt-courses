import { useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
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
  const playerRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const playerElementRef = useRef<HTMLDivElement>(null);
  const timeUpdateIntervalRef = useRef<number | null>(null);
  const [apiReady, setApiReady] = useState(false);
  const [playerReady, setPlayerReady] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);
  
  // Load YouTube IFrame API
  useEffect(() => {
    // Check if API script is already loaded
    if (!document.getElementById('youtube-iframe-api')) {
      // Create script element
      const tag = document.createElement('script');
      tag.id = 'youtube-iframe-api';
      tag.src = 'https://www.youtube.com/iframe_api';
      
      // Insert script before first script tag
      const firstScript = document.getElementsByTagName('script')[0];
      firstScript.parentNode?.insertBefore(tag, firstScript);
      
      // Set up callback
      window.onYouTubeIframeAPIReady = () => {
        setApiReady(true);
      };
    } else if (window.YT && window.YT.Player) {
      // API already loaded
      setApiReady(true);
    }
    
    // Clean up interval on unmount
    return () => {
      if (timeUpdateIntervalRef.current) {
        window.clearInterval(timeUpdateIntervalRef.current);
        timeUpdateIntervalRef.current = null;
      }
    };
  }, []);
  
  // Initialize player when API is ready and videoId changes
  useEffect(() => {
    if (!apiReady || !videoId || !playerElementRef.current) return;
    
    // Clean up existing player
    if (playerRef.current) {
      playerRef.current.destroy();
      playerRef.current = null;
    }
    
    // Create new player
    playerRef.current = new window.YT.Player(playerElementRef.current, {
      videoId: videoId,
      playerVars: {
        autoplay: 1,
        modestbranding: 1,
        rel: 0,
        start: Math.floor(initialTime || 0),
      },
      events: {
        onReady: () => {
          setPlayerReady(true);
        },
        onStateChange: (event: any) => {
          // Handle video complete
          if (event.data === window.YT.PlayerState.ENDED) {
            onVideoComplete();
            
            // Auto-play next video if available
            if (hasNext && onNextVideo) {
              setTimeout(() => {
                onNextVideo();
              }, 1500);
            }
          }
        },
      },
    });
    
    // Set up interval to update time
    if (timeUpdateIntervalRef.current) {
      window.clearInterval(timeUpdateIntervalRef.current);
    }
    
    timeUpdateIntervalRef.current = window.setInterval(() => {
      if (playerRef.current?.getCurrentTime) {
        try {
          const currentTime = playerRef.current.getCurrentTime() || 0;
          const videoDuration = playerRef.current.getDuration() || duration;
          const progress: VideoProgress = {
            videoId,
            courseId,
            currentTime,
            duration: videoDuration,
            completed: currentTime >= videoDuration * 0.95, // Mark as complete if watched 95%
            lastWatched: new Date().toISOString(),
          };
          onTimeUpdate(progress);
        } catch (error) {
          console.error('Error updating time:', error);
        }
      }
    }, 5000); // Update progress every 5 seconds
    
  }, [apiReady, videoId, initialTime, duration, courseId, onTimeUpdate, onVideoComplete, hasNext, onNextVideo]);
  
  // Handle full screen changes
  useEffect(() => {
    const handleFullScreenChange = () => {
      setIsFullScreen(Boolean(document.fullscreenElement));
    };
    
    document.addEventListener('fullscreenchange', handleFullScreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullScreenChange);
  }, []);
  
  // Toggle full screen
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
  
  return (
    <div 
      className="w-full overflow-hidden rounded-lg border bg-card shadow-sm"
      ref={containerRef}
    >
      {/* Video title bar */}
      <div className="bg-muted p-3 flex items-center justify-between">
        <h3 className="font-medium text-sm truncate">{title}</h3>
      </div>
      
      {/* Player container */}
      <div className="aspect-video bg-black relative">
        <div ref={playerElementRef} className="absolute inset-0"></div>
        
        {/* Loading overlay */}
        {!playerReady && (
          <div className="absolute inset-0 flex items-center justify-center bg-black">
            <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin"></div>
          </div>
        )}
        
        {/* Navigation buttons overlay */}
        <div className="absolute inset-0 pointer-events-none flex items-center justify-between px-4">
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