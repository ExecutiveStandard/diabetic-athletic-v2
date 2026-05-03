// src/store/appStore.js
import { create } from 'zustand'

export const useAppStore = create((set) => ({
  // UI state
  mobileMenuOpen: false,
  setMobileMenuOpen: (open) => set({ mobileMenuOpen: open }),

  // Modal state
  modals: {
    newsletterOpen: false,
  },
  openModal: (modalName) => set((state) => ({
    modals: { ...state.modals, [modalName]: true }
  })),
  closeModal: (modalName) => set((state) => ({
    modals: { ...state.modals, [modalName]: false }
  })),
}))
