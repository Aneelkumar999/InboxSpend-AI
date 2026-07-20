import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

export const api = axios.create({
  baseURL: API_URL,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const loginWithGoogle = async (accessToken: string) => {
  const response = await api.post('/auth/google/login', { access_token: accessToken });
  return response.data;
};

export const getChatHistory = async (sessionId: string) => {
  const response = await api.get(`/chat/sessions/${sessionId}/messages`);
  return response.data;
};

// Reports API
export const downloadReport = async (format: string, period: string) => {
  const response = await api.get(`/reports/download?format=${format}&period=${period}`, {
    responseType: 'blob', // Important for file downloads
  });
  
  // Create a blob URL and trigger download
  const url = window.URL.createObjectURL(new Blob([response.data]));
  const link = document.createElement('a');
  link.href = url;
  
  // Extract filename from Content-Disposition header if possible, else default
  const contentDisposition = response.headers['content-disposition'];
  let filename = `Report_${period}.${format}`;
  if (contentDisposition) {
    const filenameMatch = contentDisposition.match(/filename="?(.+)"?/);
    if (filenameMatch && filenameMatch.length === 2) {
      filename = filenameMatch[1];
    }
  }
  
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  link.remove();
};

export const emailReport = async (emailTo: string, period: string) => {
  const response = await api.post(`/reports/email?email_to=${encodeURIComponent(emailTo)}&period=${period}`);
  return response.data;
};

export const createReportSchedule = async (frequency: string, emailTo: string) => {
  const response = await api.post('/reports/schedule', { frequency, email_to: emailTo });
  return response.data;
};

export const getReportSchedules = async () => {
  const response = await api.get('/reports/schedule');
  return response.data;
};

export const fetchDashboard = async () => {
  const response = await api.get('/expenses/dashboard');
  return response.data;
};

export const fetchExpenses = async (params?: Record<string, any>) => {
  const response = await api.get('/expenses', { params });
  return response.data;
};

export const syncExpenses = async () => {
  const response = await api.post('/expenses/sync');
  return response.data;
};

export const fetchSubscriptions = async () => {
  const response = await api.get('/expenses/subscriptions');
  return response.data;
};
