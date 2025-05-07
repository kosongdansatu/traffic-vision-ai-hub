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
    return response.data;
  },
  getVideo: async (id: number) => {
    const response = await api.get(`/api/videos/${id}`);
    return response.data;
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
    window.open(`${API_URL}/api/videos/${id}/download`, '_blank');
  },
};

export default api;
