import React, { useEffect, useState } from 'react';
import { useRoute, useLocation } from 'wouter';
import { useCourses } from '../contexts/CoursesContext';
import { VideoWithProgress, CourseWithProgress, VideoStatus } from '../types';
import YouTubePlayer from '../components/YouTubePlayer';
import VideoItem from '../components/VideoItem';
import { formatDuration } from '../lib/youtube';
import { ArrowLeft, Calendar, Clock } from 'lucide-react';
import { Skeleton } from '../components/ui/skeleton';
import { Textarea } from '../components/ui/textarea';
import { Button } from '../components/ui/button';

export default function VideoPlayer() {
  const [_, navigate] = useLocation();
  const [, params] = useRoute('/course/:courseId/video/:videoId');
  const { 
    getCourse, 
    getVideo, 
    updateVideoProgress, 
    markVideoCompleted,
    getNextVideo
  } = useCourses();
  
  const [course, setCourse] = useState<CourseWithProgress | undefined>(undefined);
  const [video, setVideo] = useState<VideoWithProgress | undefined>(undefined);
  const [courseVideos, setCourseVideos] = useState<VideoWithProgress[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [notes, setNotes] = useState('');
  
  useEffect(() => {
    if (!params?.courseId || !params?.videoId) {
      navigate('/');
      return;
    }
    
    loadVideoData(params.courseId, params.videoId);
  }, [params?.courseId, params?.videoId]);
  
  const loadVideoData = async (courseId: string, videoId: string) => {
    setIsLoading(true);
    try {
      const courseData = await getCourse(courseId);
      if (!courseData) {
        navigate('/');
        return;
      }
      setCourse(courseData);
      
      const videoData = await getVideo(courseId, videoId);
      if (!videoData) {
        navigate(`/course/${courseId}`);
        return;
      }
      setVideo(videoData);
      
      // Load all videos for the course with progress info
      const videosWithProgress = await Promise.all(
        courseData.videos.map(async (v) => {
          const videoProgress = await getVideo(courseId, v.id);
          return videoProgress || {
            ...v,
            status: VideoStatus.NOT_STARTED,
            progress: 0
          };
        })
      );
      setCourseVideos(videosWithProgress);
      
      // Load saved notes (in a real app, this would come from IndexedDB)
      const savedNotes = localStorage.getItem(`notes-${courseId}-${videoId}`) || '';
      setNotes(savedNotes);
    } catch (error) {
      console.error('Error loading video data:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleBackClick = () => {
    if (params?.courseId) {
      navigate(`/course/${params.courseId}`);
    } else {
      navigate('/');
    }
  };
  
  const handleVideoClick = (videoId: string) => {
    if (params?.courseId) {
      navigate(`/course/${params.courseId}/video/${videoId}`);
    }
  };
  
  const handleTimeUpdate = (progress: any) => {
    updateVideoProgress(progress);
  };
  
  const handleVideoComplete = () => {
    if (params?.courseId && params?.videoId) {
      markVideoCompleted(params.courseId, params.videoId);
    }
  };
  
  const handleSaveNotes = () => {
    if (params?.courseId && params?.videoId) {
      localStorage.setItem(`notes-${params.courseId}-${params.videoId}`, notes);
    }
  };
  
  const handleNextVideo = async () => {
    if (!params?.courseId || !params?.videoId || !course) return;
    
    const nextVideo = await getNextVideo(params.courseId, params.videoId);
    if (nextVideo) {
      navigate(`/course/${params.courseId}/video/${nextVideo.id}`);
    }
  };
  
  const handlePreviousVideo = () => {
    if (!params?.courseId || !params?.videoId || !course || !video) return;
    
    const currentIndex = course.videos.findIndex(v => v.id === params.videoId);
    if (currentIndex > 0) {
      const previousVideo = course.videos[currentIndex - 1];
      navigate(`/course/${params.courseId}/video/${previousVideo.id}`);
    }
  };
  
  // Determine if there are next/previous videos
  const currentIndex = course?.videos.findIndex(v => v.id === params?.videoId) || 0;
  const hasNextVideo = course?.videos && currentIndex < course.videos.length - 1;
  const hasPreviousVideo = currentIndex > 0;
  
  if (isLoading || !course || !video) {
    return (
      <div>
        <div className="flex items-center mb-4">
          <button 
            className="mr-3 text-gray-600 hover:text-primary"
            onClick={handleBackClick}
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <Skeleton className="h-6 w-64 mb-1" />
            <Skeleton className="h-4 w-48" />
          </div>
        </div>
        
        <div className="flex flex-col lg:flex-row gap-6">
          <div className="lg:w-3/4">
            <Skeleton className="w-full aspect-video mb-4" />
            <Skeleton className="h-10 w-full mb-6" />
            
            <div className="bg-white rounded-lg shadow-md p-4 mb-6">
              <Skeleton className="h-6 w-3/4 mb-4" />
              <Skeleton className="h-4 w-full mb-2" />
              <Skeleton className="h-4 w-full mb-2" />
              <Skeleton className="h-4 w-2/3 mb-4" />
              <Skeleton className="h-8 w-1/3 ml-auto" />
            </div>
          </div>
          
          <div className="lg:w-1/4">
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="p-3 border-b bg-gray-50">
                <Skeleton className="h-5 w-32" />
              </div>
              <div className="max-h-[500px] overflow-y-auto">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="p-3 border-b">
                    <div className="flex items-center">
                      <Skeleton className="h-8 w-8 rounded-full mr-2" />
                      <div>
                        <Skeleton className="h-4 w-36 mb-1" />
                        <Skeleton className="h-3 w-16" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  const displayTitle = video.title;
  const courseTitle = course.customTitle || course.title;
  const formattedDate = new Date(video.publishedAt).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
  
  return (
    <div>
      <div className="flex items-center mb-4">
        <button 
          className="mr-3 text-gray-600 hover:text-primary"
          onClick={handleBackClick}
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div>
          <h2 className="text-xl font-medium">{`${video.position + 1}. ${displayTitle}`}</h2>
          <p className="text-gray-600 text-sm">From: {courseTitle}</p>
        </div>
      </div>
      
      <div className="flex flex-col lg:flex-row gap-6">
        <div className="lg:w-3/4">
          {/* YouTube Player */}
          <YouTubePlayer 
            videoId={video.id}
            courseId={course.id}
            title={displayTitle}
            initialTime={video.currentTime || 0}
            duration={video.duration}
            onTimeUpdate={handleTimeUpdate}
            onVideoComplete={handleVideoComplete}
            onNextVideo={hasNextVideo ? handleNextVideo : undefined}
            onPreviousVideo={hasPreviousVideo ? handlePreviousVideo : undefined}
            hasNext={hasNextVideo}
            hasPrevious={hasPreviousVideo}
          />
          
          {/* Video Information */}
          <div className="bg-white rounded-lg shadow-md p-4 mb-6">
            <h3 className="text-xl font-medium mb-2">{`${video.position + 1}. ${displayTitle}`}</h3>
            <div className="flex flex-wrap justify-between items-center mb-4">
              <div className="flex items-center">
                <Calendar className="h-4 w-4 text-gray-600 mr-1" />
                <span className="text-gray-600 text-sm mr-4">Published: {formattedDate}</span>
              </div>
              <div className="flex items-center">
                <Clock className="h-4 w-4 text-gray-600 mr-1" />
                <span className="text-gray-600 text-sm">Duration: {formatDuration(video.duration)}</span>
              </div>
            </div>
            
            <p className="text-gray-700 mb-4 line-clamp-3">
              {video.description || 'No description available.'}
            </p>
          </div>
          
          {/* Video Notes */}
          <div className="bg-white rounded-lg shadow-md p-4">
            <h3 className="text-lg font-medium mb-2">My Notes</h3>
            <Textarea 
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full h-32 resize-none focus:outline-none focus:ring-2 focus:ring-secondary"
              placeholder="Add your notes for this video..."
            />
            <div className="flex justify-end mt-2">
              <Button 
                onClick={handleSaveNotes}
                className="bg-blue-500 hover:bg-blue-600 text-white"
              >
                Save Notes
              </Button>
            </div>
          </div>
        </div>
        
        {/* Up Next / Course Navigation */}
        <div className="lg:w-1/4">
          <div className="bg-white rounded-lg shadow-md overflow-hidden sticky top-20">
            <div className="p-3 border-b bg-gray-50">
              <h3 className="font-medium">Course Videos</h3>
            </div>
            <ul className="divide-y divide-gray-100 max-h-[500px] overflow-y-auto">
              {courseVideos.map(v => (
                <VideoItem 
                  key={v.id}
                  video={v}
                  isActive={v.id === video.id}
                  onClick={handleVideoClick}
                />
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
