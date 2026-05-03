// src/store/newsletterStore.js
import { create } from 'zustand'

export const useNewsletterStore = create((set) => ({
  // Form state
  email: '',
  setEmail: (email) => set({ email }),

  // Submission state
  status: 'idle', // 'idle' | 'loading' | 'success' | 'error'
  message: '',
  setStatus: (status, message = '') => set({ status, message }),

  // Reset form
  reset: () => set({ email: '', status: 'idle', message: '' }),
}))
