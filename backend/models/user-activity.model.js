const mongoose = require('mongoose');

const UserActivitySchema = new mongoose.Schema({
    // User who performed the activity
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },

    // Activity type
    type: {
        type: String,
        enum: [
            'pr_approval',    // PR approved
            'pr_rejection',   // PR changes requested
            'pr_comment',     // PR comment
            'project_creation', // Created a project
            'team_join',      // Joined a team
            'login'           // User login
        ],
        required: true
    },

    // Related entities
    details: {
        // For PR-related activities
        pull: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'PR'
        },
        prNumber: Number,
        title: String,
        project: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Project'
        },
        projectName: String,

        // For team-related activities
        team: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Team'
        },
        teamName: String
    },

    // Timestamp
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Add indexes for efficient querying
UserActivitySchema.index({ user: 1, createdAt: -1 });
UserActivitySchema.index({ 'details.project': 1, createdAt: -1 });
UserActivitySchema.index({ 'details.team': 1, createdAt: -1 });

module.exports = mongoose.model('UserActivity', UserActivitySchema); 