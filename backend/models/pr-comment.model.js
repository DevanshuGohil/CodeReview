const mongoose = require('mongoose');

const PRCommentSchema = new mongoose.Schema({
    // Comment owner
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },

    // Project and PR info
    project: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Project',
        required: true
    },
    pullRequestNumber: {
        type: Number,
        required: true
    },

    // Comment content
    content: {
        type: String,
        required: true
    },

    // Location info (optional)
    fileLocation: {
        path: String,
        line: Number
    },

    // Parent comment (for replies)
    parentComment: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'PRComment',
        default: null
    },

    // Timestamps
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    },

    // Comment status
    isEdited: {
        type: Boolean,
        default: false
    },
    isDeleted: {
        type: Boolean,
        default: false
    }
});

// Index for quick lookups by PR
PRCommentSchema.index({ project: 1, pullRequestNumber: 1 });

module.exports = mongoose.model('PRComment', PRCommentSchema); 