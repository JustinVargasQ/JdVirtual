import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import api from '../lib/api';

const DEMO = { email: 'admin@jdvirtual.com', password: 'jd2024' };

const useAuthStore = create(
  persist(
    (set) => ({
      token: null,
      admin: null,
      error: null,
      loading: false,

      login: async (email, password) => {
        set({ loading: true, error: null });
        try {
          // Try real API first
          if (import.meta.env.VITE_API_URL) {
            const { data } = await api.post('/auth/login', { email, password });
            localStorage.setItem('jd-admin-token', data.token);
            set({ token: data.token, admin: data.admin, loading: false });
            return true;
          }
          // Demo fallback (no backend)
          if (email === DEMO.email && password === DEMO.password) {
            const fakeToken = 'demo-token-jd-2024';
            localStorage.setItem('jd-admin-token', fakeToken);
            set({ token: fakeToken, admin: { name: 'Admin JD', email }, loading: false });
            return true;
          }
          set({ error: 'Credenciales incorrectas', loading: false });
          return false;
        } catch (err) {
          set({ error: err.response?.data?.error || 'Error de conexión', loading: false });
          return false;
        }
      },

      logout: () => {
        localStorage.removeItem('jd-admin-token');
        set({ token: null, admin: null, error: null });
      },
    }),
    {
      name: 'jd-admin-auth',
      partialize: (s) => ({ token: s.token, admin: s.admin }),
    }
  )
);

export default useAuthStore;
