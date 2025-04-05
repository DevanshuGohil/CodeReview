const PRReview = require('../models/pr-review.model');
const Project = require('../models/project.model');
const Team = require('../models/team.model');
const axios = require('axios');
const mongoose = require('mongoose');
const userActivityController = require('./user-activity.controller');

// Submit a PR review (approve or reject)
exports.submitReview = async (req, res) => {
    try {
        const { projectId, pullNumber } = req.params;
        const { approved, comment, teamId } = req.body;
        const userId = req.user.id;

        // Validate that the project exists
        const project = await Project.findById(projectId);
        if (!project) {
            return res.status(404).json({ message: 'Project not found' });
        }

        // Validate that the team exists and the user is a member
        const team = await Team.findById(teamId);
        if (!team) {
            return res.status(404).json({ message: 'Team not found' });
        }

        // Check if user is a member of the team
        const isMember = team.members.some(member => member.user.toString() === userId);
        if (!isMember) {
            return res.status(403).json({ message: 'You must be a member of the team to submit a review' });
        }

        // Check if the team is assigned to the project
        const isTeamInProject = project.teams.some(t => t.team.toString() === teamId);
        if (!isTeamInProject) {
            return res.status(403).json({ message: 'This team is not assigned to the project' });
        }

        // Fetch PR details from GitHub to validate that the PR exists
        const { owner, repo } = project.githubRepo;
        if (!owner || !repo) {
            return res.status(400).json({ message: 'Project has no GitHub repository configured' });
        }

        const githubToken = process.env.GITHUB_TOKEN;
        try {
            const prResponse = await axios.get(
                `https://api.github.com/repos/${owner}/${repo}/pulls/${pullNumber}`,
                {
                    headers: {
                        'Authorization': `token ${githubToken}`,
                        'Accept': 'application/vnd.github.v3+json'
                    }
                }
            );

            const pullRequestId = prResponse.data.id;

            // Upsert the review (create or update if exists)
            const review = await PRReview.findOneAndUpdate(
                {
                    user: userId,
                    project: projectId,
                    pullRequestNumber: pullNumber
                },
                {
                    user: userId,
                    project: projectId,
                    team: teamId,
                    pullRequestId,
                    pullRequestNumber: pullNumber,
                    approved,
                    comment,
                    updatedAt: Date.now()
                },
                { upsert: true, new: true }
            );

            // Track user activity
            await userActivityController.trackActivity(userId, 'pr_review', {
                project: projectId,
                team: teamId,
                pullRequestNumber: pullNumber,
                details: {
                    action: approved ? 'approved' : 'rejected',
                    prTitle: prResponse.data.title,
                    hasComment: !!comment
                }
            });

            // Return the review with populated user data
            const populatedReview = await PRReview.findById(review._id)
                .populate('user', 'username email firstName lastName avatar')
                .populate('team', 'name');

            res.json(populatedReview);
        } catch (error) {
            console.error('GitHub API Error:', error.response?.data || error.message);
            return res.status(error.response?.status || 500).json({
                message: error.response?.data?.message || 'Error fetching pull request data'
            });
        }
    } catch (error) {
        console.error('Error submitting review:', error.message);
        res.status(500).json({ error: error.message });
    }
};

// Get all reviews for a PR
exports.getReviewsByPR = async (req, res) => {
    try {
        const { projectId, pullNumber } = req.params;

        // Validate that the project exists
        const project = await Project.findById(projectId);
        if (!project) {
            return res.status(404).json({ message: 'Project not found' });
        }

        // Find all reviews for this PR
        const reviews = await PRReview.find({
            project: projectId,
            pullRequestNumber: pullNumber
        })
            .populate('user', 'username email firstName lastName avatar')
            .populate('team', 'name');

        res.json(reviews);
    } catch (error) {
        console.error('Error fetching reviews:', error.message);
        res.status(500).json({ error: error.message });
    }
};

