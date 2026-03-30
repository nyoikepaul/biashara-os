import { create } from 'zustand'
import { persist } from 'zustand/middleware'
export const useAuthStore = create(persist(
  (set) => ({
    token: null, user: null, tenant: null,
    setAuth: (token, user, tenant) => set({ token, user, tenant }),
    logout: () => { localStorage.removeItem('token'); set({ token: null, user: null, tenant: null }) }
  }),
  { name: 'biashara-auth' }
))
