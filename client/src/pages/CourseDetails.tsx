import React, { useEffect, useState } from 'react';
import { useRoute, useLocation } from 'wouter';
import { useCourses } from '../contexts/CoursesContext';
import { VideoWithProgress, CourseWithProgress, VideoStatus } from '../types';
import VideoItem from '../components/VideoItem';
import ProgressCircle from '../components/ProgressCircle';
import { formatDuration } from '../lib/youtube';
import { ArrowLeft, User, ListVideo, CheckCircle, PlayCircle, Circle } from 'lucide-react';
import { Skeleton } from '../components/ui/skeleton';

export default function CourseDetails() {
  const [_, navigate] = useLocation();
  const [, params] = useRoute('/course/:id');
  const { getCourse, getVideo } = useCourses();
  
  const [course, setCourse] = useState<CourseWithProgress | undefined>(undefined);
  const [videos, setVideos] = useState<VideoWithProgress[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    if (!params?.id) {
      navigate('/');
      return;
    }
    
    loadCourseDetails(params.id);
  }, [params?.id]);
  
  const loadCourseDetails = async (courseId: string) => {
    setIsLoading(true);
    try {
      const courseData = await getCourse(courseId);
      if (!courseData) {
        navigate('/');
        return;
      }
      
      setCourse(courseData);
      
      // Load video progress data for each video
      const videosWithProgress: VideoWithProgress[] = await Promise.all(
        courseData.videos.map(async (video) => {
          const videoProgress = await getVideo(courseId, video.id);
          return videoProgress || {
            ...video,
            status: VideoStatus.NOT_STARTED,
            progress: 0
          };
        })
      );
      
      setVideos(videosWithProgress);
    } catch (error) {
      console.error('Error loading course details:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleBackClick = () => {
    navigate('/');
  };
  
  const handleVideoClick = (videoId: string) => {
    navigate(`/course/${params?.id}/video/${videoId}`);
  };
  
  if (isLoading || !course) {
    return (
      <div>
        <div className="flex items-center mb-6">
          <button 
            className="mr-3 text-gray-600 hover:text-primary"
            onClick={handleBackClick}
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <Skeleton className="h-8 w-64" />
        </div>
        
        <div className="flex flex-col lg:flex-row">
          <div className="lg:w-1/3 mb-6 lg:mb-0 lg:pr-6">
            <div className="bg-white rounded-lg shadow-md overflow-hidden mb-6">
              <Skeleton className="h-48 w-full" />
              <div className="p-4">
                <Skeleton className="h-6 w-3/4 mb-2" />
                <Skeleton className="h-4 w-full mb-4" />
                <Skeleton className="h-4 w-full mb-4" />
                <Skeleton className="h-4 w-2/3 mb-4" />
                <Skeleton className="h-6 w-full mb-2" />
              </div>
            </div>
          </div>
          
          <div className="lg:w-2/3 bg-white rounded-lg shadow-md overflow-hidden">
            <div className="p-4 border-b">
              <Skeleton className="h-6 w-32" />
            </div>
            <div className="p-2">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="p-2">
                  <div className="flex items-center">
                    <Skeleton className="h-10 w-10 rounded-full mr-3" />
                    <div className="flex-grow">
                      <Skeleton className="h-5 w-2/3 mb-2" />
                      <Skeleton className="h-3 w-1/4" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  const displayTitle = course.customTitle || course.title;
  const completedVideos = videos.filter(v => v.status === VideoStatus.COMPLETED).length;
  const inProgressVideos = videos.filter(v => v.status === VideoStatus.IN_PROGRESS).length;
  const notStartedVideos = videos.filter(v => v.status === VideoStatus.NOT_STARTED).length;
  
  return (
    <div>
      <div className="flex items-center mb-6">
        <button 
          className="mr-3 text-gray-600 hover:text-primary"
          onClick={handleBackClick}
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h2 className="text-2xl font-medium">{displayTitle}</h2>
      </div>
      
      <div className="flex flex-col lg:flex-row">
        <div className="lg:w-1/3 mb-6 lg:mb-0 lg:pr-6">
          <div className="bg-white rounded-lg shadow-md overflow-hidden mb-6">
            <img 
              src={course.thumbnail} 
              alt={displayTitle} 
              className="w-full h-48 object-cover"
            />
            <div className="p-4">
              <h3 className="font-medium text-xl mb-2">{displayTitle}</h3>
              <p className="text-gray-600 mb-4 line-clamp-3">{course.description}</p>
              
              <div className="flex justify-between mb-3">
                <div className="flex items-center">
                  <User className="h-4 w-4 text-gray-600 mr-1" />
                  <span className="text-gray-600">{course.channelTitle}</span>
                </div>
                <div className="flex items-center">
                  <ListVideo className="h-4 w-4 text-gray-600 mr-1" />
                  <span className="text-gray-600">{course.videos.length} videos</span>
                </div>
              </div>
              
              <div className="mb-2">
                <div className="flex justify-between mb-1">
                  <span className="text-sm font-medium">Course Progress</span>
                  <span className="text-sm font-medium">{course.progress.percentage}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-green-500 h-2 rounded-full" 
                    style={{ width: `${course.progress.percentage}%` }}
                  ></div>
                </div>
              </div>
              
              <div className="flex flex-wrap gap-2 mt-4">
                <div className="flex items-center bg-gray-100 rounded-full px-3 py-1 text-sm">
                  <CheckCircle className="h-3 w-3 mr-1 text-green-500" />
                  <span>{completedVideos} completed</span>
                </div>
                <div className="flex items-center bg-gray-100 rounded-full px-3 py-1 text-sm">
                  <PlayCircle className="h-3 w-3 mr-1 text-amber-500" />
                  <span>{inProgressVideos} in progress</span>
                </div>
                <div className="flex items-center bg-gray-100 rounded-full px-3 py-1 text-sm">
                  <Circle className="h-3 w-3 mr-1 text-gray-400" />
                  <span>{notStartedVideos} not started</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="lg:w-2/3 bg-white rounded-lg shadow-md overflow-hidden">
          <div className="p-4 border-b">
            <h3 className="font-medium text-lg">Video Lessons</h3>
          </div>
          <div className="overflow-y-auto max-h-[600px]">
            <ul className="divide-y divide-gray-100">
              {videos.map(video => (
                <VideoItem 
                  key={video.id}
                  video={video}
                  isActive={video.id === course.progress.currentVideoId}
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
