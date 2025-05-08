import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 300000, // 5 minutes timeout for large uploads
  maxContentLength: 200 * 1024 * 1024, // 200MB
  maxBodyLength: 200 * 1024 * 1024, // 200MB
});

// Add authentication token to requests if available
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auth services
export const authService = {
  login: async (email: string, password: string) => {
    const response = await api.post('/api/token', { username: email, password });
    return response.data;
  },
  register: async (email: string, password: string) => {
    const response = await api.post('/api/register', { email, password });
    return response.data;
  },
};

/**
 * Check if a video file is playable by fetching headers
 */
const checkVideoPlayable = async (videoPath: string): Promise<boolean> => {
  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
  const token = localStorage.getItem('token') || '';
  const videoUrl = `${apiUrl}/${videoPath}?auth_token=${token}`;
  
  console.log(`Checking video playability for ${videoUrl}`);
  
  try {
    // First try with auth_token in query params
    let response = await fetch(videoUrl, {
      method: 'HEAD',
      cache: 'no-cache',
      headers: {
        'Content-Type': 'video/mp4',
      },
    });
    
    // If unauthorized, try again with bearer token in Authorization header
    if (response.status === 401 && token) {
      console.log("Retrying with Authorization header");
      response = await fetch(`${apiUrl}/${videoPath}`, {
        method: 'HEAD',
        cache: 'no-cache',
        headers: {
          'Content-Type': 'video/mp4',
          'Authorization': `Bearer ${token}`,
        },
      });
    }
    
    if (!response.ok) {
      console.error(`Video file not accessible: ${videoUrl}`, response.status, response.statusText);
      return false;
    }
    
    const contentType = response.headers.get('Content-Type');
    const contentLength = response.headers.get('Content-Length');
    
    console.log(`Video check - Content-Type: ${contentType}, Content-Length: ${contentLength}`);
    
    // Check if content type is video or has reasonable size
    if (contentType && contentType.includes('video')) {
      return true;
    }
    
    // Check size is reasonable (> 1MB)
    if (contentLength && parseInt(contentLength) > 1000000) {
      return true;
    }
    
    return false;
  } catch (error) {
    console.error(`Error checking video playability: ${error}`);
    return false;
  }
};

// Video services
export const videoService = {
  uploadVideo: async (formData: FormData) => {
    const response = await api.post('/api/videos/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },
  getVideos: async () => {
    const response = await api.get('/api/videos');
    // Untuk setiap video yang completed, ambil processing_time dari results jika tersedia
    const videos = response.data;
    
    // Untuk performa, kita hanya akan mengambil data untuk video yang sudah completed
    // tapi belum memiliki processing_time
    const completedVideosWithoutProcessingTime = videos.filter(
      (video) => video.status === 'completed' && !video.processing_time && video.json_result_path
    );
    
    // Jika ada video completed yang belum punya processing_time, fetch datanya
    if (completedVideosWithoutProcessingTime.length > 0) {
      const processVideos = async () => {
        for (const video of completedVideosWithoutProcessingTime) {
          try {
            const results = await videoService.getVideoResults(video.id);
            if (results && results.processing_stats && results.processing_stats.processing_time_seconds) {
              // Tambahkan processing_time ke objek video
              video.processing_time = results.processing_stats.processing_time_seconds;
            }
          } catch (err) {
            console.error(`Error fetching results for video ${video.id}:`, err);
          }
        }
      };
      
      // Jalankan proses asinkron untuk mengambil data, tapi tidak block return
      processVideos();
    }
    
    return videos;
  },
  getVideo: async (id: number) => {
    const response = await api.get(`/api/videos/${id}`);
    const video = response.data;
    
    // Jika status completed dan belum ada processing_time, coba ambil dari results
    if (video.status === 'completed' && !video.processing_time && video.json_result_path) {
      try {
        const results = await videoService.getVideoResults(id);
        if (results && results.processing_stats && results.processing_stats.processing_time_seconds) {
          // Tambahkan processing_time ke objek video
          video.processing_time = results.processing_stats.processing_time_seconds;
        }
      } catch (err) {
        console.error(`Error fetching results for video ${id}:`, err);
      }
    }
    
    return video;
  },
  getVideoResults: async (id: number) => {
    const response = await api.get(`/api/videos/${id}/results`);
    return response.data;
  },
  deleteVideo: async (id: number) => {
    const response = await api.delete(`/api/videos/${id}`);
    return response.data;
  },
  downloadVideo: (id: number) => {
    // Get the authentication token
    const token = localStorage.getItem('token');
    if (!token) {
      console.error('No authentication token found');
      return false;
    }
    
    // Create a download URL with token
    const downloadUrl = `${API_URL}/api/videos/${id}/download?auth_token=${token}`;
    console.log(`Initiating download from: ${downloadUrl}`);
    
    // Try to open the URL in a new tab
    const downloadWindow = window.open(downloadUrl, '_blank');
    
    // Check if window was blocked by popup blocker
    if (!downloadWindow || downloadWindow.closed || typeof downloadWindow.closed === 'undefined') {
      console.log('Popup blocked, trying fallback method');
      
      // Create a hidden iframe for download
      const iframe = document.createElement('iframe');
      iframe.style.display = 'none';
      iframe.src = downloadUrl;
      document.body.appendChild(iframe);
      
      // Monitor for errors and try alternative method if needed
      setTimeout(() => {
        try {
          // If iframe content indicates error, try a direct fetch
          if (iframe.contentDocument && 
              iframe.contentDocument.body && 
              iframe.contentDocument.body.textContent &&
              iframe.contentDocument.body.textContent.includes('Not authenticated')) {
            
            console.log('Authentication error in iframe, trying direct fetch');
            
            // Try direct fetch with Authorization header
            fetch(`${API_URL}/api/videos/${id}/download`, {
              headers: {
                'Authorization': `Bearer ${token}`
              }
            })
            .then(response => {
              if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
              return response.blob();
            })
            .then(blob => {
              // Create URL for download
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `video_${id}_processed.mp4`;
              document.body.appendChild(a);
              a.click();
              document.body.removeChild(a);
              URL.revokeObjectURL(url);
            })
            .catch(error => {
              console.error('Download error:', error);
              alert('Could not download video. Please try again later.');
            });
          }
        } finally {
          // Remove iframe after attempt
          if (document.body.contains(iframe)) {
            document.body.removeChild(iframe);
          }
        }
      }, 3000);
    }
    
    return true;
  },
  downloadVideoResults: async (id: number) => {
    try {
      const response = await api.get(`/api/videos/${id}/results`);
      // Convert response data to JSON string
      const jsonData = JSON.stringify(response.data, null, 2);
      
      // Create a blob from the JSON data
      const blob = new Blob([jsonData], { type: 'application/json' });
      
      // Create a URL for the blob
      const url = URL.createObjectURL(blob);
      
      // Create a temporary anchor element
      const a = document.createElement('a');
      a.href = url;
      a.download = `video_${id}_results.json`;
      
      // Trigger a click on the anchor
      document.body.appendChild(a);
      a.click();
      
      // Clean up
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      return true;
    } catch (error) {
      console.error('Error downloading video results:', error);
      return false;
    }
  },
  getUploadUrl: async (videoPath: string) => {
    // Implementation of getUploadUrl function
  },
  processVideo: async (videoId: number) => {
    // Implementation of processVideo function
  },
  checkVideoPlayable,
};

export default api;
