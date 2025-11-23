import { create } from 'zustand';

export const useNotificationStore = create((set, get) => ({
  notifications: [],
  unreadCount: 0,
  loading: false,

  setNotifications: (notifications) => set({ notifications }),

  addNotification: (notification) => {
    set({
      notifications: [notification, ...get().notifications],
      unreadCount: get().unreadCount + (notification.isRead ? 0 : 1)
    });
  },

  markAsRead: (id) => {
    set({
      notifications: get().notifications.map(n =>
        n._id === id ? { ...n, isRead: true } : n
      ),
      unreadCount: Math.max(0, get().unreadCount - 1)
    });
  },

  markAllAsRead: () => {
    set({
      notifications: get().notifications.map(n => ({ ...n, isRead: true })),
      unreadCount: 0
    });
  },

  deleteNotification: (id) => {
    const notification = get().notifications.find(n => n._id === id);
    set({
      notifications: get().notifications.filter(n => n._id !== id),
      unreadCount: notification && !notification.isRead
        ? Math.max(0, get().unreadCount - 1)
        : get().unreadCount
    });
  },

  setUnreadCount: (count) => set({ unreadCount: count }),
  setLoading: (loading) => set({ loading })
}));
