import { create } from 'zustand'

interface NotificationState {
  unreadCount:    number
  setUnreadCount: (n: number) => void
  markRead:       () => void
}

export const useNotificationStore = create<NotificationState>((set) => ({
  unreadCount:    0,
  setUnreadCount: (n) => set({ unreadCount: n }),
  markRead:       () => set({ unreadCount: 0 }),
}))
