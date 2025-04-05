const UserActivity = require('../models/user-activity.model');
const mongoose = require('mongoose');

// Track user activity
exports.trackActivity = async (userId, activityType, data = {}) => {
    try {
        const activity = new UserActivity({
            user: userId,
            activityType,
            ...data
        });

        await activity.save();
        return true;
    } catch (error) {
        console.error('Error tracking user activity:', error);
        return false;
    }
};

// Get user activity feed
exports.getUserActivityFeed = async (req, res) => {
    try {
        const userId = req.user.id;
        const { timeframe = 'week', limit = 20 } = req.query;

        // Calculate date range based on timeframe
        const now = new Date();
        let startDate;

        switch (timeframe) {
            case 'day':
                startDate = new Date(now.setDate(now.getDate() - 1));
                break;
            case 'month':
                startDate = new Date(now.setMonth(now.getMonth() - 1));
                break;
            case 'all':
                startDate = new Date(0); // Beginning of time
                break;
            case 'week':
            default:
                startDate = new Date(now.setDate(now.getDate() - 7));
                break;
        }

        // Fetch user activities
        const activities = await UserActivity.find({
            user: userId,
            createdAt: { $gte: startDate }
        })
            .sort({ createdAt: -1 })
            .limit(parseInt(limit))
            .populate('project', 'name key')
            .populate('team', 'name')
            .populate('user', 'username firstName lastName avatar');

        // Format activities for response
        const formattedActivities = activities.map(activity => {
            const formattedActivity = {
                id: activity._id,
                type: activity.activityType,
                timestamp: activity.createdAt,
                user: {
                    id: activity.user._id,
                    username: activity.user.username,
                    name: `${activity.user.firstName || ''} ${activity.user.lastName || ''}`.trim() || activity.user.username,
                    avatar: activity.user.avatar
                }
            };

            // Add related entity details based on activity type
            if (activity.project) {
                formattedActivity.project = {
                    id: activity.project._id,
                    name: activity.project.name,
                    key: activity.project.key
                };
            }

            if (activity.team) {
                formattedActivity.team = {
                    id: activity.team._id,
                    name: activity.team.name
                };
            }

            if (activity.pullRequestNumber) {
                formattedActivity.pullRequest = {
                    number: activity.pullRequestNumber
                };
            }

            // Add specific details from the details field
            if (activity.details) {
                formattedActivity.details = activity.details;
            }

            return formattedActivity;
        });

        res.json({
            timeframe,
            count: formattedActivities.length,
            activities: formattedActivities
        });
    } catch (error) {
        console.error('Error fetching user activity feed:', error);
        res.status(500).json({ error: error.message });
    }
};

// Get team activity feed
exports.getTeamActivityFeed = async (req, res) => {
    try {
        const { teamId } = req.params;
        const { timeframe = 'week', limit = 20 } = req.query;

        // Check if teamId is valid
        if (!mongoose.Types.ObjectId.isValid(teamId)) {
            return res.status(400).json({ error: 'Invalid team ID' });
        }

        // Calculate date range based on timeframe
        const now = new Date();
        let startDate;

        switch (timeframe) {
            case 'day':
                startDate = new Date(now.setDate(now.getDate() - 1));
                break;
            case 'month':
                startDate = new Date(now.setMonth(now.getMonth() - 1));
                break;
            case 'all':
                startDate = new Date(0); // Beginning of time
                break;
            case 'week':
            default:
                startDate = new Date(now.setDate(now.getDate() - 7));
                break;
        }

        // Fetch team activities
        const activities = await UserActivity.find({
            team: teamId,
            createdAt: { $gte: startDate }
        })
            .sort({ createdAt: -1 })
            .limit(parseInt(limit))
            .populate('project', 'name key')
            .populate('team', 'name')
            .populate('user', 'username firstName lastName avatar');

        // Format activities for response (similar to user activities)
        const formattedActivities = activities.map(activity => {
            const formattedActivity = {
                id: activity._id,
                type: activity.activityType,
                timestamp: activity.createdAt,
                user: {
                    id: activity.user._id,
                    username: activity.user.username,
                    name: `${activity.user.firstName || ''} ${activity.user.lastName || ''}`.trim() || activity.user.username,
                    avatar: activity.user.avatar
                }
            };

            if (activity.project) {
                formattedActivity.project = {
                    id: activity.project._id,
                    name: activity.project.name,
                    key: activity.project.key
                };
            }

            if (activity.team) {
                formattedActivity.team = {
                    id: activity.team._id,
                    name: activity.team.name
                };
            }

            if (activity.pullRequestNumber) {
                formattedActivity.pullRequest = {
                    number: activity.pullRequestNumber
                };
            }

            if (activity.details) {
                formattedActivity.details = activity.details;
            }

            return formattedActivity;
        });

        res.json({
            teamId,
            timeframe,
            count: formattedActivities.length,
            activities: formattedActivities
        });
    } catch (error) {
        console.error('Error fetching team activity feed:', error);
        res.status(500).json({ error: error.message });
    }
};

