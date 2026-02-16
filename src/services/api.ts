import axios from 'axios';
import type { JobApplication } from '../types';

// Use Vite dev proxy by default to avoid CORS during local development.
// Override with VITE_API_URL for staging/production.
const API_URL = import.meta.env.VITE_API_URL || '/api';
const PUBLIC_AUTH_ENDPOINTS = new Set([
  '/auth/login',
  '/auth/register',
  '/auth/verify-otp',
  '/auth/resend-otp',
]);

// Create axios instance with default config
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000, // 10 second timeout
});

// Add auth token to requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    const requestUrl = config.url ?? '';
    const isPublicAuthRequest = PUBLIC_AUTH_ENDPOINTS.has(requestUrl);

    if (token && !isPublicAuthRequest) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Handle response errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const requestUrl = error.config?.url ?? '';
    const isPublicAuthRequest = PUBLIC_AUTH_ENDPOINTS.has(requestUrl);

    if ((status === 401 || status === 403) && !isPublicAuthRequest) {
      // Unauthorized - clear token and redirect to login
      localStorage.removeItem('token');
      window.location.href = '/';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  register: async (name: string, email: string, password: string) => {
    const response = await api.post('/auth/register', { name, email, password });
    return response.data;
  },
  
  verifyOTP: async (email: string, otp: string) => {
    const response = await api.post('/auth/verify-otp', { email, otp });
    return response.data;
  },
  
  resendOTP: async (email: string) => {
    const response = await api.post('/auth/resend-otp', { email });
    return response.data;
  },
  
  login: async (email: string, password: string) => {
    const response = await api.post('/auth/login', { email, password });
    return response.data;
  },
  
  getCurrentUser: async () => {
    const response = await api.get('/auth/me');
    return response.data;
  },

  deleteAccount: async () => {
    const response = await api.delete('/auth/account');
    return response.data;
  },
};

// Resume API
export const resumeAPI = {
  upload: async (file: File) => {
    const formData = new FormData();
    formData.append('resume', file);
    
    const response = await api.post('/resumes/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },
  
  getAll: async () => {
    const response = await api.get('/resumes');
    return response.data;
  },
  
  getById: async (id: string) => {
    const response = await api.get(`/resumes/${id}`);
    return response.data;
  },
  
  delete: async (id: string) => {
    const response = await api.delete(`/resumes/${id}`);
    return response.data;
  },
  
  reanalyze: async (id: string) => {
    const response = await api.post(`/resumes/${id}/reanalyze`);
    return response.data;
  },
};

// Job Application API
export const jobApplicationAPI = {
  create: async (data: Partial<JobApplication>) => {
    const response = await api.post('/job-applications', data);
    return response.data;
  },
  
  getAll: async (params?: { status?: string; sortBy?: string; order?: string }) => {
    const response = await api.get('/job-applications', { params });
    return response.data;
  },
  
  getById: async (id: string) => {
    const response = await api.get(`/job-applications/${id}`);
    return response.data;
  },
  
  update: async (id: string, data: Partial<JobApplication>) => {
    const response = await api.put(`/job-applications/${id}`, data);
    return response.data;
  },
  
  delete: async (id: string) => {
    const response = await api.delete(`/job-applications/${id}`);
    return response.data;
  },
  
  getStats: async () => {
    const response = await api.get('/job-applications/stats/overview');
    return response.data;
  },
};

export default api;
