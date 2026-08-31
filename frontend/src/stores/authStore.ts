import { create } from 'zustand';
import { User } from '../types';
import { login as apiLogin } from '../services/api';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (u: string, p: string) => Promise<void>;
  logout: () => void;
  checkAuth: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  isAuthenticated: false,
  login: async (username, password) => {
    const res: any = await apiLogin(username, password);
    localStorage.setItem('ibvap_token', res.data.token);
    set({ user: res.data.user, token: res.data.token, isAuthenticated: true });
  },
  logout: () => {
    localStorage.removeItem('ibvap_token');
    set({ user: null, token: null, isAuthenticated: false });
  },
  checkAuth: () => {
    const token = localStorage.getItem('ibvap_token');
    if (token) {
      set({ isAuthenticated: true, token, user: { id: '1', username: 'admin', role: 'commander', fullName: 'Commander' } });
    }
  }
}));
