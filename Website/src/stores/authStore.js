import { create } from 'zustand';
import { persist } from 'zustand/middleware';
export const useAdminAuth = create()(persist((set) => ({
    token: null,
    refreshToken: null,
    user: null,
    isAuthenticated: false,
    selectedUnitId: null,
    setAuth: (token, refreshToken, user) => set({ token, refreshToken, user, isAuthenticated: true }),
    clearAuth: () => {
        localStorage.clear();
        set({ token: null, refreshToken: null, user: null, isAuthenticated: false, selectedUnitId: null });
    },
    setSelectedUnitId: (unitId) => set({ selectedUnitId: unitId }),
}), { name: 'lmc_admin_auth' }));
export const useMasterAuth = create()(persist((set) => ({
    token: null,
    refreshToken: null,
    user: null,
    isAuthenticated: false,
    selectedUnitId: null,
    setAuth: (token, refreshToken, user) => set({ token, refreshToken, user, isAuthenticated: true }),
    clearAuth: () => {
        localStorage.clear();
        set({ token: null, refreshToken: null, user: null, isAuthenticated: false, selectedUnitId: null });
    },
    setSelectedUnitId: () => { },
}), { name: 'lmc_master_auth' }));
