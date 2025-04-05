// server.js
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const http = require('http');
require('dotenv').config();

// Import Swagger
const { swaggerUi, swaggerDocs } = require('./swagger');

// Import Socket.IO setup
const { setupSocket } = require('./socket');

// Import routes
const authRoutes = require('./routes/auth.routes');
const userRoutes = require('./routes/user.routes');
const teamRoutes = require('./routes/team.routes');
const projectRoutes = require('./routes/project.routes');
const githubRoutes = require('./routes/github.routes');
const prReviewRoutes = require('./routes/pr-review.routes');
const prCommentRoutes = require('./routes/pr-comment.routes');

const app = express();
const PORT = process.env.PORT || 4000;

// Create HTTP server
const server = http.createServer(app);

// Initialize Socket.IO
setupSocket(server);

// Middleware
app.use(express.json({
    verify: (req, res, buf, encoding) => {
        if (req.headers['content-type'] && req.headers['content-type'].includes('multipart/form-data')) {
            req.skipBodyParser = true;
            return false;
        }
        return true;
    }
}));
app.use(express.urlencoded({ extended: true }));
app.use(cors());

// Request logging middleware
app.use((req, res, next) => {
    const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    const userAgent = req.headers['user-agent'] || 'Unknown';

    // Don't log health check requests if any
    if (req.path === '/health' || req.path === '/favicon.ico') {
        return next();
    }

    // Log the request
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path} | IP: ${ip} | User-Agent: ${userAgent.substring(0, 50)}${userAgent.length > 50 ? '...' : ''}`);

    // Log response when finished
    res.on('finish', () => {
        console.log(`[${new Date().toISOString()}] ${req.method} ${req.path} | Status: ${res.statusCode}`);
    });

    next();
});

// Swagger Documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/teams', teamRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/github', githubRoutes);
app.use('/api', prReviewRoutes);
app.use('/api', prCommentRoutes);

// Default route
app.get('/', (req, res) => {
    res.send('API is running. Visit <a href="/api-docs">API Documentation</a>');
});

// Connect to MongoDB and start server
const startApp = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/atlassian-clone');
        console.log('Connected to MongoDB');

        server.listen(PORT, '0.0.0.0', () => {
            console.log(`Server running on port ${PORT}`);
            console.log(`API Documentation available at http://localhost:${PORT}/api-docs`);
            console.log(`Server is accessible on your network at http://<your-ip-address>:${PORT}`);
        });
    } catch (error) {
        console.error('Failed to start the application:', error);
        process.exit(1);
    }
};

startApp();