const mongoose = require('mongoose');

const PRReviewSchema = new mongoose.Schema({
    // Review owner
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },

    // Project and team info
    project: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Project',
        required: true
    },
    team: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Team',
        required: true
    },

    // GitHub PR details
    pullRequestId: {
        type: Number,
        required: true
    },
    pullRequestNumber: {
        type: Number,
        required: true
    },

    // Review status
    approved: {
        type: Boolean,
        required: true
    },
    comment: {
        type: String
    },

    // Timestamps
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

// Compound index to ensure one review per user per PR
PRReviewSchema.index({ user: 1, project: 1, pullRequestNumber: 1 }, { unique: true });

module.exports = mongoose.model('PRReview', PRReviewSchema);
