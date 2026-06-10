import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User } from '../types';

interface AuthState {
  token: string | null;
  refreshToken: string | null;
  user: User | null;
  isAuthenticated: boolean;
  setAuth: (token: string, refreshToken: string, user: User) => void;
  clearAuth: () => void;
}

export const useAdminAuth = create<AuthState>()(
  persist(
    (set) => ({
      token: null, refreshToken: null, user: null, isAuthenticated: false,
      setAuth: (token, refreshToken, user) => set({ token, refreshToken, user, isAuthenticated: true }),
      clearAuth: () => { localStorage.clear(); set({ token: null, refreshToken: null, user: null, isAuthenticated: false }); },
    }),
    { name: 'lmc_admin_auth' }
  )
);

export const useMasterAuth = create<AuthState>()(
  persist(
    (set) => ({
      token: null, refreshToken: null, user: null, isAuthenticated: false,
      setAuth: (token, refreshToken, user) => set({ token, refreshToken, user, isAuthenticated: true }),
      clearAuth: () => { localStorage.clear(); set({ token: null, refreshToken: null, user: null, isAuthenticated: false }); },
    }),
    { name: 'lmc_master_auth' }
  )
);
