import { Play, CheckCircle, Clock } from 'lucide-react';
import { formatDuration } from '../lib/youtube';
import { VideoStatus, VideoWithProgress } from '../types';

interface VideoItemProps {
  video: VideoWithProgress;
  isActive?: boolean;
  onClick: (videoId: string) => void;
}

export default function VideoItem({ video, isActive = false, onClick }: VideoItemProps) {
  // Get status text and color based on progress
  const getStatusInfo = () => {
    switch (video.status) {
      case VideoStatus.COMPLETED:
        return {
          text: 'Completed',
          icon: <CheckCircle className="h-3.5 w-3.5 text-green-500" />,
          color: 'text-green-500'
        };
      case VideoStatus.IN_PROGRESS:
        return {
          text: `${Math.round(video.progress || 0)}% Complete`,
          icon: <Play className="h-3.5 w-3.5 text-primary" />,
          color: 'text-primary'
        };
      default:
        return {
          text: 'Not started',
          icon: <Clock className="h-3.5 w-3.5 text-muted-foreground" />,
          color: 'text-muted-foreground'
        };
    }
  };

  const statusInfo = getStatusInfo();
  
  return (
    <div 
      className={`p-3 hover:bg-muted/50 cursor-pointer flex gap-3 transition-colors ${
        isActive ? 'bg-muted' : ''
      }`}
      onClick={() => onClick(video.id)}
    >
      {/* Video thumbnail */}
      <div className="relative flex-shrink-0">
        <img 
          src={video.thumbnail} 
          alt={video.title} 
          className="w-24 h-16 object-cover rounded-md" 
        />
        <div className="absolute bottom-1 right-1 bg-black/80 text-white text-[10px] px-1 rounded">
          {formatDuration(video.duration)}
        </div>
      </div>
      
      {/* Video info */}
      <div className="flex-1 min-w-0 flex flex-col">
        <h4 className="font-medium text-sm line-clamp-2">{video.title}</h4>
        
        {/* Status indicator */}
        <div className={`mt-auto text-xs flex items-center gap-1 ${statusInfo.color}`}>
          {statusInfo.icon}
          <span>{statusInfo.text}</span>
          
          {/* Progress bar for in-progress videos */}
          {video.status === VideoStatus.IN_PROGRESS && (
            <div className="w-full max-w-20 h-1 bg-muted-foreground/20 rounded-full overflow-hidden ml-1">
              <div 
                className="h-full bg-primary rounded-full" 
                style={{ width: `${video.progress || 0}%` }}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}