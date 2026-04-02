import { create } from 'zustand'
import { persist } from 'zustand/middleware'
 
export const useAuthStore = create(
  persist(
    (set, get) => ({
      token: null,
      user: null,
      tenant: null,
      setAuth: (token, user, tenant) => {
        if (token) localStorage.setItem('token', token)
        set({ token, user, tenant })
      },
      updateTenant: (t) => set({ tenant: t }),
      logout: () => {
        localStorage.removeItem('token')
        set({ token: null, user: null, tenant: null })
      },
      isAuthenticated: () => !!get().token
    }),
    {
      name: 'biashara-auth',
      onRehydrateStorage: () => (state) => {
        if (state?.token) localStorage.setItem('token', state.token)
      }
    }
  )
)
