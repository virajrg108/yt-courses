import { useEffect, useState } from 'react';
import { useRoute, useLocation } from 'wouter';
import { ArrowLeft, ListVideo, Loader2 } from 'lucide-react';
import Header from '../components/Header';
import { useCourses } from '../contexts/CoursesContext';
import YouTubePlayer from '../components/YouTubePlayer';
import VideoItem from '../components/VideoItem';
import { VideoWithProgress, VideoProgress, VideoStatus } from '../types';
import { db } from '@/lib/db';

export default function VideoPlayer() {
  const [match, params] = useRoute('/course/:courseId/video/:videoId');
  const [location, setLocation] = useLocation();
  const coursesContext = useCourses();
  const { getVideo, updateVideoProgress, markVideoCompleted, getNextVideo, getCourse, refreshCourses } = coursesContext;

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

    let isMounted = true;

    const loadVideoData = async () => {
      if (!isMounted) return;
      setIsLoading(true);

      try {
        // First, quickly fetch just the current video to show it faster
        const video = await getVideo(courseId, videoId);

        if (!isMounted) return;

        if (!video) {
          setLocation(`/course/${courseId}`);
          return;
        }

        // Set the current video immediately so playback can start
        setCurrentVideo(video);

        // In the background, load the course and all its videos
        const course = await getCourse(courseId);

        if (!isMounted) return;

        if (!course) {
          setLocation('/');
          return;
        }

        // Create a set of promises to load all videos with their progress
        // but don't await them yet
        const videoPromises = course.videos.map(v =>
          getVideo(courseId, v.id)
        );

        // Load videos in the background
        Promise.all(videoPromises).then((loadedVideos) => {
          if (!isMounted) return;

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
        }).catch(error => {
          console.error('Error loading course videos:', error);
        });

        // We can mark loading as false once we have the current video
        setIsLoading(false);
      } catch (error) {
        if (!isMounted) return;
        console.error('Error loading video data:', error);
        setIsLoading(false);
      }
    };

    loadVideoData();

    return () => {
      isMounted = false;
    };
  }, [courseId, videoId, getVideo, getCourse, setLocation]);

  // Handler for video progress updates
  const handleTimeUpdate = async (progress: VideoProgress) => {
    if (!progress || !progress.videoId || !progress.courseId) return;

    // Don't trigger UI updates, just save in the background
    console.log(progress, "handleTimeUpdate called.");
    console.log("updateVicdeoProgress called");
    // try {
    //   await db.updateVideoProgress(progress);

    //   // Update course lastWatched timestamp
    //   const course = await db.getCourse(progress.courseId);
    //   if (course) {
    //     const updatedCourse = {
    //       ...course,
    //       lastWatched: new Date().toISOString()
    //     };
    //     await db.updateCourse(updatedCourse);
    //   }

    //   // Refresh courses to update UI
    //   await refreshCourses();
    // } catch (error) {
    //   console.error('Error updating video progress:', error);
    // }

    // Silently update the current video's progress if it matches
    if (currentVideo && progress.videoId === currentVideo.id) {
      setCurrentVideo(prev => {
        if (!prev) return prev;

        return {
          ...prev,
          currentTime: progress.currentTime,
          progress: Math.round((progress.currentTime / progress.duration) * 100),
        };
      });
    }
  };

  // Handler for video completion
  const handleVideoComplete = async () => {
    if (!courseId || !videoId) return;

    try {
      await markVideoCompleted(courseId, videoId);

      // Only update the current video status to completed without full refresh
      if (currentVideo) {
        // Create an updated version of the current video
        const updatedVideo: VideoWithProgress = {
          ...currentVideo,
          status: VideoStatus.COMPLETED,
          progress: 100,
        };

        // Update state without fetching from the database
        setCurrentVideo(updatedVideo);

        // Update the video in the course videos list without full refresh
        setCourseVideos(prev =>
          prev.map(video =>
            video.id === videoId
              ? updatedVideo
              : video
          )
        );
      }
    } catch (error) {
      console.error('Error marking video as complete:', error);
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

      <main className="flex-1 container py-4 md:py-6 px-2 md:px-4 mx-auto">
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
                {courseVideos.map((video, index) => (
                  <VideoItem
                    key={`${video.id}-${index}`}
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