// Check if a PR has been approved by at least one member from each team
exports.checkPRApprovalStatus = async (req, res) => {
    try {
        const { projectId, pullNumber } = req.params;

        // Validate that the project exists
        const project = await Project.findById(projectId)
            .populate('teams.team');

        if (!project) {
            return res.status(404).json({ message: 'Project not found' });
        }

        // Debug: Log project teams
        console.log('Project teams:', project.teams.map(t => ({
            id: t.team._id.toString(),
            name: t.team.name
        })));

        // If the project has no teams, it cannot be approved
        if (project.teams.length === 0) {
            return res.json({
                canMerge: false,
                message: 'Project has no teams assigned',
                teamApprovals: []
            });
        }

        // Find all reviews for this PR
        const reviews = await PRReview.find({
            project: projectId,
            pullRequestNumber: parseInt(pullNumber),
            approved: true
        })
            .populate('user', 'username email firstName lastName avatar')
            .populate('team', 'name');

        // Debug: Log reviews
        console.log('Approved reviews:', reviews.map(r => ({
            id: r._id.toString(),
            teamId: r.team._id ? r.team._id.toString() : r.team.toString(),
            teamName: r.team.name,
            username: r.user.username
        })));

        // Group approvals by team
        const teamApprovals = {};
        project.teams.forEach(teamData => {
            const teamId = teamData.team._id.toString();
            teamApprovals[teamId] = {
                teamId,
                teamName: teamData.team.name,
                approved: false,
                approvers: []
            };
        });

        // Mark teams that have at least one approval
        reviews.forEach(review => {
            // Convert ObjectId to string for comparison
            const teamId = review.team._id ? review.team._id.toString() : review.team.toString();
            console.log(`Review by ${review.user.username} for team ID: ${teamId}`);
            console.log(`Available teams: ${Object.keys(teamApprovals).join(', ')}`);

            if (teamApprovals[teamId]) {
                console.log(`Team ${teamApprovals[teamId].teamName} approved by ${review.user.username}`);
                teamApprovals[teamId].approved = true;
                teamApprovals[teamId].approvers.push({
                    userId: review.user._id,
                    username: review.user.username,
                    name: `${review.user.firstName} ${review.user.lastName}`
                });
            } else {
                console.log(`Team ID ${teamId} (${review.team.name}) not found in teamApprovals`);
            }
        });

        // Debug: Log final team approvals before sending
        console.log('Final team approvals:', Object.values(teamApprovals).map(t => ({
            team: t.teamName,
            approved: t.approved,
            approversCount: t.approvers.length
        })));

        // Check if all teams have at least one approval
        const allTeamsApproved = Object.values(teamApprovals).every(team => team.approved);

        res.json({
            canMerge: allTeamsApproved,
            message: allTeamsApproved
                ? 'All teams have approved this pull request'
                : 'Waiting for approvals from some teams',
            teamApprovals: Object.values(teamApprovals)
        });
    } catch (error) {
        console.error('Error checking PR approval status:', error.message);
        res.status(500).json({ error: error.message });
    }
};

// Get review by the current user for a specific PR
exports.getUserReviewForPR = async (req, res) => {
    try {
        const { projectId, pullNumber } = req.params;
        const userId = req.user.id;

        const review = await PRReview.findOne({
            user: userId,
            project: projectId,
            pullRequestNumber: pullNumber
        })
            .populate('team', 'name');

        if (!review) {
            return res.json({ exists: false });
        }

        res.json({
            exists: true,
            review
        });
    } catch (error) {
        console.error('Error fetching user review:', error.message);
        res.status(500).json({ error: error.message });
    }
};

// Merge a PR that has been approved
exports.mergePullRequest = async (req, res) => {
    try {
        const { projectId, pullNumber } = req.params;
        const { mergeMethod = 'merge', commitTitle, commitMessage } = req.body;

        // Validate that the project exists
        const project = await Project.findById(projectId);
        if (!project) {
            return res.status(404).json({ message: 'Project not found' });
        }

        // First check if the PR is approved by all teams
        const approvalStatus = await exports.checkPRApprovalStatus(
            { params: { projectId, pullNumber } },
            { json: data => data }
        );

        if (!approvalStatus.canMerge) {
            return res.status(403).json({
                message: 'Cannot merge this PR. Not all teams have approved it.',
                approvalStatus
            });
        }

        // Fetch PR details from GitHub to validate that the PR exists and is mergeable
        const { owner, repo } = project.githubRepo;
        if (!owner || !repo) {
            return res.status(400).json({ message: 'Project has no GitHub repository configured' });
        }

        const githubToken = process.env.GITHUB_TOKEN;
        try {
            // Perform the merge
            const mergeResponse = await axios.put(
                `https://api.github.com/repos/${owner}/${repo}/pulls/${pullNumber}/merge`,
                {
                    merge_method: mergeMethod,
                    commit_title: commitTitle,
                    commit_message: commitMessage
                },
                {
                    headers: {
                        'Authorization': `token ${githubToken}`,
                        'Accept': 'application/vnd.github.v3+json'
                    }
                }
            );

            res.json({
                merged: true,
                message: mergeResponse.data.message,
                sha: mergeResponse.data.sha
            });
        } catch (error) {
            console.error('GitHub API Error:', error.response?.data || error.message);
            return res.status(error.response?.status || 500).json({
                message: error.response?.data?.message || 'Error merging pull request',
                merged: false
            });
        }
    } catch (error) {
        console.error('Error merging PR:', error.message);
        res.status(500).json({ error: error.message });
    }
};

