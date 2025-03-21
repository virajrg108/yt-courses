import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { Course, VideoProgress, CourseWithProgress, VideoWithProgress, VideoStatus } from "../types";
import { db } from "../lib/db";
import { useToast } from "../hooks/use-toast";

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

const CoursesContext = createContext<CoursesContextType | undefined>(undefined);

export function CoursesProvider({ children }: { children: ReactNode }) {
  const [courses, setCourses] = useState<CourseWithProgress[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadCourses();
  }, []);

  const loadCourses = async () => {
    try {
      setIsLoading(true);
      const storedCourses = await db.getAllCourses();
      const progressData = await db.getAllVideoProgress();
      
      // Calculate course progress
      const coursesWithProgress = storedCourses.map(course => {
        const courseProgress = progressData.filter(p => p.courseId === course.id);
        const completedVideos = courseProgress.filter(p => p.completed).length;
        const percentage = course.videos.length > 0 
          ? Math.round((completedVideos / course.videos.length) * 100) 
          : 0;
          
        // Find current video (first incomplete video)
        let currentVideoId;
        if (percentage < 100) {
          for (const video of course.videos) {
            const videoProgress = courseProgress.find(p => p.videoId === video.id);
            if (!videoProgress || !videoProgress.completed) {
              currentVideoId = video.id;
              break;
            }
          }
        }
        
        return {
          ...course,
          progress: {
            completedVideos,
            totalVideos: course.videos.length,
            percentage,
            currentVideoId
          }
        };
      });
      
      setCourses(coursesWithProgress);
    } catch (error) {
      console.error("Failed to load courses:", error);
      toast({
        title: "Error loading courses",
        description: "Failed to load your courses. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const refreshCourses = async () => {
    await loadCourses();
  };

  const addCourse = async (course: Course): Promise<boolean> => {
    try {
      await db.addCourse(course);
      await refreshCourses();
      toast({
        title: "Course added",
        description: `"${course.title}" has been added to your courses.`
      });
      return true;
    } catch (error) {
      console.error("Failed to add course:", error);
      toast({
        title: "Error adding course",
        description: "Failed to add the course. Please try again.",
        variant: "destructive"
      });
      return false;
    }
  };

  const getCourse = async (id: string): Promise<CourseWithProgress | undefined> => {
    return courses.find(course => course.id === id);
  };

  const getVideo = async (courseId: string, videoId: string): Promise<VideoWithProgress | undefined> => {
    try {
      const course = await getCourse(courseId);
      if (!course) return undefined;
      
      const video = course.videos.find(v => v.id === videoId);
      if (!video) return undefined;
      
      const progress = await db.getVideoProgress(videoId, courseId);
      
      let status = VideoStatus.NOT_STARTED;
      let progressPercentage = 0;
      
      if (progress) {
        if (progress.completed) {
          status = VideoStatus.COMPLETED;
          progressPercentage = 100;
        } else if (progress.currentTime > 0) {
          status = VideoStatus.IN_PROGRESS;
          progressPercentage = Math.round((progress.currentTime / progress.duration) * 100);
        }
        
        return {
          ...video,
          status,
          progress: progressPercentage,
          currentTime: progress.currentTime
        };
      }
      
      return { ...video, status, progress: 0 };
    } catch (error) {
      console.error("Failed to get video:", error);
      toast({
        title: "Error",
        description: "Failed to load video information.",
        variant: "destructive"
      });
      return undefined;
    }
  };

  const getNextVideo = async (courseId: string, currentVideoId: string): Promise<VideoWithProgress | undefined> => {
    const course = await getCourse(courseId);
    if (!course) return undefined;
    
    const currentIndex = course.videos.findIndex(v => v.id === currentVideoId);
    if (currentIndex === -1 || currentIndex === course.videos.length - 1) return undefined;
    
    const nextVideo = course.videos[currentIndex + 1];
    return getVideo(courseId, nextVideo.id);
  };

  const updateVideoProgress = async (progress: VideoProgress): Promise<void> => {
    try {
      await db.updateVideoProgress(progress);
      
      // Update last watched time for course
      const course = await db.getCourse(progress.courseId);
      if (course) {
        await db.updateCourse({
          ...course,
          lastWatched: new Date().toISOString()
        });
      }
      
      await refreshCourses();
    } catch (error) {
      console.error("Failed to update video progress:", error);
    }
  };

  const markVideoCompleted = async (courseId: string, videoId: string): Promise<void> => {
    try {
      const video = await getVideo(courseId, videoId);
      if (!video) return;
      
      const progress: VideoProgress = {
        videoId,
        courseId,
        currentTime: video.duration,
        duration: video.duration,
        completed: true,
        lastWatched: new Date().toISOString()
      };
      
      await db.updateVideoProgress(progress);
      await refreshCourses();
      
      toast({
        title: "Video completed",
        description: "Your progress has been saved."
      });
    } catch (error) {
      console.error("Failed to mark video as completed:", error);
      toast({
        title: "Error",
        description: "Failed to mark video as completed.",
        variant: "destructive"
      });
    }
  };

  return (
    <CoursesContext.Provider
      value={{
        courses,
        isLoading,
        addCourse,
        getCourse,
        getVideo,
        updateVideoProgress,
        markVideoCompleted,
        getNextVideo,
        refreshCourses
      }}
    >
      {children}
    </CoursesContext.Provider>
  );
}

export function useCourses() {
  const context = useContext(CoursesContext);
  if (context === undefined) {
    throw new Error("useCourses must be used within a CoursesProvider");
  }
  return context;
}
