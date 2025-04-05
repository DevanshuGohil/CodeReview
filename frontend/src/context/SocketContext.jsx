import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';

const SocketContext = createContext(null);

export const useSocket = () => useContext(SocketContext);

export const SocketProvider = ({ children }) => {
    const { user, token } = useAuth();
    const [socket, setSocket] = useState(null);
    const [connected, setConnected] = useState(false);
    const [connectionError, setConnectionError] = useState(null);
    const [reconnectAttempts, setReconnectAttempts] = useState(0);

    // Define connectSocket as useCallback
    const connectSocket = useCallback(() => {
        if (!token || !user) {
            return null;
        }

        try {
            // Determine the server URL based on environment
            const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
            const host = window.location.hostname;
            const port = process.env.NODE_ENV === 'production' ? window.location.port : '5000';

            const serverUrl = process.env.NODE_ENV === 'production'
                ? `${protocol}//${host}${port ? `:${port}` : ''}`
                : `${protocol}//${host}:5000`;

            // Clean up any existing socket before creating a new one
            if (socket) {
                socket.disconnect();
                setSocket(null);
            }

            // Create a new socket instance
            const socketInstance = io(serverUrl, {
                transports: ['websocket', 'polling'],
                path: '/socket.io',
                auth: {
                    token
                },
                query: {
                    userId: user?._id
                },
                reconnectionAttempts: 10,
                reconnectionDelay: 1000,
                reconnectionDelayMax: 5000,
                timeout: 20000
            });

            // Set up connection event handlers
            socketInstance.on('connect', () => {
                setConnected(true);
                setConnectionError(null);
                setReconnectAttempts(0);
            });

            socketInstance.on('connect_error', (error) => {
                setConnectionError(error.message);
                setConnected(false);
            });

            socketInstance.on('disconnect', (reason) => {
                setConnected(false);

                if (reason === 'io server disconnect') {
                    socketInstance.connect();
                }
            });

            socketInstance.on('reconnect', (attemptNumber) => {
                setConnected(true);
                setConnectionError(null);
            });

            socketInstance.on('reconnect_attempt', (attemptNumber) => {
                setReconnectAttempts(attemptNumber);
            });

            socketInstance.on('reconnect_error', (error) => {
                setConnectionError(error.message);
            });

            socketInstance.on('reconnect_failed', () => {
                setConnectionError('Failed to reconnect after multiple attempts');
            });

            socketInstance.on('error', (error) => {
                setConnectionError(error.message || 'Unknown socket error');
            });

            // Store the socket instance
            setSocket(socketInstance);
            return socketInstance;
        } catch (error) {
            setConnectionError(error.message);
            setConnected(false);
            return null;
        }
    }, [token, user, socket]);

    useEffect(() => {
        let socketInstance = connectSocket();

        // Cleanup on unmount
        return () => {
            if (socketInstance) {
                socketInstance.disconnect();
                setSocket(null);
                setConnected(false);
            }
        };
    }, [connectSocket]);

    // Join a PR room
    const joinPullRequest = (projectId, pullNumber) => {
        if (socket && connected) {
            socket.emit('join-pr', { projectId, pullNumber });
            return true;
        }
        return false;
    };

    // Leave a PR room
    const leavePullRequest = (projectId, pullNumber) => {
        if (socket && connected) {
            socket.emit('leave-pr', { projectId, pullNumber });
            return true;
        }
        return false;
    };

    // Subscribe to comment events
    const subscribeToComments = (projectId, pullNumber, callbacks) => {
        if (!socket || !connected) {
            return () => { };
        }

        // Join the PR room first
        joinPullRequest(projectId, pullNumber);

        // Clean up any existing listeners to prevent duplicates
        socket.off('comment-added');
        socket.off('comment-updated');
        socket.off('comment-deleted');
        socket.off('room-joined');

        // Listen for room joining confirmation
        socket.on('room-joined', (data) => {
            if (callbacks.onRoomJoined) {
                callbacks.onRoomJoined(data);
            }
        });

        // Subscribe to comment events
        socket.on('comment-added', (data) => {
            try {
                if (callbacks.onCommentAdded) callbacks.onCommentAdded(data);
            } catch (error) {
                console.error('Error handling comment-added event:', error);
            }
        });

        socket.on('comment-updated', (data) => {
            try {
                if (callbacks.onCommentUpdated) callbacks.onCommentUpdated(data);
            } catch (error) {
                console.error('Error handling comment-updated event:', error);
            }
        });

        socket.on('comment-deleted', (data) => {
            try {
                if (callbacks.onCommentDeleted) callbacks.onCommentDeleted(data);
            } catch (error) {
                console.error('Error handling comment-deleted event:', error);
            }
        });

        // Return cleanup function
        return () => {
            socket.off('comment-added');
            socket.off('comment-updated');
            socket.off('comment-deleted');
            socket.off('room-joined');
            leavePullRequest(projectId, pullNumber);
        };
    };

    const value = {
        socket,
        connected,
        connectionError,
        reconnectAttempts,
        joinPullRequest,
        leavePullRequest,
        subscribeToComments,
    };

    return (
        <SocketContext.Provider value={value}>
            {children}
        </SocketContext.Provider>
    );
};

export default SocketContext; 