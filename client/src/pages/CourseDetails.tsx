import { useEffect, useState } from 'react';
import { useRoute, useLocation } from 'wouter';
import { BookOpen, CheckCircle, Clock, ListVideo, ArrowLeft, Loader2 } from 'lucide-react';
import Header from '../components/Header';
import { useCourses } from '../contexts/CoursesContext';
import VideoItem from '../components/VideoItem';
import { formatDuration, timeAgo } from '../lib/youtube';
import { VideoWithProgress } from '../types';

export default function CourseDetails() {
  const [match, params] = useRoute('/course/:id');
  const [location, setLocation] = useLocation();
  const { getCourse, getVideo } = useCourses();
  const [isLoading, setIsLoading] = useState(true);
  const [videos, setVideos] = useState<VideoWithProgress[]>([]);
  
  const courseId = params?.id;
  
  useEffect(() => {
    if (!courseId) {
      setLocation('/');
      return;
    }
    
    const loadCourse = async () => {
      setIsLoading(true);
      
      try {
        const course = await getCourse(courseId);
        
        if (!course) {
          setLocation('/');
          return;
        }
        
        // Load all videos with their progress
        const videoPromises = course.videos.map(video => 
          getVideo(courseId, video.id)
        );
        
        const loadedVideos = await Promise.all(videoPromises);
        setVideos(loadedVideos.filter(Boolean) as VideoWithProgress[]);
      } catch (error) {
        console.error('Error loading course:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadCourse();
  }, [courseId, getCourse, getVideo, setLocation]);
  
  const handleVideoClick = (videoId: string) => {
    setLocation(`/course/${courseId}/video/${videoId}`);
  };
  
  // Find the current video (most recently watched or first in list)
  const findCurrentVideo = (): VideoWithProgress | undefined => {
    // First try videos in progress
    const inProgressVideo = videos.find(v => v.currentTime && v.currentTime > 0 && !v.status);
    if (inProgressVideo) return inProgressVideo;
    
    // Then try first non-completed video
    const firstNonCompletedVideo = videos.find(v => !v.status);
    if (firstNonCompletedVideo) return firstNonCompletedVideo;
    
    // Default to first video
    return videos[0];
  };
  
  // When clicking continue, go to current video
  const handleContinue = () => {
    const currentVideo = findCurrentVideo();
    if (currentVideo) {
      handleVideoClick(currentVideo.id);
    }
  };
  
  // Calculate course stats
  const getTotalDuration = () => {
    return videos.reduce((total, video) => total + video.duration, 0);
  };
  
  if (isLoading) {
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
      
      <main className="flex-1 container py-6">
        {/* Course header */}
        <div className="flex items-start gap-4 md:gap-6 flex-col md:flex-row mb-8">
          {/* Back button */}
          <button 
            className="inline-flex items-center text-muted-foreground hover:text-foreground transition-colors mb-4 md:mb-0"
            onClick={() => setLocation('/')}
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to courses
          </button>
          
          {/* Course info */}
          <div className="flex-1 min-w-0">
            <h1 className="text-3xl font-bold">{videos[0]?.title.split('|')[0] || 'Course'}</h1>
            
            {/* Course stats */}
            <div className="flex flex-wrap gap-x-6 gap-y-2 mt-4 text-sm">
              <div className="flex items-center">
                <ListVideo className="h-4 w-4 mr-1.5 text-muted-foreground" />
                {videos.length} videos
              </div>
              <div className="flex items-center">
                <Clock className="h-4 w-4 mr-1.5 text-muted-foreground" />
                {formatDuration(getTotalDuration())} total duration
              </div>
              <div className="flex items-center">
                <CheckCircle className="h-4 w-4 mr-1.5 text-muted-foreground" />
                {videos.filter(v => v.status === 'completed').length} completed
              </div>
            </div>
            
            {/* Button to continue watching */}
            <button 
              className="mt-6 rounded-md bg-primary px-5 py-2.5 text-sm font-medium text-white hover:bg-primary/90 transition-colors inline-flex items-center gap-2"
              onClick={handleContinue}
            >
              <BookOpen className="h-4 w-4" />
              Continue Learning
            </button>
          </div>
        </div>
        
        {/* Video list */}
        <div className="border rounded-lg overflow-hidden">
          <div className="bg-muted p-3 font-medium border-b">
            Course Videos
          </div>
          <div className="divide-y">
            {videos.map((video, index) => (
              <VideoItem
                key={`${video.id}-${index}`}
                video={video}
                onClick={handleVideoClick}
              />
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}