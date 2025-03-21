import { Course, Video } from '@/types';
import { v4 as uuidv4 } from 'uuid';

// API key should come from environment variable in a real-world scenario
// For this PWA we'll use a public YouTube Data API key
const API_KEY = 'AIzaSyAOd1siJTCLCkBSCXg-nFRrsJWb_U4-jRo';

interface YouTubePlaylistItem {
  id: string;
  snippet: {
    title: string;
    description: string;
    thumbnails: {
      default: { url: string; width: number; height: number };
      medium: { url: string; width: number; height: number };
      high: { url: string; width: number; height: number };
      standard?: { url: string; width: number; height: number };
      maxres?: { url: string; width: number; height: number };
    };
    channelTitle: string;
    publishedAt: string;
    position: number;
    resourceId: {
      videoId: string;
    };
  };
}

interface YouTubePlaylistResponse {
  items: YouTubePlaylistItem[];
  nextPageToken?: string;
  pageInfo: {
    totalResults: number;
  };
}

interface YouTubeVideoResponse {
  items: {
    id: string;
    contentDetails: {
      duration: string;
    };
  }[];
}

// Extract playlist ID from YouTube playlist URL
export function extractPlaylistId(url: string): string | null {
  const regex = /[&?]list=([^&]+)/;
  const match = url.match(regex);
  return match ? match[1] : null;
}

// Convert YouTube duration format (ISO 8601) to seconds
export function parseDuration(duration: string): number {
  const matches = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!matches) return 0;
  
  const hours = parseInt(matches[1] || '0', 10);
  const minutes = parseInt(matches[2] || '0', 10);
  const seconds = parseInt(matches[3] || '0', 10);
  
  return hours * 3600 + minutes * 60 + seconds;
}

// Format seconds as HH:MM:SS or MM:SS
export function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  
  return `${minutes}:${secs.toString().padStart(2, '0')}`;
}

// Calculate time elapsed since a date
export function timeAgo(date: string): string {
  const now = new Date();
  const pastDate = new Date(date);
  const diff = now.getTime() - pastDate.getTime();
  
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  const weeks = Math.floor(days / 7);
  const months = Math.floor(days / 30);
  const years = Math.floor(days / 365);
  
  if (years > 0) return `${years} ${years === 1 ? 'year' : 'years'} ago`;
  if (months > 0) return `${months} ${months === 1 ? 'month' : 'months'} ago`;
  if (weeks > 0) return `${weeks} ${weeks === 1 ? 'week' : 'weeks'} ago`;
  if (days > 0) return `${days} ${days === 1 ? 'day' : 'days'} ago`;
  if (hours > 0) return `${hours} ${hours === 1 ? 'hour' : 'hours'} ago`;
  if (minutes > 0) return `${minutes} ${minutes === 1 ? 'minute' : 'minutes'} ago`;
  
  return 'Just now';
}

// Fetch all playlist items (handles pagination)
async function fetchAllPlaylistItems(playlistId: string): Promise<YouTubePlaylistItem[]> {
  let allItems: YouTubePlaylistItem[] = [];
  let nextPageToken: string | undefined = undefined;
  
  do {
    const params = new URLSearchParams({
      part: 'snippet',
      maxResults: '50',
      playlistId,
      key: API_KEY,
      ...(nextPageToken ? { pageToken: nextPageToken } : {})
    });
    
    const response = await fetch(`https://www.googleapis.com/youtube/v3/playlistItems?${params}`);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch playlist: ${response.statusText}`);
    }
    
    const data: YouTubePlaylistResponse = await response.json();
    allItems = [...allItems, ...data.items];
    nextPageToken = data.nextPageToken;
    
  } while (nextPageToken);
  
  return allItems;
}

// Fetch video details (durations)
async function fetchVideosDetails(videoIds: string[]): Promise<Record<string, number>> {
  // Process in batches of 50 (API limit)
  const durations: Record<string, number> = {};
  
  for (let i = 0; i < videoIds.length; i += 50) {
    const batch = videoIds.slice(i, i + 50);
    const params = new URLSearchParams({
      part: 'contentDetails',
      id: batch.join(','),
      key: API_KEY
    });
    
    const response = await fetch(`https://www.googleapis.com/youtube/v3/videos?${params}`);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch video details: ${response.statusText}`);
    }
    
    const data: YouTubeVideoResponse = await response.json();
    
    data.items.forEach(item => {
      durations[item.id] = parseDuration(item.contentDetails.duration);
    });
  }
  
  return durations;
}

// Fetch playlist info
async function fetchPlaylistInfo(playlistId: string) {
  const params = new URLSearchParams({
    part: 'snippet,contentDetails',
    id: playlistId,
    key: API_KEY
  });
  
  const response = await fetch(`https://www.googleapis.com/youtube/v3/playlists?${params}`);
  
  if (!response.ok) {
    throw new Error(`Failed to fetch playlist info: ${response.statusText}`);
  }
  
  const data = await response.json();
  
  if (data.items.length === 0) {
    throw new Error('Playlist not found');
  }
  
  return data.items[0];
}

// Main function to get course data from a playlist
export async function getCourseFromPlaylist(playlistUrl: string, customTitle?: string): Promise<Course> {
  const playlistId = extractPlaylistId(playlistUrl);
  
  if (!playlistId) {
    throw new Error('Invalid YouTube playlist URL');
  }
  
  // Fetch playlist info
  const playlistInfo = await fetchPlaylistInfo(playlistId);
  
  // Fetch all playlist items
  const playlistItems = await fetchAllPlaylistItems(playlistId);
  
  // Extract video IDs for batch fetching durations
  const videoIds = playlistItems.map(item => item.snippet.resourceId.videoId);
  
  // Fetch video durations
  const durations = await fetchVideosDetails(videoIds);
  
  // Create Video objects
  const videos: Video[] = playlistItems.map(item => {
    const videoId = item.snippet.resourceId.videoId;
    return {
      id: videoId,
      title: item.snippet.title,
      thumbnail: item.snippet.thumbnails.high?.url || item.snippet.thumbnails.medium?.url || item.snippet.thumbnails.default.url,
      description: item.snippet.description,
      duration: durations[videoId] || 0,
      publishedAt: item.snippet.publishedAt,
      position: item.snippet.position
    };
  });
  
  // Sort videos by position
  videos.sort((a, b) => a.position - b.position);
  
  // Create Course object
  const course: Course = {
    id: uuidv4(),
    title: playlistInfo.snippet.title,
    customTitle: customTitle || undefined,
    description: playlistInfo.snippet.description,
    thumbnail: playlistInfo.snippet.thumbnails.high?.url || 
               playlistInfo.snippet.thumbnails.medium?.url || 
               playlistInfo.snippet.thumbnails.default.url,
    channelTitle: playlistInfo.snippet.channelTitle,
    playlistId,
    videos,
    createdAt: new Date().toISOString()
  };
  
  return course;
}

// Generate YouTube video embed URL
export function getVideoEmbedUrl(videoId: string): string {
  return `https://www.youtube.com/embed/${videoId}?enablejsapi=1&rel=0&modestbranding=1`;
}
