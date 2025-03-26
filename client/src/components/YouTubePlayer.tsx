import { useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, Check } from 'lucide-react';
import { VideoProgress } from '../types';
import ReactPlayer from 'react-player';
import { db } from '@/lib/db';

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

  // Use a direct link to YouTube using the nocookie domain
  const embedUrl = `https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&start=${Math.floor(initialTime || 0)}&rel=0&modestbranding=1`;

  // Track elapsed time for progress updates
  // const lastTimeRef = useRef<number>(initialTime || 0);
  // const progressIntervalRef = useRef<number | null>(null);

  // Set up progress tracking only once
  useEffect(() => {

  }, [videoId, courseId, initialTime, duration, onTimeUpdate, onVideoComplete]);

  // Handle loading state
  const handleIframeLoad = () => {
    setIsLoading(false);
  };

  const handleTimeUpdate = async (progress: VideoProgress) => {
    try {
      await db.updateVideoProgress(progress);

      // Update course lastWatched timestamp
      const course = await db.getCourse(progress.courseId);
      if (course) {
        const updatedCourse = {
          ...course,
          lastWatched: new Date().toISOString()
        };
        await db.updateCourse(updatedCourse);
      }

      // Refresh courses to update UI
      // await refreshCourses();
    } catch (error) {
      console.error('Error updating video progress:', error);
    }
  };

  // Handle video marking as complete
  const handleMarkComplete = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onVideoComplete();
  };

  // Handle previous video
  const handlePreviousVideo = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (onPreviousVideo) {
      onPreviousVideo();
    }
  };

  // Handle next video
  const handleNextVideo = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (onNextVideo) {
      onNextVideo();
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

        <ReactPlayer
          className="absolute inset-0 w-full h-full z-40"
          url={embedUrl}
          width="100%"
          height="100%"
          playing
          controls={true}
          progressInterval={5000}
          onProgress={(progressObj) => handleTimeUpdate({videoId,courseId,currentTime: progressObj.playedSeconds,duration,completed: (progressObj.playedSeconds+5>duration),lastWatched: new Date().toISOString()})}
        />

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
              onClick={handlePreviousVideo}
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
              onClick={handleNextVideo}
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