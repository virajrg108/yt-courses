import { ReactNode, createContext, useContext, useEffect, useState } from 'react';
import { Course, CourseWithProgress, VideoProgress, VideoStatus, VideoWithProgress } from '../types';
import { db } from '../lib/db';

interface CoursesContextType {
  courses: CourseWithProgress[];
  isLoading: boolean;
  addCourse: (course: Course) => Promise<boolean>;
  getCourse: (id: string) => Promise<CourseWithProgress | undefined>;
  getVideo: (courseId: string, videoId: string) => Promise<VideoWithProgress | undefined>;
  updateVideoProgress: (progress: VideoProgress) => Promise<void>;
  markVideoCompleted: (courseId: string, videoId: string) => Promise<void>;
  getNextVideo: (courseId: string, currentVideoId: string) => Promise<VideoWithProgress | undefined>;
  refreshCourses: () => Promise<void>;
}

const CoursesContext = createContext<CoursesContextType | null>(null);

export function CoursesProvider({ children }: { children: ReactNode }) {
  const [courses, setCourses] = useState<CourseWithProgress[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load courses on initial mount
  useEffect(() => {
    loadCourses();
  }, []);

  const loadCourses = async () => {
    try {
      setIsLoading(true);
      await refreshCourses();
    } catch (error) {
      console.error('Error loading courses:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const refreshCourses = async () => {
    const allCourses = await db.getAllCourses();
    const allProgress = await db.getAllVideoProgress();
    
    // Map to track video progress by course
    const courseProgressMap = new Map<string, VideoProgress[]>();
    
    // Group video progress by course ID
    allProgress.forEach(progress => {
      if (!courseProgressMap.has(progress.courseId)) {
        courseProgressMap.set(progress.courseId, []);
      }
      courseProgressMap.get(progress.courseId)?.push(progress);
    });
    
    // Calculate course progress stats
    const coursesWithProgress: CourseWithProgress[] = allCourses.map(course => {
      const courseProgress = courseProgressMap.get(course.id) || [];
      const totalVideos = course.videos.length;
      const completedVideos = courseProgress.filter(p => p.completed).length;
      const percentage = totalVideos > 0 ? Math.round((completedVideos / totalVideos) * 100) : 0;
      
      // Find most recently watched video
      let currentVideoId: string | undefined = undefined;
      if (courseProgress.length > 0) {
        // Sort by last watched timestamp, most recent first
        const sortedProgress = [...courseProgress].sort((a, b) => 
          new Date(b.lastWatched).getTime() - new Date(a.lastWatched).getTime()
        );
        currentVideoId = sortedProgress[0].videoId;
      }
      
      return {
        ...course,
        progress: {
          completedVideos,
          totalVideos,
          percentage,
          currentVideoId
        }
      };
    });
    
    // Sort courses by last watched (most recent first)
    const sortedCourses = [...coursesWithProgress].sort((a, b) => {
      if (!a.lastWatched && !b.lastWatched) return 0;
      if (!a.lastWatched) return 1;
      if (!b.lastWatched) return -1;
      return new Date(b.lastWatched).getTime() - new Date(a.lastWatched).getTime();
    });
    
    setCourses(sortedCourses);
  };

  // Add a new course
  const addCourse = async (course: Course): Promise<boolean> => {
    try {
      // Check if course already exists
      const existingCourse = await db.getCourse(course.id);
      if (existingCourse) {
        return false; // Course already exists
      }
      
      // Add the course to the database
      await db.addCourse(course);
      
      // Refresh courses list
      await refreshCourses();
      
      return true;
    } catch (error) {
      console.error('Error adding course:', error);
      return false;
    }
  };

  // Get a course with progress information
  const getCourse = async (id: string): Promise<CourseWithProgress | undefined> => {
    const course = courses.find(c => c.id === id);
    if (course) return course;
    
    // If not in state, try to get from database and calculate progress
    const dbCourse = await db.getCourse(id);
    if (!dbCourse) return undefined;
    
    const courseProgress = await db.getVideoProgressByCourse(id);
    const totalVideos = dbCourse.videos.length;
    const completedVideos = courseProgress.filter(p => p.completed).length;
    const percentage = totalVideos > 0 ? Math.round((completedVideos / totalVideos) * 100) : 0;
    
    let currentVideoId: string | undefined = undefined;
    if (courseProgress.length > 0) {
      const sortedProgress = [...courseProgress].sort((a, b) => 
        new Date(b.lastWatched).getTime() - new Date(a.lastWatched).getTime()
      );
      currentVideoId = sortedProgress[0].videoId;
    }
    
    return {
      ...dbCourse,
      progress: {
        completedVideos,
        totalVideos,
        percentage,
        currentVideoId
      }
    };
  };

  // Get a video with its progress information
  const getVideo = async (courseId: string, videoId: string): Promise<VideoWithProgress | undefined> => {
    const course = await getCourse(courseId);
    if (!course) return undefined;
    
    const video = course.videos.find(v => v.id === videoId);
    if (!video) return undefined;
    
    const progress = await db.getVideoProgress(videoId, courseId);
    
    let status = VideoStatus.NOT_STARTED;
    let currentTime: number | undefined = undefined;
    let progressPercentage: number | undefined = undefined;
    
    if (progress) {
      if (progress.completed) {
        status = VideoStatus.COMPLETED;
        progressPercentage = 100;
      } else if (progress.currentTime > 0) {
        status = VideoStatus.IN_PROGRESS;
        currentTime = progress.currentTime;
        progressPercentage = Math.round((progress.currentTime / progress.duration) * 100);
      }
    }
    
    return {
      ...video,
      status,
      progress: progressPercentage,
      currentTime
    };
  };

  // Update video progress
  const updateVideoProgress = async (progress: VideoProgress): Promise<void> => {
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
      await refreshCourses();
    } catch (error) {
      console.error('Error updating video progress:', error);
    }
  };

  // Mark a video as completed
  const markVideoCompleted = async (courseId: string, videoId: string): Promise<void> => {
    try {
      const videoProgress = await db.getVideoProgress(videoId, courseId);
      const video = courses
        .find(c => c.id === courseId)
        ?.videos.find(v => v.id === videoId);
      
      if (!video) return;
      
      const progress: VideoProgress = {
        videoId,
        courseId,
        currentTime: video.duration,
        duration: video.duration,
        completed: true,
        lastWatched: new Date().toISOString()
      };
      
      await updateVideoProgress(progress);
    } catch (error) {
      console.error('Error marking video as completed:', error);
    }
  };

  // Get the next video in a course
  const getNextVideo = async (courseId: string, currentVideoId: string): Promise<VideoWithProgress | undefined> => {
    const course = await getCourse(courseId);
    if (!course) return undefined;
    
    // Find the current video
    const currentIndex = course.videos.findIndex(v => v.id === currentVideoId);
    if (currentIndex === -1 || currentIndex === course.videos.length - 1) {
      return undefined; // Current video not found or already at the last video
    }
    
    // Get the next video
    const nextVideo = course.videos[currentIndex + 1];
    return getVideo(courseId, nextVideo.id);
  };

  const contextValue: CoursesContextType = {
    courses,
    isLoading,
    addCourse,
    getCourse,
    getVideo,
    updateVideoProgress,
    markVideoCompleted,
    getNextVideo,
    refreshCourses
  };

  return (
    <CoursesContext.Provider value={contextValue}>
      {children}
    </CoursesContext.Provider>
  );
}

export function useCourses() {
  const context = useContext(CoursesContext);
  if (!context) {
    throw new Error('useCourses must be used within CoursesProvider');
  }
  return context;
}