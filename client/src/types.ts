export interface Video {
  id: string;
  title: string;
  thumbnail: string;
  description: string;
  duration: number; // in seconds
  publishedAt: string;
  position: number;
}

export interface VideoProgress {
  videoId: string;
  courseId: string;
  currentTime: number;
  duration: number;
  completed: boolean;
  lastWatched: string;
}

export interface Course {
  id: string;
  title: string;
  customTitle?: string;
  description: string;
  thumbnail: string;
  channelTitle: string;
  playlistId: string;
  videos: Video[];
  createdAt: string;
  lastWatched?: string;
}

export interface CourseWithProgress extends Course {
  progress: {
    completedVideos: number;
    totalVideos: number;
    percentage: number;
    currentVideoId?: string;
  };
}

export enum VideoStatus {
  COMPLETED = "completed",
  IN_PROGRESS = "in-progress",
  NOT_STARTED = "not-started"
}

export interface VideoWithProgress extends Video {
  status: VideoStatus;
  progress?: number; // 0-100
  currentTime?: number;
}