// Add new function to get PR activity summary
exports.getPRActivitySummary = async (req, res) => {
    try {
        const { timeframe = 'week' } = req.query;
        const userId = req.user.id;

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
            case 'week':
            default:
                startDate = new Date(now.setDate(now.getDate() - 7));
                break;
        }

        // Get summary data
        const summary = await PRReview.aggregate([
            {
                $match: {
                    createdAt: { $gte: startDate }
                }
            },
            {
                $group: {
                    _id: {
                        projectId: "$project",
                        approved: "$approved"
                    },
                    count: { $sum: 1 }
                }
            },
            {
                $group: {
                    _id: "$_id.projectId",
                    approvals: {
                        $sum: {
                            $cond: [{ $eq: ["$_id.approved", true] }, "$count", 0]
                        }
                    },
                    rejections: {
                        $sum: {
                            $cond: [{ $eq: ["$_id.approved", false] }, "$count", 0]
                        }
                    },
                    total: { $sum: "$count" }
                }
            },
            {
                $lookup: {
                    from: "projects",
                    localField: "_id",
                    foreignField: "_id",
                    as: "projectDetails"
                }
            },
            {
                $unwind: "$projectDetails"
            },
            {
                $project: {
                    _id: 0,
                    projectId: "$_id",
                    projectName: "$projectDetails.name",
                    approvals: 1,
                    rejections: 1,
                    total: 1,
                    approvalRate: {
                        $round: [
                            { $multiply: [{ $divide: ["$approvals", { $max: ["$total", 1] }] }, 100] },
                            1
                        ]
                    }
                }
            }
        ]);

        // Get average review time
        const averageReviewTime = await PRReview.aggregate([
            {
                $match: {
                    createdAt: { $gte: startDate }
                }
            },
            {
                $project: {
                    reviewTime: {
                        $subtract: ["$updatedAt", "$createdAt"]
                    }
                }
            },
            {
                $group: {
                    _id: null,
                    averageTime: { $avg: "$reviewTime" }
                }
            },
            {
                $project: {
                    _id: 0,
                    // Convert from milliseconds to hours
                    averageHours: {
                        $round: [{ $divide: ["$averageTime", 3600000] }, 1]
                    }
                }
            }
        ]);

        // Get user's personal stats
        const userStats = await PRReview.aggregate([
            {
                $match: {
                    user: mongoose.Types.ObjectId(userId),
                    createdAt: { $gte: startDate }
                }
            },
            {
                $group: {
                    _id: null,
                    totalReviews: { $sum: 1 },
                    approvals: {
                        $sum: {
                            $cond: [{ $eq: ["$approved", true] }, 1, 0]
                        }
                    },
                    rejections: {
                        $sum: {
                            $cond: [{ $eq: ["$approved", false] }, 1, 0]
                        }
                    }
                }
            },
            {
                $project: {
                    _id: 0,
                    totalReviews: 1,
                    approvals: 1,
                    rejections: 1,
                    approvalRate: {
                        $round: [
                            { $multiply: [{ $divide: ["$approvals", { $max: ["$totalReviews", 1] }] }, 100] },
                            1
                        ]
                    }
                }
            }
        ]);

        // Get team distribution stats
        const teamStats = await PRReview.aggregate([
            {
                $match: {
                    createdAt: { $gte: startDate }
                }
            },
            {
                $group: {
                    _id: "$team",
                    totalReviews: { $sum: 1 }
                }
            },
            {
                $lookup: {
                    from: "teams",
                    localField: "_id",
                    foreignField: "_id",
                    as: "teamDetails"
                }
            },
            {
                $unwind: "$teamDetails"
            },
            {
                $project: {
                    _id: 0,
                    teamId: "$_id",
                    teamName: "$teamDetails.name",
                    totalReviews: 1
                }
            },
            {
                $sort: { totalReviews: -1 }
            },
            {
                $limit: 5
            }
        ]);

        // Return the combined data
        res.json({
            timeframe,
            projectSummary: summary,
            averageReviewTime: averageReviewTime[0]?.averageHours || 0,
            userStats: userStats[0] || { totalReviews: 0, approvals: 0, rejections: 0, approvalRate: 0 },
            teamActivity: teamStats
        });
    } catch (error) {
        console.error('Error generating PR activity summary:', error.message);
        res.status(500).json({ error: error.message });
    }
};
