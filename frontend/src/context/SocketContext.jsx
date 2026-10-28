import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';
import { api } from '../utils/api';

const SocketContext = createContext();

export const SocketProvider = ({ children }) => {
  const { user } = useAuth();
  const [socket, setSocket] = useState(null);
  const [onlineUserIds, setOnlineUserIds] = useState(new Set());
  const [unreadCount, setUnreadCount] = useState(0);

  // Fetch initial unread count on login
  useEffect(() => {
    if (!user) {
      setUnreadCount(0);
      return;
    }
    const fetchUnread = async () => {
      try {
        const res = await api.get('/chat/unread-count');
        setUnreadCount(res.unreadCount || 0);
      } catch (e) {
        // quiet error
      }
    };
    fetchUnread();
  }, [user]);

  useEffect(() => {
    if (!user) {
      if (socket) {
        socket.disconnect();
        setSocket(null);
      }
      return;
    }

    const token = api.getToken();
    if (!token) return;

    const socketHost = typeof window !== 'undefined' ? window.location.hostname : 'localhost';
    const newSocket = io(`http://${socketHost}:5000`, {
      auth: { token },
      transports: ['websocket', 'polling'],
    });

    newSocket.on('connect', () => {
      console.log('Socket connected:', newSocket.id);
      newSocket.emit('join:communities');
    });

    newSocket.on('user:online', ({ userId }) => {
      setOnlineUserIds((prev) => new Set([...prev, userId]));
    });

    newSocket.on('user:offline', ({ userId }) => {
      setOnlineUserIds((prev) => {
        const next = new Set(prev);
        next.delete(userId);
        return next;
      });
    });

    newSocket.on('message:new', (msg) => {
      // If message is received by me and we aren't in active conversation, increment unread count
      if (msg.receiver_id === user.id) {
        setUnreadCount((prev) => prev + 1);
      }
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, [user]);

  const isUserOnline = (targetUserId) => {
    return onlineUserIds.has(targetUserId);
  };

  const decrementUnread = (count = 1) => {
    setUnreadCount((prev) => Math.max(0, prev - count));
  };

  const clearUnread = () => {
    setUnreadCount(0);
  };

  return (
    <SocketContext.Provider
      value={{
        socket,
        isUserOnline,
        onlineUserIds,
        unreadCount,
        decrementUnread,
        clearUnread,
        setUnreadCount,
      }}
    >
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);
