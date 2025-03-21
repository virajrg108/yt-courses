import React, { useEffect, useRef, useState } from 'react';
import { getVideoEmbedUrl, formatDuration } from '../lib/youtube';
import { VideoProgress } from '../types';
import { 
  Play, 
  Pause, 
  Volume2, 
  VolumeX, 
  Maximize, 
  ChevronRight, 
  ChevronLeft,
  Check
} from 'lucide-react';
import { Button } from '../components/ui/button';

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

// YouTube Player API interface
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
  hasPrevious = false
}: YouTubePlayerProps) {
  const playerRef = useRef<any>(null);
  const playerContainerRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const progressIntervalRef = useRef<number | null>(null);
  
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(initialTime);
  const [isMuted, setIsMuted] = useState(false);
  const [progressPercentage, setProgressPercentage] = useState(
    initialTime > 0 ? (initialTime / duration) * 100 : 0
  );
  const [isPlayerReady, setIsPlayerReady] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  
  // Load YouTube API
  useEffect(() => {
    // Create script tag for YouTube iframe API
    const tag = document.createElement('script');
    tag.src = 'https://www.youtube.com/iframe_api';
    const firstScriptTag = document.getElementsByTagName('script')[0];
    firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);
    
    // Setup callback for when YouTube API loads
    window.onYouTubeIframeAPIReady = initializePlayer;
    
    return () => {
      // Clean up
      window.onYouTubeIframeAPIReady = () => {};
      if (progressIntervalRef.current) {
        window.clearInterval(progressIntervalRef.current);
      }
      if (playerRef.current) {
        playerRef.current.destroy();
      }
    };
  }, []);
  
  // Initialize player when videoId changes
  useEffect(() => {
    if (window.YT && window.YT.Player) {
      initializePlayer();
    }
    
    // Reset state when video changes
    setCurrentTime(initialTime);
    setProgressPercentage(initialTime > 0 ? (initialTime / duration) * 100 : 0);
    setIsCompleted(false);
  }, [videoId, initialTime]);
  
  // Initialize player
  const initializePlayer = () => {
    if (!iframeRef.current) return;
    
    // Destroy existing player if it exists
    if (playerRef.current) {
      playerRef.current.destroy();
    }
    
    playerRef.current = new window.YT.Player(iframeRef.current, {
      videoId,
      playerVars: {
        start: Math.floor(initialTime),
        rel: 0,
        modestbranding: 1,
        playsinline: 1
      },
      events: {
        onReady: onPlayerReady,
        onStateChange: onPlayerStateChange
      }
    });
  };
  
  const onPlayerReady = () => {
    setIsPlayerReady(true);
    
    // Start progress tracking interval
    startProgressTracking();
    
    // Set initial volume state
    setIsMuted(playerRef.current.isMuted());
    
    // If there's initial time, seek to it
    if (initialTime > 0) {
      playerRef.current.seekTo(initialTime, true);
    }
  };
  
  const onPlayerStateChange = (event: any) => {
    const playerState = event.data;
    
    if (playerState === window.YT.PlayerState.PLAYING) {
      setIsPlaying(true);
      startProgressTracking();
    } else if (playerState === window.YT.PlayerState.PAUSED) {
      setIsPlaying(false);
      if (progressIntervalRef.current) {
        window.clearInterval(progressIntervalRef.current);
        progressIntervalRef.current = null;
      }
      // Save current progress when paused
      saveProgress();
    } else if (playerState === window.YT.PlayerState.ENDED) {
      setIsPlaying(false);
      setIsCompleted(true);
      if (progressIntervalRef.current) {
        window.clearInterval(progressIntervalRef.current);
        progressIntervalRef.current = null;
      }
      
      // Mark as completed when video ends
      const progress: VideoProgress = {
        videoId,
        courseId,
        currentTime: duration,
        duration,
        completed: true,
        lastWatched: new Date().toISOString()
      };
      
      onTimeUpdate(progress);
      onVideoComplete();
    }
  };
  
  const startProgressTracking = () => {
    if (progressIntervalRef.current) {
      window.clearInterval(progressIntervalRef.current);
    }
    
    // Update progress every 5 seconds
    progressIntervalRef.current = window.setInterval(() => {
      if (playerRef.current && isPlayerReady) {
        const newCurrentTime = playerRef.current.getCurrentTime();
        setCurrentTime(newCurrentTime);
        const newProgress = (newCurrentTime / duration) * 100;
        setProgressPercentage(newProgress);
        
        // Save progress every 5 seconds
        saveProgress();
      }
    }, 5000);
  };
  
  const saveProgress = () => {
    if (!playerRef.current || !isPlayerReady) return;
    
    const currentPlayerTime = playerRef.current.getCurrentTime();
    const isVideoCompleted = 
      currentPlayerTime >= duration - 10 || // Consider completed if less than 10 seconds left
      currentPlayerTime / duration >= 0.95; // Or if 95% watched
    
    const progress: VideoProgress = {
      videoId,
      courseId,
      currentTime: currentPlayerTime,
      duration,
      completed: isVideoCompleted,
      lastWatched: new Date().toISOString()
    };
    
    onTimeUpdate(progress);
    
    if (isVideoCompleted && !isCompleted) {
      setIsCompleted(true);
      onVideoComplete();
    }
  };
  
  const togglePlayPause = () => {
    if (!playerRef.current || !isPlayerReady) return;
    
    if (isPlaying) {
      playerRef.current.pauseVideo();
    } else {
      playerRef.current.playVideo();
    }
  };
  
  const toggleMute = () => {
    if (!playerRef.current || !isPlayerReady) return;
    
    if (isMuted) {
      playerRef.current.unMute();
      setIsMuted(false);
    } else {
      playerRef.current.mute();
      setIsMuted(true);
    }
  };
  
  const handleFullscreen = () => {
    if (!playerContainerRef.current) return;
    
    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      playerContainerRef.current.requestFullscreen();
    }
  };
  
  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!playerRef.current || !isPlayerReady) return;
    
    const progressBar = e.currentTarget;
    const rect = progressBar.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = x / rect.width;
    const seekTime = percentage * duration;
    
    playerRef.current.seekTo(seekTime, true);
    setCurrentTime(seekTime);
    setProgressPercentage(percentage * 100);
  };
  
  const handleMarkAsComplete = () => {
    const progress: VideoProgress = {
      videoId,
      courseId,
      currentTime: duration,
      duration,
      completed: true,
      lastWatched: new Date().toISOString()
    };
    
    onTimeUpdate(progress);
    setIsCompleted(true);
    onVideoComplete();
  };
  
  return (
    <div className="w-full">
      {/* Video player container */}
      <div 
        ref={playerContainerRef}
        className="bg-dark rounded-lg shadow-lg overflow-hidden mb-4 relative"
      >
        <div className="relative aspect-video">
          <iframe
            ref={iframeRef}
            className="absolute top-0 left-0 w-full h-full"
            title={title}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          ></iframe>
          
          {/* Custom video controls overlay */}
          <div className="absolute bottom-0 left-0 w-full bg-black bg-opacity-60 p-2 flex flex-col z-10">
            <div className="flex items-center mb-1">
              <button 
                className="text-white mr-4" 
                onClick={togglePlayPause}
                aria-label={isPlaying ? "Pause" : "Play"}
              >
                {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
              </button>
              
              <div 
                className="flex-grow relative h-6 flex items-center cursor-pointer" 
                onClick={handleSeek}
              >
                <div className="h-1 bg-gray-600 rounded-full w-full">
                  <div 
                    className="absolute top-[10px] left-0 h-1 bg-primary rounded-full" 
                    style={{ width: `${progressPercentage}%` }}
                  ></div>
                </div>
              </div>
              
              <div className="text-white text-sm ml-4">
                {formatDuration(Math.floor(currentTime))} / {formatDuration(duration)}
              </div>
            </div>
            
            <div className="flex justify-between text-white text-sm">
              <div className="flex">
                <button 
                  className="mr-4" 
                  onClick={toggleMute} 
                  aria-label={isMuted ? "Unmute" : "Mute"}
                >
                  {isMuted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
                </button>
                
                {/* Video navigation */}
                <div className="flex items-center space-x-2">
                  <button
                    onClick={onPreviousVideo}
                    disabled={!hasPrevious}
                    className={`${!hasPrevious ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                    aria-label="Previous video"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </button>
                  
                  <button
                    onClick={onNextVideo}
                    disabled={!hasNext}
                    className={`${!hasNext ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                    aria-label="Next video"
                  >
                    <ChevronRight className="h-5 w-5" />
                  </button>
                </div>
              </div>
              
              <div>
                <button 
                  className="ml-4" 
                  onClick={handleFullscreen} 
                  aria-label="Fullscreen"
                >
                  <Maximize className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Mark as complete button */}
      <div className="flex justify-end mb-4">
        <Button
          onClick={handleMarkAsComplete}
          disabled={isCompleted}
          variant={isCompleted ? "secondary" : "default"}
          className={`${isCompleted ? 'bg-green-500 hover:bg-green-500' : 'bg-green-500 hover:bg-green-600'} text-white rounded-full`}
        >
          <Check className="h-4 w-4 mr-1" />
          {isCompleted ? "Completed" : "Mark as Complete"}
        </Button>
      </div>
    </div>
  );
}
