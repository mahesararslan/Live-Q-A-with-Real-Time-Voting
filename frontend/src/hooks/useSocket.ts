"use client";

import { useEffect, useRef, useState, useCallback } from 'react';
import io from 'socket.io-client';

// Define socket type properly for socket.io-client v4
type SocketIOClient = ReturnType<typeof io>;

interface UseSocketOptions {
  namespace?: string;
  autoConnect?: boolean;
  onNewMessage?: (question: any) => void;
}

export function useSocket(options: UseSocketOptions = {}) {
  const {
    namespace = '/events',
    autoConnect = true,
    onNewMessage
  } = options;

  const [socket, setSocket] = useState<SocketIOClient | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const socketRef = useRef<SocketIOClient | null>(null);

  // Memoize the onNewMessage callback to prevent re-renders
  const stableOnNewMessage = useCallback((question: any) => {
    console.log('Received new message:', question);
    if (onNewMessage) {
      onNewMessage(question);
    }
  }, [onNewMessage]);

  useEffect(() => {
    if (!autoConnect) return;

    const token = localStorage.getItem('token');
    if (!token) {
      setConnectionError('No authentication token found');
      return;
    }

    // Create socket connection with correct configuration
    const newSocket = io(`${process.env.NEXT_PUBLIC_BACKEND_URL}${namespace}`, {
      transports: ['websocket', 'polling'],
      auth: {
        token: token  // This will be available in client.handshake.auth.token
      },
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      randomizationFactor: 0.5,
    });

    // Connection event listeners
    newSocket.on('connect', () => {
      console.log('Connected to WebSocket server');
      setIsConnected(true);
      setConnectionError(null);
    });

    newSocket.on('disconnect', () => {
      console.log('Disconnected from WebSocket server');
      setIsConnected(false);
    });

    newSocket.on('connect_error', (error: any) => {
      console.error('WebSocket connection error:', error);
      setConnectionError(error.message);
      setIsConnected(false);
    });

    // Listen for new messages
    newSocket.on('newMessage', stableOnNewMessage);

    socketRef.current = newSocket;
    setSocket(newSocket);

    // Cleanup on unmount
    return () => {
      newSocket.close();
      socketRef.current = null;
      setSocket(null);
      setIsConnected(false);
    };
  }, [namespace, autoConnect, stableOnNewMessage]); // Fixed dependencies

  // Methods to interact with socket
  const emit = (event: string, data: any) => {
    if (socketRef.current && isConnected) {
      socketRef.current.emit(event, data);
    } else {
      console.warn('Socket not connected, cannot emit event:', event);
    }
  };

  const joinRoom = (roomId: string | number) => {
    emit('joinRoom', { roomId });
  };

  const leaveRoom = (roomId: string | number) => {
    emit('leaveRoom', { roomId });
  };

  const sendMessage = (message: string, roomId: string | number) => {
    emit('message', { message, roomId });
  };

  const disconnect = () => {
    if (socketRef.current) {
      socketRef.current.close();
      setSocket(null);
      setIsConnected(false);
    }
  };

  const reconnect = () => {
    if (socketRef.current) {
      socketRef.current.connect();
    }
  };

  return {
    socket,
    isConnected,
    connectionError,
    emit,
    joinRoom,
    leaveRoom,
    sendMessage,
    disconnect,
    reconnect,
  };
}