// Get user activities with timeframe filter
exports.getUserActivities = async (req, res) => {
    try {
        const { timeframe = 'week' } = req.query;
        const userId = req.user.id;

        // Calculate the filter date based on timeframe
        let filterDate = null;
        const now = new Date();

        if (timeframe !== 'all') {
            filterDate = new Date();

            switch (timeframe) {
                case 'day':
                    filterDate.setDate(now.getDate() - 1);
                    break;
                case 'week':
                    filterDate.setDate(now.getDate() - 7);
                    break;
                case 'month':
                    filterDate.setMonth(now.getMonth() - 1);
                    break;
                default:
                    filterDate = null;
            }
        }

        // Create query
        const query = { user: userId };
        if (filterDate) {
            query.createdAt = { $gte: filterDate };
        }

        // Get activities
        const activities = await UserActivity.find(query)
            .sort({ createdAt: -1 })
            .limit(50);

        res.json(activities);
    } catch (error) {
        console.error('Error in getUserActivities:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Get team activities with timeframe filter
exports.getTeamActivities = async (req, res) => {
    try {
        const { teamId } = req.params;
        const { timeframe = 'week' } = req.query;
        const userId = req.user.id;

        // Check if user is part of team
        const Team = require('../models/team.model');
        const team = await Team.findOne({
            _id: teamId,
            'members.user': userId
        });

        if (!team) {
            return res.status(403).json({ message: 'You are not a member of this team' });
        }

        // Calculate the filter date based on timeframe
        let filterDate = null;
        const now = new Date();

        if (timeframe !== 'all') {
            filterDate = new Date();

            switch (timeframe) {
                case 'day':
                    filterDate.setDate(now.getDate() - 1);
                    break;
                case 'week':
                    filterDate.setDate(now.getDate() - 7);
                    break;
                case 'month':
                    filterDate.setMonth(now.getMonth() - 1);
                    break;
                default:
                    filterDate = null;
            }
        }

        // Get all users in the team
        const teamUserIds = team.members.map(member => member.user);

        // Create query
        const query = { user: { $in: teamUserIds } };
        if (filterDate) {
            query.createdAt = { $gte: filterDate };
        }

        // Get activities
        const activities = await UserActivity.find(query)
            .sort({ createdAt: -1 })
            .limit(50)
            .populate('user', 'username firstName lastName avatar');

        res.json(activities);
    } catch (error) {
        console.error('Error in getTeamActivities:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Track new activity (to be called from other controllers)
exports.trackActivity = async (user, type, details = {}) => {
    try {
        const activity = new UserActivity({
            user,
            type,
            details
        });

        await activity.save();
        return activity;
    } catch (error) {
        console.error('Error tracking activity:', error);
        // Don't throw - activity tracking should never break the main flow
        return null;
    }
}; 