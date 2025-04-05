const socketio = require('socket.io');
const jwt = require('jsonwebtoken');
const User = require('./models/user.model');

// Socket.IO setup
let io;

const setupSocket = (server) => {
    try {
        // Initialize Socket.IO with CORS configuration
        io = socketio(server, {
            cors: {
                origin: '*',
                methods: ["GET", "POST", "OPTIONS"],
                credentials: true,
                allowedHeaders: ["Content-Type", "Authorization"]
            },
            pingTimeout: 60000,
            pingInterval: 25000
        });

        // Make io globally available
        global.io = io;

        // Middleware for authentication
        io.use(async (socket, next) => {
            try {
                const token = socket.handshake.auth.token;
                if (!token) {
                    return next(new Error('Authentication error: Token not provided'));
                }

                // Verify token
                const decoded = jwt.verify(token, process.env.JWT_SECRET);
                const user = await User.findById(decoded.id).select('-password');

                if (!user) {
                    return next(new Error('Authentication error: User not found'));
                }

                // Attach user to socket
                socket.user = user;
                next();
            } catch (error) {
                return next(new Error('Authentication error: ' + error.message));
            }
        });

        // Handle connection
        io.on('connection', (socket) => {
            // Join or leave PR rooms
            socket.on('join-pr', (data) => {
                try {
                    const { projectId, pullNumber } = data;
                    const roomName = `pr:${projectId}:${pullNumber}`;

                    // Leave any other PR rooms this socket might be in
                    Object.keys(socket.rooms).forEach(room => {
                        if (room !== socket.id && room.startsWith('pr:')) {
                            socket.leave(room);
                        }
                    });

                    // Join the new room
                    socket.join(roomName);

                    // Get the number of clients in this room
                    const room = io.sockets.adapter.rooms.get(roomName);
                    const clientCount = room ? room.size : 0;

                    // Notify the client that they've joined
                    socket.emit('room-joined', {
                        room: roomName,
                        clientCount,
                        timestamp: new Date().toISOString(),
                        socketId: socket.id
                    });
                } catch (err) {
                    socket.emit('error', { message: 'Failed to join PR room', error: err.message });
                }
            });

            socket.on('leave-pr', (data) => {
                try {
                    const { projectId, pullNumber } = data;
                    const roomName = `pr:${projectId}:${pullNumber}`;
                    socket.leave(roomName);
                } catch (err) {
                    // Just log error, no need to notify client
                }
            });

            // Disconnect handler
            socket.on('disconnect', () => {
                // Socket disconnected
            });
        });

        return io;
    } catch (error) {
        throw error;
    }
};

// Get the io instance
const getIO = () => {
    if (!io) {
        throw new Error('Socket.IO not initialized');
    }
    return io;
};

module.exports = { setupSocket, getIO }; 