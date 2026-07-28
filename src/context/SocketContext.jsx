import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext.jsx';
import { useToast } from './ToastContext.jsx';
import { API_ORIGIN, notificationsApi } from '../lib/api.js';

const SocketContext = createContext(null);

export function SocketProvider({ children }) {
  const { user } = useAuth();
  const [socket, setSocket] = useState(null);
  const [hasUnreadMessages, setHasUnreadMessages] = useState(false);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [onlineUsers, setOnlineUsers] = useState(() => new Set());
  const { notify } = useToast();

  const refreshNotifications = useCallback(() => {
    notificationsApi
      .list({ limit: 1 })
      .then((data) => setUnreadNotifications(data.unreadCount || 0))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!user) {
      setSocket(null);
      setHasUnreadMessages(false);
      setUnreadNotifications(0);
      setOnlineUsers(new Set());
      return undefined;
    }

    refreshNotifications();

    const instance = io(API_ORIGIN, { withCredentials: true });
    instance.on('message:new', () => setHasUnreadMessages(true));
    instance.on('notification:new', (notification) => {
      setUnreadNotifications((count) => count + 1);
      if (notification?.title) {
        notify({ title: notification.title, body: notification.body, tone: 'notification' });
      }
    });
    instance.on('presence:snapshot', (userIds) => {
      setOnlineUsers(new Set(Array.isArray(userIds) ? userIds : []));
    });
    instance.on('presence:update', ({ userId: changedId, online }) => {
      setOnlineUsers((current) => {
        const next = new Set(current);
        if (online) next.add(changedId);
        else next.delete(changedId);
        return next;
      });
    });
    setSocket(instance);

    return () => {
      instance.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const clearUnread = useCallback(() => setHasUnreadMessages(false), []);
  const clearUnreadNotifications = useCallback(() => setUnreadNotifications(0), []);

  const value = {
    socket,
    hasUnreadMessages,
    clearUnread,
    unreadNotifications,
    clearUnreadNotifications,
    refreshNotifications,
    onlineUsers,
  };

  return <SocketContext.Provider value={value}>{children}</SocketContext.Provider>;
}

export function useSocket() {
  const ctx = useContext(SocketContext);
  if (!ctx) throw new Error('useSocket must be used within a SocketProvider');
  return ctx;
}

