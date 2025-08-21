"use client";

import { useEffect, useRef, useState, useCallback } from 'react';
import io from 'socket.io-client';

// Define socket type properly for socket.io-client v4
type SocketIOClient = ReturnType<typeof io>;

interface UseSocketOptions {
  namespace?: string;
  autoConnect?: boolean;
  onNewMessage?: (message: any) => void;
  onUserJoined?: (data: any) => void;
  onUserLeft?: (data: any) => void;
  onJoinRoomSuccess?: (data: any) => void;
  onJoinRoomError?: (data: any) => void;
  onVoteUpdated?: (data: any) => void;
  onSessionEnded?: (data: any) => void;
  onSessionEndError?: (data: any) => void;
  onQuestionAnswered?: (data: any) => void;
  onMarkAsAnsweredError?: (data: any) => void;
}

export function useSocket(options: UseSocketOptions = {}) {
  const {
    namespace = '/events',
    autoConnect = true,
    onNewMessage,
    onUserJoined,
    onUserLeft,
    onJoinRoomSuccess,
    onJoinRoomError,
    onVoteUpdated,
    onSessionEnded,
    onSessionEndError,
    onQuestionAnswered,
    onMarkAsAnsweredError
  } = options;

  const [socket, setSocket] = useState<SocketIOClient | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [currentRoom, setCurrentRoom] = useState<string | null>(null);
  const socketRef = useRef<SocketIOClient | null>(null);

  // Add these new callback handlers after the existing ones
  const stableOnUserJoined = useCallback((data: any) => {
    console.log('User joined:', data);
    if (onUserJoined) {
      onUserJoined(data);
    }
  }, [onUserJoined]);

  const stableOnUserLeft = useCallback((data: any) => {
    console.log('User left:', data);
    if (onUserLeft) {
      onUserLeft(data);
    }
  }, [onUserLeft]);

  const stableOnJoinRoomSuccess = useCallback((data: any) => {
    console.log('Joined room successfully:', data);
    setCurrentRoom(data.roomId);
    if (onJoinRoomSuccess) {
      onJoinRoomSuccess(data);
    }
  }, [onJoinRoomSuccess]);

  const stableOnJoinRoomError = useCallback((data: any) => {
    console.error('Join room error:', data);
    if (onJoinRoomError) {
      onJoinRoomError(data);
    }
  }, [onJoinRoomError]);
  const stableOnNewMessage = useCallback((question: any) => {
    console.log('Received new message:', question);
    if (onNewMessage) {
      onNewMessage(question);
    }
  }, [onNewMessage]);

  const stableOnVoteUpdated = useCallback((data: any) => {
    console.log('Vote updated:', data);
    if (onVoteUpdated) {
      onVoteUpdated(data);
    }
  }, [onVoteUpdated]);

  const stableOnSessionEnded = useCallback((data: any) => {
    console.log('Session ended:', data);
    if (onSessionEnded) {
      onSessionEnded(data);
    }
  }, [onSessionEnded]);

  const stableOnSessionEndError = useCallback((data: any) => {
    console.error('Session end error:', data);
    if (onSessionEndError) {
      onSessionEndError(data);
    }
  }, [onSessionEndError]);

  const stableOnQuestionAnswered = useCallback((data: any) => {
    console.log('Question answered:', data);
    if (onQuestionAnswered) {
      onQuestionAnswered(data);
    }
  }, [onQuestionAnswered]);

  const stableOnMarkAsAnsweredError = useCallback((data: any) => {
    console.error('Mark as answered error:', data);
    if (onMarkAsAnsweredError) {
      onMarkAsAnsweredError(data);
    }
  }, [onMarkAsAnsweredError]);

  useEffect(() => {
    if (!autoConnect) return;

    const token = localStorage.getItem('token');
    if (!token) {
      setConnectionError('No authentication token found');
      return;
    }

    // Create socket connection with correct configuration
    const url = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3000";
    const newSocket = io(`${url}${namespace}`, {
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

    // Listen for new messages and room events
    newSocket.on('newMessage', stableOnNewMessage);
    newSocket.on('userJoined', stableOnUserJoined);
    newSocket.on('userLeft', stableOnUserLeft);
    newSocket.on('joinRoomSuccess', stableOnJoinRoomSuccess);
    newSocket.on('joinRoomError', stableOnJoinRoomError);
    
    // Additional event listeners
    newSocket.on('leaveRoomSuccess', (data: any) => {
      console.log('Left room successfully:', data);
      setCurrentRoom(null);
    });

    newSocket.on('messageError', (data: any) => {
      console.error('Message error:', data);
    });

    newSocket.on('voteUpdated', stableOnVoteUpdated);

    newSocket.on('voteError', (data: any) => {
      console.error('Vote error:', data);
    });

    newSocket.on('sessionEnded', stableOnSessionEnded);

    newSocket.on('sessionEndError', stableOnSessionEndError);

    newSocket.on('questionAnswered', stableOnQuestionAnswered);

    newSocket.on('markAsAnsweredError', stableOnMarkAsAnsweredError);

    socketRef.current = newSocket;
    setSocket(newSocket);

    // Cleanup on unmount
    return () => {
      newSocket.close();
      socketRef.current = null;
      setSocket(null);
      setIsConnected(false);
    };
  }, [namespace, autoConnect, stableOnNewMessage, stableOnUserJoined, stableOnUserLeft, stableOnJoinRoomSuccess, stableOnJoinRoomError, stableOnVoteUpdated, stableOnSessionEnded, stableOnSessionEndError]);

  // Methods to interact with socket
  const emit = useCallback((event: string, data: any) => {
    if (socketRef.current && isConnected) {
      socketRef.current.emit(event, data);
      console.log(`Emitting ${event}:`, data);
    } else {
      console.warn('Socket not connected, cannot emit event:', event);
    }
  }, [isConnected]);

  const joinRoom = useCallback((roomCode: string, userId: number) => {
    console.log(`Joining room ${roomCode} with user ${userId}`);
    emit('joinRoom', { roomCode, userId });
  }, [emit]);

  const leaveRoom = useCallback((roomCode: string, userId: number) => {
    console.log(`Leaving room ${roomCode} with user ${userId}`);
    emit('leaveRoom', { roomCode, userId });
  }, [emit]);

  const sendMessage = useCallback((content: string, roomCode: string, userId: number) => {
    console.log(`Sending message to room ${roomCode}:`, content);
    emit('message', { content, roomCode, userId });
  }, [emit]);

  const sendVote = useCallback((questionId: number, roomCode: string, userId: number) => {
    console.log(`Sending vote for question ${questionId} in room ${roomCode}`);
    emit('vote', { questionId, roomCode, userId });
  }, [emit]);

  const sendMarkAsAnswered = useCallback((questionId: number, roomCode: string, userId: number) => {
    console.log(`Marking question ${questionId} as answered in room ${roomCode}`);
    emit('markAsAnswered', { questionId, roomCode, userId });
  }, [emit]);

  const endSession = useCallback((roomCode: string, userId: number) => {
    console.log(`Ending session for room ${roomCode}`);
    emit('endSession', { roomCode, userId });
  }, [emit]);

  const userLeaveRoom = useCallback((roomCode: string, userId: number) => {
    console.log(`User leaving room ${roomCode}`);
    emit('leaveRoom', { roomCode, userId });
  }, [emit]);

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
    currentRoom,
    emit,
    joinRoom,
    leaveRoom,
    sendMessage,
    sendVote,
    sendMarkAsAnswered,
    endSession,
    userLeaveRoom,
    disconnect,
    reconnect,
  };
}
