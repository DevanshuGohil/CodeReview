const PRComment = require('../models/pr-comment.model');
const Project = require('../models/project.model');
const { getIO } = require('../socket');
const userActivityController = require('./user-activity.controller');

// Create a new comment
exports.createComment = async (req, res) => {
    try {
        const { projectId, pullNumber } = req.params;
        const { content, fileLocation, parentComment } = req.body;
        const userId = req.user.id;

        console.log(`[${new Date().toISOString()}] Creating comment in PR ${projectId}/${pullNumber} by user ${userId}`);

        // Validate that the project exists
        const project = await Project.findById(projectId);
        if (!project) {
            return res.status(404).json({ message: 'Project not found' });
        }

        // Create new comment
        const comment = new PRComment({
            user: userId,
            project: projectId,
            pullRequestNumber: parseInt(pullNumber),
            content,
            fileLocation,
            parentComment: parentComment || null,
        });

        await comment.save();

        // Track user activity
        await userActivityController.trackActivity(userId, 'pr_comment', {
            project: projectId,
            pullRequestNumber: parseInt(pullNumber),
            details: {
                isReply: !!parentComment,
                hasFileLocation: !!fileLocation,
                contentLength: content.length
            }
        });

        // Populate user data
        const populatedComment = await PRComment.findById(comment._id)
            .populate('user', 'username email firstName lastName avatar')
            .populate({
                path: 'parentComment',
                populate: { path: 'user', select: 'username firstName lastName avatar' }
            });

        // Emit socket event for real-time updates
        const io = getIO();
        const room = `pr:${projectId}:${pullNumber}`;

        // Get count of clients in the room
        const roomSockets = io.sockets.adapter.rooms.get(room);
        const numClients = roomSockets ? roomSockets.size : 0;

        console.log(`[${new Date().toISOString()}] Emitting comment-added event to room ${room} with ${numClients} client(s)`);

        // Use broadcast.to to send to all clients EXCEPT the sender
        // io.to(room).emit('comment-added', populatedComment);

        // Use io.in or io.to to send to ALL clients including the sender
        io.in(room).emit('comment-added', populatedComment);

        console.log(`[${new Date().toISOString()}] Comment created successfully: ${comment._id}`);

        res.status(201).json(populatedComment);
    } catch (error) {
        console.error('Error creating comment:', error.message);
        res.status(500).json({ error: error.message });
    }
};

// Get all comments for a PR
exports.getCommentsByPR = async (req, res) => {
    try {
        const { projectId, pullNumber } = req.params;

        // Validate that the project exists
        const project = await Project.findById(projectId);
        if (!project) {
            return res.status(404).json({ message: 'Project not found' });
        }

        // Find all comments for this PR, excluding deleted ones
        const comments = await PRComment.find({
            project: projectId,
            pullRequestNumber: parseInt(pullNumber),
            isDeleted: false
        })
            .populate('user', 'username email firstName lastName avatar')
            .populate({
                path: 'parentComment',
                populate: { path: 'user', select: 'username firstName lastName avatar' }
            })
            .sort({ createdAt: 1 }); // Sort by creation time

        res.json(comments);
    } catch (error) {
        console.error('Error fetching comments:', error.message);
        res.status(500).json({ error: error.message });
    }
};

// Update a comment
exports.updateComment = async (req, res) => {
    try {
        const { commentId } = req.params;
        const { content } = req.body;
        const userId = req.user.id;

        // Find the comment
        const comment = await PRComment.findById(commentId);
        if (!comment) {
            return res.status(404).json({ message: 'Comment not found' });
        }

        // Check if the user is the comment owner
        if (comment.user.toString() !== userId) {
            return res.status(403).json({ message: 'You can only edit your own comments' });
        }

        // Update the comment
        comment.content = content;
        comment.isEdited = true;
        comment.updatedAt = Date.now();
        await comment.save();

        // Populate user data
        const populatedComment = await PRComment.findById(comment._id)
            .populate('user', 'username email firstName lastName avatar')
            .populate({
                path: 'parentComment',
                populate: { path: 'user', select: 'username firstName lastName avatar' }
            });

        // Emit socket event for real-time updates
        const io = getIO();
        const room = `pr:${comment.project}:${comment.pullRequestNumber}`;

        // Get count of clients in the room
        const roomSockets = io.sockets.adapter.rooms.get(room);
        const numClients = roomSockets ? roomSockets.size : 0;

        console.log(`[${new Date().toISOString()}] Emitting comment-updated event to room ${room} with ${numClients} client(s)`);

        // Use io.in instead of io.to for consistency
        io.in(room).emit('comment-updated', populatedComment);

        console.log(`[${new Date().toISOString()}] Comment updated successfully: ${comment._id}`);

        res.json(populatedComment);
    } catch (error) {
        console.error('Error updating comment:', error.message);
        res.status(500).json({ error: error.message });
    }
};

// Delete a comment (soft delete)
exports.deleteComment = async (req, res) => {
    try {
        const { commentId } = req.params;
        const userId = req.user.id;

        // Find the comment
        const comment = await PRComment.findById(commentId);
        if (!comment) {
            return res.status(404).json({ message: 'Comment not found' });
        }

        // Check if the user is the comment owner
        if (comment.user.toString() !== userId) {
            return res.status(403).json({ message: 'You can only delete your own comments' });
        }

        // Soft delete the comment
        comment.isDeleted = true;
        comment.content = '[deleted]';
        comment.updatedAt = Date.now();
        await comment.save();

        // Emit socket event for real-time updates
        const io = getIO();
        const room = `pr:${comment.project}:${comment.pullRequestNumber}`;

        // Get count of clients in the room
        const roomSockets = io.sockets.adapter.rooms.get(room);
        const numClients = roomSockets ? roomSockets.size : 0;

        console.log(`[${new Date().toISOString()}] Emitting comment-deleted event to room ${room} with ${numClients} client(s)`);

        // Use io.in instead of io.to for consistency
        io.in(room).emit('comment-deleted', { commentId: comment._id });

        console.log(`[${new Date().toISOString()}] Comment deleted successfully: ${comment._id}`);

        res.json({ message: 'Comment deleted successfully' });
    } catch (error) {
        console.error('Error deleting comment:', error.message);
        res.status(500).json({ error: error.message });
    }
};

// Get replies to a comment
exports.getCommentReplies = async (req, res) => {
    try {
        const { commentId } = req.params;

        // Find replies to this comment
        const replies = await PRComment.find({
            parentComment: commentId,
            isDeleted: false
        })
            .populate('user', 'username email firstName lastName avatar')
            .sort({ createdAt: 1 });

        res.json(replies);
    } catch (error) {
        console.error('Error fetching comment replies:', error.message);
        res.status(500).json({ error: error.message });
    }
}; 