import React from 'react';
import { VideoWithProgress, VideoStatus } from '../types';
import { formatDuration } from '../lib/youtube';
import { Play, Check, Clock } from 'lucide-react';

interface VideoItemProps {
  video: VideoWithProgress;
  isActive?: boolean;
  onClick: (videoId: string) => void;
}

export default function VideoItem({ video, isActive = false, onClick }: VideoItemProps) {
  const handleClick = () => {
    onClick(video.id);
  };
  
  // Determine the status styles
  let statusColor = 'bg-gray-200'; // Not started
  let statusIcon = <span className="text-sm font-medium">{video.position + 1}</span>;
  
  if (video.status === VideoStatus.COMPLETED) {
    statusColor = 'bg-green-500';
    statusIcon = <Check className="h-4 w-4 text-white" />;
  } else if (video.status === VideoStatus.IN_PROGRESS) {
    statusColor = 'bg-amber-500';
    statusIcon = <Play className="h-4 w-4 text-white" />;
  }
  
  // Active item gets highlighted
  const activeClass = isActive ? 'bg-blue-50' : 'hover:bg-gray-50';
  
  return (
    <li 
      className={`${activeClass} cursor-pointer transition-colors`}
      onClick={handleClick}
    >
      <div className="p-4 flex items-center">
        <div className="w-10 h-10 flex-shrink-0 mr-3">
          <div className={`${statusColor} rounded-full w-8 h-8 flex items-center justify-center`}>
            {statusIcon}
          </div>
        </div>
        <div className="flex-grow">
          <h4 className="font-medium mb-1">
            {`${video.position + 1}. ${video.title}`}
          </h4>
          
          {video.status === VideoStatus.IN_PROGRESS && video.progress !== undefined ? (
            <div className="flex flex-col">
              <div className="flex items-center text-sm text-gray-600 mb-1">
                <Clock className="h-3 w-3 mr-1" />
                <span>{formatDuration(video.duration)}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-1">
                <div 
                  className="bg-amber-500 h-1 rounded-full" 
                  style={{ width: `${video.progress}%` }}
                ></div>
              </div>
            </div>
          ) : (
            <div className="flex items-center text-sm text-gray-600">
              <Clock className="h-3 w-3 mr-1" />
              <span>{formatDuration(video.duration)}</span>
            </div>
          )}
        </div>
        <div className="ml-3">
          {video.status === VideoStatus.IN_PROGRESS ? (
            <Play className="h-5 w-5 text-amber-500" />
          ) : (
            <Play className="h-5 w-5 text-gray-400" />
          )}
        </div>
      </div>
    </li>
  );
}
