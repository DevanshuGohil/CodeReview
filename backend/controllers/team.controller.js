// controllers/team.controller.js
const Team = require('../models/team.model');
const User = require('../models/user.model');
const mongoose = require('mongoose');

exports.createTeam = async (req, res) => {
    try {
        const { name, description, members } = req.body;

        const team = new Team({
            name,
            description,
            members: members || [],
            createdBy: req.user.id
        });

        await team.save();

        res.status(201).json(team);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.getAllTeams = async (req, res) => {
    try {
        // Managers and admins can see all teams
        if (req.user.role === 'admin' || req.user.role === 'manager') {
            const teams = await Team.find()
                .populate('members.user', 'username email firstName lastName avatar')
                .populate('createdBy', 'username email');

            return res.json(teams);
        }

        // Regular users can only see teams they're a member of
        const userTeams = await Team.find({
            'members.user': req.user._id
        })
            .populate('members.user', 'username email firstName lastName avatar')
            .populate('createdBy', 'username email');

        res.json(userTeams);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.getTeamById = async (req, res) => {
    try {
        const team = await Team.findById(req.params.id)
            .populate('members.user', 'username email firstName lastName avatar')
            .populate('createdBy', 'username email');

        if (!team) {
            return res.status(404).json({ message: 'Team not found' });
        }

        res.json(team);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.updateTeam = async (req, res) => {
    try {
        const { name, description } = req.body;

        const team = await Team.findById(req.params.id);

        if (!team) {
            return res.status(404).json({ message: 'Team not found' });
        }

        team.name = name || team.name;
        team.description = description || team.description;
        team.updatedAt = Date.now();

        await team.save();

        res.json(team);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.deleteTeam = async (req, res) => {
    try {
        const team = await Team.findById(req.params.id);

        if (!team) {
            return res.status(404).json({ message: 'Team not found' });
        }

        await team.remove();

        res.json({ message: 'Team deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.addMember = async (req, res) => {
    try {
        const { userId, role } = req.body;

        const team = await Team.findById(req.params.id);

        if (!team) {
            return res.status(404).json({ message: 'Team not found' });
        }

        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Check if user is already a member
        const existingMember = team.members.find(
            member => member.user.toString() === userId
        );

        if (existingMember) {
            return res.status(400).json({ message: 'User is already a member of this team' });
        }

        team.members.push({ user: userId, role: role || 'member' });
        team.updatedAt = Date.now();

        await team.save();

        // Fetch the updated team with populated user data
        const updatedTeam = await Team.findById(req.params.id)
            .populate('members.user', 'username email firstName lastName avatar')
            .populate('createdBy', 'username email');

        res.json(updatedTeam);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.removeMember = async (req, res) => {
    try {
        const { id, userId } = req.params;

        const team = await Team.findById(id);

        if (!team) {
            return res.status(404).json({ message: 'Team not found' });
        }

        team.members = team.members.filter(
            member => member.user.toString() !== userId
        );
        team.updatedAt = Date.now();

        await team.save();

        // Fetch the updated team with populated user data
        const updatedTeam = await Team.findById(id)
            .populate('members.user', 'username email firstName lastName avatar')
            .populate('createdBy', 'username email');

        res.json(updatedTeam);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Add a new function to get team collaboration metrics
exports.getTeamCollaborationMetrics = async (req, res) => {
    try {
        const { teamId } = req.params;
        const { timeframe = 'month' } = req.query;

        // Calculate date range based on timeframe
        const now = new Date();
        let startDate;

        switch (timeframe) {
            case 'week':
                startDate = new Date(now.setDate(now.getDate() - 7));
                break;
            case 'year':
                startDate = new Date(now.setFullYear(now.getFullYear() - 1));
                break;
            case 'month':
            default:
                startDate = new Date(now.setMonth(now.getMonth() - 1));
                break;
        }

        // First check if the team exists
        const team = await Team.findById(teamId)
            .populate('members.user', 'username firstName lastName email avatar');

        if (!team) {
            return res.status(404).json({ message: 'Team not found' });
        }

        // Get the IDs of all members in the team
        const memberIds = team.members.map(member =>
            member.user._id || member.user
        );

        // Get all reviews by team members
        const PRReview = mongoose.model('PRReview');
        const memberReviews = await PRReview.aggregate([
            {
                $match: {
                    user: { $in: memberIds.map(id => mongoose.Types.ObjectId(id)) },
                    createdAt: { $gte: startDate }
                }
            },
            {
                $group: {
                    _id: '$user',
                    totalReviews: { $sum: 1 },
                    approvals: {
                        $sum: { $cond: [{ $eq: ['$approved', true] }, 1, 0] }
                    },
                    rejections: {
                        $sum: { $cond: [{ $eq: ['$approved', false] }, 1, 0] }
                    },
                    // Calculate average response time
                    avgResponseTimeMs: {
                        $avg: { $subtract: ['$updatedAt', '$createdAt'] }
                    }
                }
            },
            {
                $lookup: {
                    from: 'users',
                    localField: '_id',
                    foreignField: '_id',
                    as: 'userDetails'
                }
            },
            {
                $unwind: '$userDetails'
            },
            {
                $project: {
                    _id: 0,
                    userId: '$_id',
                    username: '$userDetails.username',
                    name: {
                        $concat: [
                            { $ifNull: ['$userDetails.firstName', ''] },
                            ' ',
                            { $ifNull: ['$userDetails.lastName', ''] }
                        ]
                    },
                    avatar: '$userDetails.avatar',
                    totalReviews: 1,
                    approvals: 1,
                    rejections: 1,
                    // Convert ms to hours
                    avgResponseTimeHours: {
                        $round: [{ $divide: ['$avgResponseTimeMs', 3600000] }, 1]
                    },
                    // Calculate approval rate
                    approvalRate: {
                        $round: [
                            { $multiply: [{ $divide: ['$approvals', { $max: ['$totalReviews', 1] }] }, 100] },
                            1
                        ]
                    }
                }
            },
            {
                $sort: { totalReviews: -1 }
            }
        ]);

        // Calculate team-level metrics
        const teamStats = memberReviews.reduce((acc, member) => {
            acc.totalReviews += member.totalReviews;
            acc.approvals += member.approvals;
            acc.rejections += member.rejections;
            return acc;
        }, { totalReviews: 0, approvals: 0, rejections: 0 });

        // Calculate team averages
        teamStats.avgReviewsPerMember = memberIds.length ?
            parseFloat((teamStats.totalReviews / memberIds.length).toFixed(1)) : 0;

        teamStats.approvalRate = teamStats.totalReviews ?
            parseFloat(((teamStats.approvals / teamStats.totalReviews) * 100).toFixed(1)) : 0;

        // Calculate collaboration score (0-100) based on:
        // - Review distribution (higher is better)
        // - Total review count (higher is better)
        // - Response time (lower is better)
        const reviewDistribution = calculateGiniCoefficient(
            memberReviews.map(m => m.totalReviews)
        );

        // Normalize metrics for scoring
        const distributionScore = (1 - reviewDistribution) * 100; // Lower Gini is better
        const volumeScore = Math.min(teamStats.avgReviewsPerMember * 10, 100); // Cap at 100

        // Calculate final score (weighted average)
        teamStats.collaborationScore = Math.round(
            (distributionScore * 0.6) + (volumeScore * 0.4)
        );

        // Return the team metrics
        res.json({
            teamId,
            teamName: team.name,
            timeframe,
            startDate,
            teamStats,
            memberStats: memberReviews,
            reviewDistribution: (1 - reviewDistribution).toFixed(2) // 0-1 where 1 is perfectly even
        });

    } catch (error) {
        console.error('Error fetching team collaboration metrics:', error);
        res.status(500).json({ error: error.message });
    }
};

// Helper function to calculate Gini coefficient (measure of inequality)
// Returns a value between 0 (perfect equality) and 1 (perfect inequality)
function calculateGiniCoefficient(values) {
    if (!values || values.length === 0) return 0;

    // If everyone has 0 reviews, equality is perfect
    if (values.every(v => v === 0)) return 0;

    // Sort values in ascending order
    values.sort((a, b) => a - b);

    let cumulativeSum = 0;
    let cumulativePopulation = 0;
    const totalPopulation = values.length;
    const totalSum = values.reduce((sum, value) => sum + value, 0);

    // Calculate Gini using Lorenz curve
    let giniNumerator = 0;

    for (let i = 0; i < totalPopulation; i++) {
        cumulativePopulation = (i + 1) / totalPopulation;
        cumulativeSum += values[i];
        const cumulativeIncomeShare = cumulativeSum / totalSum;
        giniNumerator += cumulativePopulation - cumulativeIncomeShare;
    }

    return giniNumerator / 0.5; // Normalize by maximum possible inequality
}
