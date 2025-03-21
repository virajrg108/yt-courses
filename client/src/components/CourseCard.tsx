import React from 'react';
import { CourseWithProgress } from '../types';
import ProgressCircle from './ProgressCircle';
import { formatDuration, timeAgo } from '../lib/youtube';
import { PlayCircle, ListVideo, Clock } from 'lucide-react';

interface CourseCardProps {
  course: CourseWithProgress;
  onClick: (courseId: string) => void;
}

export default function CourseCard({ course, onClick }: CourseCardProps) {
  const displayTitle = course.customTitle || course.title;
  const totalDuration = course.videos.reduce((total, video) => total + video.duration, 0);
  const formattedDuration = formatDuration(totalDuration);
  
  const lastWatchedText = course.lastWatched 
    ? timeAgo(course.lastWatched) 
    : "Not started";
  
  const handleClick = () => {
    onClick(course.id);
  };
  
  return (
    <div 
      className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-200 cursor-pointer group"
      onClick={handleClick}
    >
      <div className="relative">
        <img 
          src={course.thumbnail} 
          alt={displayTitle} 
          className="w-full h-48 object-cover"
        />
        
        {/* Overlay on hover */}
        <div className="absolute top-0 left-0 w-full h-full bg-black bg-opacity-20 opacity-0 group-hover:opacity-100 flex justify-center items-center transition-opacity duration-200">
          <div className="bg-white text-primary rounded-full p-3">
            <PlayCircle className="h-6 w-6" />
          </div>
        </div>
        
        {/* Progress circle */}
        <div className="absolute top-2 right-2 flex items-center justify-center">
          <ProgressCircle percentage={course.progress.percentage} />
        </div>
      </div>
      
      <div className="p-4">
        <h3 className="font-medium text-lg mb-1 truncate" title={displayTitle}>
          {displayTitle}
        </h3>
        <p className="text-gray-600 text-sm mb-3">{course.channelTitle}</p>
        
        <div className="flex justify-between items-center">
          <div className="flex items-center">
            <ListVideo className="h-4 w-4 text-gray-600 mr-1" />
            <span className="text-sm text-gray-600">
              {course.videos.length} {course.videos.length === 1 ? 'video' : 'videos'}
            </span>
          </div>
          <div className="flex items-center">
            <Clock className="h-4 w-4 text-gray-600 mr-1" />
            <span className="text-sm text-gray-600">{lastWatchedText}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
