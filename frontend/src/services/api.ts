import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('ibvap_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('ibvap_token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const login = async (username: string, password: string) => {
  // Mock login for now
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({ data: { token: 'mock-token', user: { id: '1', username, role: 'commander', fullName: 'Commander 1' } } });
    }, 1000);
  });
};

export const getMe = async () => api.get('/auth/me');
export const getDashboardKPIs = async () => api.get('/dashboard/kpis');
export const getRecentAlerts = async () => api.get('/alerts/recent');
export const getRecentEvents = async () => api.get('/events/recent');
export const getCameras = async () => api.get('/cameras');
export const getAlerts = async () => api.get('/alerts');
export const getIncidents = async () => api.get('/incidents');
export const acknowledgeAlert = async (id: string) => api.post(`/alerts/${id}/acknowledge`);

export default api;
