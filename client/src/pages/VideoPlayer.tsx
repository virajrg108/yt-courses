import { useEffect, useState } from 'react';
import { useRoute, useLocation } from 'wouter';
import { ArrowLeft, ListVideo, Loader2 } from 'lucide-react';
import Header from '../components/Header';
import { useCourses } from '../contexts/CoursesContext';
import YouTubePlayer from '../components/YouTubePlayer';
import VideoItem from '../components/VideoItem';
import { VideoWithProgress } from '../types';

export default function VideoPlayer() {
  const [match, params] = useRoute('/course/:courseId/video/:videoId');
  const [location, setLocation] = useLocation();
  const { getVideo, updateVideoProgress, markVideoCompleted, getNextVideo } = useCourses();
  
  const [isLoading, setIsLoading] = useState(true);
  const [currentVideo, setCurrentVideo] = useState<VideoWithProgress | null>(null);
  const [courseVideos, setCourseVideos] = useState<VideoWithProgress[]>([]);
  const [nextVideo, setNextVideo] = useState<VideoWithProgress | null>(null);
  const [previousVideo, setPreviousVideo] = useState<VideoWithProgress | null>(null);
  
  const courseId = params?.courseId;
  const videoId = params?.videoId;
  
  // Load the current video, all course videos, and next/previous videos
  useEffect(() => {
    if (!courseId || !videoId) {
      setLocation('/');
      return;
    }
    
    const loadVideoData = async () => {
      setIsLoading(true);
      
      try {
        // Load the current video
        const video = await getVideo(courseId, videoId);
        
        if (!video) {
          setLocation(`/course/${courseId}`);
          return;
        }
        
        setCurrentVideo(video);
        
        // Load the course and all its videos
        const course = await useCourses().getCourse(courseId);
        
        if (!course) {
          setLocation('/');
          return;
        }
        
        // Load all videos with their progress
        const videoPromises = course.videos.map(v => 
          getVideo(courseId, v.id)
        );
        
        const loadedVideos = await Promise.all(videoPromises);
        const filteredVideos = loadedVideos.filter(Boolean) as VideoWithProgress[];
        setCourseVideos(filteredVideos);
        
        // Find current video index
        const currentIndex = filteredVideos.findIndex(v => v.id === videoId);
        
        // Determine next and previous videos
        if (currentIndex > 0) {
          setPreviousVideo(filteredVideos[currentIndex - 1]);
        } else {
          setPreviousVideo(null);
        }
        
        if (currentIndex < filteredVideos.length - 1) {
          setNextVideo(filteredVideos[currentIndex + 1]);
        } else {
          setNextVideo(null);
        }
      } catch (error) {
        console.error('Error loading video data:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadVideoData();
  }, [courseId, videoId, getVideo, setLocation]);
  
  // Handler for video progress updates
  const handleTimeUpdate = (progress: any) => {
    updateVideoProgress(progress);
  };
  
  // Handler for video completion
  const handleVideoComplete = () => {
    if (courseId && videoId) {
      markVideoCompleted(courseId, videoId);
    }
  };
  
  // Handler for navigating to next video
  const handleNextVideo = () => {
    if (nextVideo) {
      setLocation(`/course/${courseId}/video/${nextVideo.id}`);
    }
  };
  
  // Handler for navigating to previous video
  const handlePreviousVideo = () => {
    if (previousVideo) {
      setLocation(`/course/${courseId}/video/${previousVideo.id}`);
    }
  };
  
  // Handler for clicking on a video in the list
  const handleVideoClick = (clickedVideoId: string) => {
    setLocation(`/course/${courseId}/video/${clickedVideoId}`);
  };
  
  if (isLoading || !currentVideo) {
    return (
      <div className="flex min-h-screen flex-col">
        <Header />
        <main className="flex-1 container py-6 flex items-center justify-center">
          <Loader2 className="h-8 w-8 text-primary animate-spin" />
        </main>
      </div>
    );
  }
  
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      
      <main className="flex-1 container py-4 md:py-6 px-2 md:px-4">
        {/* Back to course link */}
        <button 
          className="inline-flex items-center text-muted-foreground hover:text-foreground transition-colors mb-4 md:mb-6"
          onClick={() => setLocation(`/course/${courseId}`)}
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to course
        </button>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
          {/* Video player - takes up full width on mobile and 2/3 on large screens */}
          <div className="lg:col-span-2 w-full">
            {courseId && currentVideo && (
              <YouTubePlayer 
                videoId={currentVideo.id}
                courseId={courseId as string}
                title={currentVideo.title}
                initialTime={currentVideo.currentTime}
                duration={currentVideo.duration}
                onTimeUpdate={handleTimeUpdate}
                onVideoComplete={handleVideoComplete}
                onNextVideo={handleNextVideo}
                onPreviousVideo={handlePreviousVideo}
                hasNext={!!nextVideo}
                hasPrevious={!!previousVideo}
              />
            )}
          </div>
          
          {/* Video list - takes up full width on mobile and 1/3 on large screens */}
          <div className="border rounded-lg overflow-hidden h-[calc(100vh-220px)] md:h-[calc(100vh-200px)] flex flex-col">
            <div className="bg-muted p-3 font-medium border-b flex items-center">
              <ListVideo className="h-4 w-4 mr-2" />
              Course Videos
            </div>
            <div className="overflow-y-auto flex-1">
              <div className="divide-y">
                {courseVideos.map(video => (
                  <VideoItem
                    key={video.id}
                    video={video}
                    isActive={video.id === currentVideo.id}
                    onClick={handleVideoClick}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}