import { Play, Calendar, Clock } from 'lucide-react';
import { CourseWithProgress } from '../types';
import ProgressCircle from './ProgressCircle';
import { formatDuration, timeAgo } from '../lib/youtube';

interface CourseCardProps {
  course: CourseWithProgress;
  onClick: (courseId: string) => void;
}

export default function CourseCard({ course, onClick }: CourseCardProps) {
  // Get the total duration of all videos in the course
  const getTotalDuration = () => {
    return course.videos.reduce((total, video) => total + video.duration, 0);
  };
  
  // Display the time since last watched, or time since added if never watched
  const getTimeAgo = () => {
    if (course.lastWatched) {
      return timeAgo(course.lastWatched);
    }
    return timeAgo(course.createdAt);
  };
  
  // Use the custom title if available, otherwise use the original title
  const displayTitle = course.customTitle || course.title;
  
  return (
    <div 
      className="group border rounded-lg overflow-hidden flex flex-col bg-card transition-all hover:shadow-md cursor-pointer"
      onClick={() => onClick(course.id)}
    >
      {/* Course thumbnail with progress overlay */}
      <div className="relative aspect-video">
        <img 
          src={course.thumbnail} 
          alt={displayTitle} 
          className="w-full h-full object-cover" 
        />
        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
          <button className="bg-primary text-white rounded-full w-12 h-12 flex items-center justify-center">
            <Play className="h-6 w-6 ml-1" />
          </button>
        </div>
        
        {/* Progress indicator */}
        <div className="absolute top-2 right-2 bg-background/80 rounded-full p-1 backdrop-blur-sm">
          <ProgressCircle 
            percentage={course.progress.percentage} 
            size={36} 
            strokeWidth={3}
            showText={true}
          />
        </div>
      </div>
      
      {/* Course info */}
      <div className="p-4 flex-grow flex flex-col">
        <h3 className="font-semibold text-base line-clamp-2 mb-1">
          {displayTitle}
        </h3>
        <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
          {course.channelTitle}
        </p>
        
        {/* Course stats */}
        <div className="flex flex-wrap gap-x-4 gap-y-1 mt-auto pt-2 text-xs text-muted-foreground">
          <div className="flex items-center">
            <Calendar className="h-3.5 w-3.5 mr-1.5" />
            <span>{getTimeAgo()}</span>
          </div>
          <div className="flex items-center">
            <Clock className="h-3.5 w-3.5 mr-1.5" />
            <span>{formatDuration(getTotalDuration())}</span>
          </div>
        </div>
        
        {/* Progress text */}
        <div className="text-xs mt-2">
          <span className="text-primary font-medium">
            {course.progress.completedVideos}/{course.progress.totalVideos} videos completed
          </span>
        </div>
      </div>
    </div>
  );
}