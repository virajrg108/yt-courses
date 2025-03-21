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

// Extract playlist ID from a YouTube URL
export function extractPlaylistId(url: string): string | null {
  const regex = /[&?]list=([^&]+)/i;
  const match = url.match(regex);
  return match ? match[1] : null;
}

// Parse ISO 8601 duration format to seconds
export function parseDuration(duration: string): number {
  const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  
  if (!match) return 0;
  
  const hours = parseInt(match[1] || '0', 10);
  const minutes = parseInt(match[2] || '0', 10);
  const seconds = parseInt(match[3] || '0', 10);
  
  return hours * 3600 + minutes * 60 + seconds;
}

// Format seconds to HH:MM:SS
export function formatDuration(seconds: number): string {
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  
  let result = '';
  if (hrs > 0) {
    result += `${hrs}:${mins < 10 ? '0' : ''}`;
  }
  result += `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  
  return result;
}

// Convert publishedAt date to "time ago" format
export function timeAgo(date: string): string {
  const now = new Date();
  const past = new Date(date);
  const diffMs = now.getTime() - past.getTime();
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);
  const diffWeeks = Math.floor(diffDays / 7);
  const diffMonths = Math.floor(diffDays / 30);
  const diffYears = Math.floor(diffDays / 365);
  
  if (diffSecs < 60) {
    return 'Just now';
  } else if (diffMins < 60) {
    return `${diffMins} ${diffMins === 1 ? 'minute' : 'minutes'} ago`;
  } else if (diffHours < 24) {
    return `${diffHours} ${diffHours === 1 ? 'hour' : 'hours'} ago`;
  } else if (diffDays < 7) {
    return `${diffDays} ${diffDays === 1 ? 'day' : 'days'} ago`;
  } else if (diffWeeks < 4) {
    return `${diffWeeks} ${diffWeeks === 1 ? 'week' : 'weeks'} ago`;
  } else if (diffMonths < 12) {
    return `${diffMonths} ${diffMonths === 1 ? 'month' : 'months'} ago`;
  } else {
    return `${diffYears} ${diffYears === 1 ? 'year' : 'years'} ago`;
  }
}

// Cache for YouTube API key
let cachedApiKey: string | undefined = undefined;

// Function to get the YouTube API key from the backend
async function getYouTubeApiKey(): Promise<string> {
  if (cachedApiKey) {
    return cachedApiKey;
  }
  
  try {
    const response = await fetch('/api/config');
    if (!response.ok) {
      throw new Error(`Failed to fetch API key: ${response.statusText}`);
    }
    
    const data = await response.json();
    if (!data.youtubeApiKey) {
      throw new Error("YouTube API key not found in server configuration");
    }
    
    cachedApiKey = data.youtubeApiKey;
    return data.youtubeApiKey;
  } catch (error) {
    console.error("Error fetching YouTube API key:", error);
    throw new Error("Failed to get YouTube API key from server");
  }
}

// Fetch all playlist items recursively (handling pagination)
async function fetchAllPlaylistItems(playlistId: string): Promise<YouTubePlaylistItem[]> {
  const apiKey = await getYouTubeApiKey();
  
  if (!apiKey) {
    throw new Error("YouTube API key is missing. Please provide a valid API key.");
  }
  
  let items: YouTubePlaylistItem[] = [];
  let nextPageToken: string | undefined = undefined;
  
  do {
    const params = new URLSearchParams({
      part: 'snippet',
      maxResults: '50',
      playlistId: playlistId,
      key: apiKey
    });
    
    if (nextPageToken) {
      params.append('pageToken', nextPageToken);
    }
    
    const response = await fetch(
      `https://www.googleapis.com/youtube/v3/playlistItems?${params.toString()}`
    );
    
    if (!response.ok) {
      throw new Error(`Failed to fetch playlist items: ${response.statusText}`);
    }
    
    const data: YouTubePlaylistResponse = await response.json();
    items = [...items, ...data.items];
    nextPageToken = data.nextPageToken;
    
  } while (nextPageToken);
  
  return items;
}

// Fetch video details (to get duration)
async function fetchVideosDetails(videoIds: string[]): Promise<Record<string, number>> {
  const apiKey = await getYouTubeApiKey();
  
  if (!apiKey) {
    throw new Error("YouTube API key is missing. Please provide a valid API key.");
  }
  
  // Process in chunks of 50 (API limitation)
  const chunks = [];
  for (let i = 0; i < videoIds.length; i += 50) {
    chunks.push(videoIds.slice(i, i + 50));
  }
  
  const durations: Record<string, number> = {};
  
  for (const chunk of chunks) {
    const params = new URLSearchParams({
      part: 'contentDetails',
      id: chunk.join(','),
      key: apiKey
    });
    
    const response = await fetch(
      `https://www.googleapis.com/youtube/v3/videos?${params.toString()}`
    );
    
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

// Fetch playlist info (thumbnail, title)
async function fetchPlaylistInfo(playlistId: string) {
  const apiKey = await getYouTubeApiKey();
  
  if (!apiKey) {
    throw new Error("YouTube API key is missing. Please provide a valid API key.");
  }
  
  const params = new URLSearchParams({
    part: 'snippet',
    id: playlistId,
    key: apiKey
  });
  
  const response = await fetch(
    `https://www.googleapis.com/youtube/v3/playlists?${params.toString()}`
  );
  
  if (!response.ok) {
    throw new Error(`Failed to fetch playlist info: ${response.statusText}`);
  }
  
  const data = await response.json();
  
  if (!data.items || data.items.length === 0) {
    throw new Error("Playlist not found or is private");
  }
  
  return data.items[0].snippet;
}

// Main function to get course data from a playlist URL
export async function getCourseFromPlaylist(playlistUrl: string, customTitle?: string) {
  const playlistId = extractPlaylistId(playlistUrl);
  
  if (!playlistId) {
    throw new Error("Invalid playlist URL");
  }
  
  // Fetch playlist metadata
  const playlistInfo = await fetchPlaylistInfo(playlistId);
  
  // Fetch playlist items
  const playlistItems = await fetchAllPlaylistItems(playlistId);
  
  // Get video IDs to fetch durations
  const videoIds = playlistItems.map(item => item.snippet.resourceId.videoId);
  
  // Fetch video durations
  const videoDurations = await fetchVideosDetails(videoIds);
  
  // Build the videos array
  const videos = playlistItems.map(item => {
    const videoId = item.snippet.resourceId.videoId;
    const thumbnails = item.snippet.thumbnails;
    
    return {
      id: videoId,
      title: item.snippet.title,
      description: item.snippet.description,
      thumbnail: thumbnails.maxres?.url || 
                 thumbnails.standard?.url || 
                 thumbnails.high.url,
      publishedAt: item.snippet.publishedAt,
      position: item.snippet.position,
      duration: videoDurations[videoId] || 0
    };
  });
  
  // Create course object
  const course = {
    id: playlistId,
    title: playlistInfo.title,
    customTitle: customTitle || undefined,
    description: playlistInfo.description,
    thumbnail: playlistInfo.thumbnails.maxres?.url || 
               playlistInfo.thumbnails.standard?.url || 
               playlistInfo.thumbnails.high.url,
    channelTitle: playlistInfo.channelTitle,
    playlistId,
    videos,
    createdAt: new Date().toISOString()
  };
  
  return course;
}

// Get YouTube video embed URL
export function getVideoEmbedUrl(videoId: string): string {
  return `https://www.youtube.com/embed/${videoId}`;
}