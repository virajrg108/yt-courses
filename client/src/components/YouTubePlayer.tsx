import { useCallback, useEffect, useRef, useState } from 'react';
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

let PLAYER_CONTAINER_ID = 'youtube-player-container';

// Use a stable iframe that avoids re-creation during React re-renders
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
  const videoIdRef = useRef(videoId);
  const initialTimeRef = useRef(initialTime);
  const saveIntervalRef = useRef<number | undefined>();
  const progressRef = useRef<VideoProgress>({
    videoId,
    courseId,
    currentTime: initialTime || 0,
    duration,
    completed: false,
    lastWatched: new Date().toISOString(),
  });
  
  // Only used to track current values for callbacks
  useEffect(() => {
    videoIdRef.current = videoId;
    initialTimeRef.current = initialTime || 0;
    progressRef.current = {
      ...progressRef.current,
      videoId,
      courseId,
      currentTime: initialTime || 0,
      duration,
    };
  }, [videoId, initialTime, courseId, duration]);
  
  // Create the player component only once on mount
  const createPlayer = useCallback(() => {
    // Ensure we don't have multiple intervals running
    if (saveIntervalRef.current) {
      window.clearInterval(saveIntervalRef.current);
    }
    
    // Reset loading state
    setIsLoading(true);
    setHasError(false);
    
    // Create the YouTube iframe embed
    try {
      // Create a static embed URL with query parameters
      const embedUrl = `https://www.youtube.com/embed/${videoIdRef.current}?autoplay=1&start=${Math.floor(initialTimeRef.current || 0)}&enablejsapi=1&rel=0&modestbranding=1`;
      
      // Get the container element or create it if it doesn't exist
      let container = document.getElementById(PLAYER_CONTAINER_ID);
      
      if (!container && containerRef.current) {
        // If we need to create the container div
        const playerContainer = document.getElementById('player-container');
        if (playerContainer) {
          // Clear existing content
          playerContainer.innerHTML = '';
          
          // Create the stable container
          container = document.createElement('div');
          container.id = PLAYER_CONTAINER_ID;
          container.style.width = '100%';
          container.style.height = '100%';
          
          // Append to the player container
          playerContainer.appendChild(container);
        }
      }
      
      if (container) {
        // Create the iframe element
        const iframe = document.createElement('iframe');
        iframe.width = '100%';
        iframe.height = '100%';
        iframe.src = embedUrl;
        iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share';
        iframe.allowFullscreen = true;
        iframe.style.border = 'none';
        iframe.onload = () => {
          setIsLoading(false);
        };
        
        // Clear existing content and add the iframe
        container.innerHTML = '';
        container.appendChild(iframe);
        
        // Start a timer to save progress periodically
        saveIntervalRef.current = window.setInterval(() => {
          // Update the progress time by adding 5 seconds
          progressRef.current.currentTime += 5;
          
          // Check if video is complete (95% watched)
          progressRef.current.completed = progressRef.current.currentTime >= duration * 0.95;
          
          // Update the last watched timestamp
          progressRef.current.lastWatched = new Date().toISOString();
          
          // Save the progress
          onTimeUpdate(progressRef.current);
        }, 5000);
      }
    } catch (error) {
      console.error('Error creating YouTube player:', error);
      setHasError(true);
      setIsLoading(false);
    }
  }, [onTimeUpdate, duration]);
  
  // Apply the video ID change - this avoids recreating the component
  const updatePlayer = useCallback(() => {
    try {
      // Get the container 
      const container = document.getElementById(PLAYER_CONTAINER_ID);
      
      if (container) {
        // Create a new iframe with the updated video ID and time
        const iframe = document.createElement('iframe');
        iframe.width = '100%';
        iframe.height = '100%';
        iframe.src = `https://www.youtube.com/embed/${videoIdRef.current}?autoplay=1&start=${Math.floor(initialTimeRef.current || 0)}&enablejsapi=1&rel=0&modestbranding=1`;
        iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share';
        iframe.allowFullscreen = true;
        iframe.style.border = 'none';
        iframe.onload = () => {
          setIsLoading(false);
        };
        
        // Reset loading state
        setIsLoading(true);
        
        // Clear and update the container
        container.innerHTML = '';
        container.appendChild(iframe);
      }
    } catch (error) {
      console.error('Error updating YouTube player:', error);
      setHasError(true);
    }
  }, []);
  
  // Initialize the player on mount
  useEffect(() => {
    createPlayer();
    
    // Cleanup function to clear the interval
    return () => {
      if (saveIntervalRef.current) {
        window.clearInterval(saveIntervalRef.current);
        saveIntervalRef.current = undefined;
      }
    };
  }, [createPlayer]);
  
  // Handle video ID changes
  useEffect(() => {
    // If the video ID has changed, update the player
    if (videoIdRef.current !== videoId) {
      videoIdRef.current = videoId;
      initialTimeRef.current = initialTime || 0;
      updatePlayer();
    }
  }, [videoId, initialTime, updatePlayer]);
  
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