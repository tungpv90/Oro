import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

export const api = axios.create({
  baseURL: `${API_URL}/api`,
  headers: { 'Content-Type': 'application/json' },
});

// Attach token on client side
if (typeof window !== 'undefined') {
  api.interceptors.request.use((config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  });

  api.interceptors.response.use(
    (res) => res,
    async (error) => {
      const original = error.config;
      if (error.response?.status === 401 && !original._retry) {
        original._retry = true;
        try {
          const refreshToken = localStorage.getItem('refreshToken');
          const { data } = await axios.post(`${API_URL}/api/auth/refresh`, { refreshToken });
          localStorage.setItem('accessToken', data.accessToken);
          localStorage.setItem('refreshToken', data.refreshToken);
          original.headers.Authorization = `Bearer ${data.accessToken}`;
          return api(original);
        } catch {
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          window.location.href = '/login';
        }
      }
      return Promise.reject(error);
    },
  );
}

// ─── Auth ─────────────────────────────────────────
export const authApi = {
  login: (email: string, password: string) =>
    api.post('/auth/login', { email, password }),
  register: (email: string, password: string, name?: string) =>
    api.post('/auth/register', { email, password, name }),
  refresh: (refreshToken: string) =>
    api.post('/auth/refresh', { refreshToken }),
};

// ─── Users ────────────────────────────────────────
export const usersApi = {
  getProfile: () => api.get('/users/me'),
  updateProfile: (data: { name?: string; avatar?: string }) =>
    api.put('/users/me', data),
};

// ─── Media ────────────────────────────────────────
export const mediaApi = {
  list: (params?: { page?: number; limit?: number; type?: string }) =>
    api.get('/media', { params }),
  get: (id: string) => api.get(`/media/${id}`),
  upload: (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post('/media/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  update: (id: string, data: { title?: string; description?: string; visibility?: string; price?: number }) =>
    api.put(`/media/${id}`, data),
  delete: (id: string) => api.delete(`/media/${id}`),
  processAnimation: (id: string, options?: { fps?: number; width?: number; height?: number }) =>
    api.post(`/media/${id}/process-animation`, options),
  getJobStatus: (jobId: string) => api.get(`/media/animation-jobs/${jobId}`),
  downloadFrames: (jobId: string) =>
    api.get(`/media/animation-jobs/${jobId}/download`, { responseType: 'blob' }),
};

// ─── Feed (Public) ────────────────────────────────
export const feedApi = {
  list: (params?: { page?: number; limit?: number; type?: string; feed?: string }) =>
    api.get('/feed', { params }),
};

// ─── Admin ────────────────────────────────────────
export const adminApi = {
  dashboard: () => api.get('/admin/dashboard'),
  users: (params?: { page?: number; limit?: number }) =>
    api.get('/admin/users', { params }),
  updateUser: (id: string, data: Record<string, unknown>) =>
    api.put(`/admin/users/${id}`, data),
  deleteUser: (id: string) => api.delete(`/admin/users/${id}`),
  media: (params?: { page?: number; limit?: number }) =>
    api.get('/admin/media', { params }),
  updateMedia: (id: string, data: Record<string, unknown>) =>
    api.put(`/admin/media/${id}`, data),
  deleteMedia: (id: string) => api.delete(`/admin/media/${id}`),
};

// ─── Devices ──────────────────────────────────────
export const devicesApi = {
  list: () => api.get('/devices'),
  get: (id: string) => api.get(`/devices/${id}`),
  create: (data: { name: string; macAddress: string }) =>
    api.post('/devices', data),
  update: (id: string, data: { name?: string }) =>
    api.put(`/devices/${id}`, data),
  delete: (id: string) => api.delete(`/devices/${id}`),
};
