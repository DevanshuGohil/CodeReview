// controllers/project.controller.js
const Project = require('../models/project.model');
const Team = require('../models/team.model');
const mongoose = require('mongoose');

exports.createProject = async (req, res) => {
    try {
        const { name, key, description, teams, githubRepo } = req.body;

        // Check if project with key already exists
        const existingProject = await Project.findOne({ key });

        if (existingProject) {
            return res.status(400).json({ message: 'Project with this key already exists' });
        }

        const project = new Project({
            name,
            key,
            description,
            teams: teams || [],
            githubRepo: githubRepo || {},
            createdBy: req.user.id
        });

        await project.save();

        res.status(201).json(project);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.getAllProjects = async (req, res) => {
    try {
        // Admins and managers can see all projects
        if (req.user.role === 'admin' || req.user.role === 'manager') {
            const projects = await Project.find()
                .populate('teams.team', 'name description')
                .populate('createdBy', 'username email');

            return res.json(projects);
        }

        // For regular users, only show projects where they're part of a team
        // First, find all teams the user is a member of
        const userTeams = await Team.find({
            'members.user': req.user._id
        }).select('_id');

        const userTeamIds = userTeams.map(team => team._id);

        // Then find projects that include those teams
        const userProjects = await Project.find({
            'teams.team': { $in: userTeamIds }
        })
            .populate('teams.team', 'name description')
            .populate('createdBy', 'username email');

        res.json(userProjects);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.getProjectById = async (req, res) => {
    try {
        const project = await Project.findById(req.params.id)
            .populate({
                path: 'teams.team',
                select: 'name description',
                populate: {
                    path: 'members.user',
                    select: 'username email firstName lastName avatar'
                }
            })
            .populate('createdBy', 'username email');

        if (!project) {
            return res.status(404).json({ message: 'Project not found' });
        }

        res.json(project);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.updateProject = async (req, res) => {
    try {
        const { name, description } = req.body;

        const project = await Project.findById(req.params.id);

        if (!project) {
            return res.status(404).json({ message: 'Project not found' });
        }

        project.name = name || project.name;
        project.description = description || project.description;
        project.updatedAt = Date.now();

        await project.save();

        res.json(project);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.deleteProject = async (req, res) => {
    try {
        const project = await Project.findById(req.params.id);

        if (!project) {
            return res.status(404).json({ message: 'Project not found' });
        }

        await project.remove();

        res.json({ message: 'Project deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.addTeam = async (req, res) => {
    try {
        const { team, accessLevel } = req.body;

        const project = await Project.findById(req.params.id);

        if (!project) {
            return res.status(404).json({ message: 'Project not found' });
        }

        const teamDoc = await Team.findById(team);

        if (!teamDoc) {
            return res.status(404).json({ message: 'Team not found' });
        }

        // Check if team is already added to the project
        const existingTeam = project.teams.find(
            t => t.team.toString() === team
        );

        if (existingTeam) {
            return res.status(400).json({ message: 'Team is already added to this project' });
        }

        project.teams.push({ team, accessLevel: accessLevel || 'read' });
        project.updatedAt = Date.now();

        await project.save();

        // Return fully populated project data
        const populatedProject = await Project.findById(req.params.id)
            .populate({
                path: 'teams.team',
                select: 'name description',
                populate: {
                    path: 'members.user',
                    select: 'username email firstName lastName avatar'
                }
            })
            .populate('createdBy', 'username email');

        res.json(populatedProject);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.removeTeam = async (req, res) => {
    try {
        const { id, teamId } = req.params;

        const project = await Project.findById(id);

        if (!project) {
            return res.status(404).json({ message: 'Project not found' });
        }

        project.teams = project.teams.filter(
            t => t.team.toString() !== teamId
        );
        project.updatedAt = Date.now();

        await project.save();

        // Return fully populated project data
        const populatedProject = await Project.findById(id)
            .populate({
                path: 'teams.team',
                select: 'name description',
                populate: {
                    path: 'members.user',
                    select: 'username email firstName lastName avatar'
                }
            })
            .populate('createdBy', 'username email');

        res.json(populatedProject);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.updateGithubRepo = async (req, res) => {
    try {
        const { owner, repo } = req.body;

        const project = await Project.findById(req.params.id);

        if (!project) {
            return res.status(404).json({ message: 'Project not found' });
        }

        // Create the URL from owner and repo
        const url = `https://github.com/${owner}/${repo}`;

        project.githubRepo = {
            owner,
            repo,
            url
        };
        project.updatedAt = Date.now();

        await project.save();

        res.json(project);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Add a new function to get project health metrics
exports.getProjectHealthMetrics = async (req, res) => {
    try {
        const { projectId } = req.params;
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

        // First check if the project exists
        const project = await Project.findById(projectId);
        if (!project) {
            return res.status(404).json({ message: 'Project not found' });
        }

        // Get data from PRs and reviews during the timeframe
        const PRReview = mongoose.model('PRReview');
        const PR = mongoose.model('PR');

        // Get all PRs for this project in the timeframe
        const prs = await PR.find({
            project: projectId,
            createdAt: { $gte: startDate }
        }).populate('user', 'username');

        // Get all reviews for PRs in this project in the timeframe
        const reviews = await PRReview.find({
            project: projectId,
            createdAt: { $gte: startDate }
        }).populate('user', 'username');

        // Calculate metrics
        const totalPRs = prs.length;
        const totalReviews = reviews.length;
        const mergedPRs = prs.filter(pr => pr.merged).length;
        const openPRs = prs.filter(pr => !pr.closed && !pr.merged).length;
        const closedPRs = prs.filter(pr => pr.closed && !pr.merged).length;

        // Calculate review times
        const reviewTimes = [];
        for (const pr of prs) {
            const prReviews = reviews.filter(r => r.pull.toString() === pr._id.toString());
            if (prReviews.length > 0) {
                // Calculate time to first review
                const firstReviewTime = Math.min(...prReviews.map(r =>
                    new Date(r.createdAt) - new Date(pr.createdAt)
                ));
                reviewTimes.push(firstReviewTime);
            }
        }

        // Calculate median review time
        let medianReviewTimeHours = 0;
        if (reviewTimes.length > 0) {
            reviewTimes.sort((a, b) => a - b);
            const midIndex = Math.floor(reviewTimes.length / 2);
            const medianMs = reviewTimes.length % 2 !== 0
                ? reviewTimes[midIndex]
                : (reviewTimes[midIndex - 1] + reviewTimes[midIndex]) / 2;
            medianReviewTimeHours = (medianMs / (1000 * 60 * 60)).toFixed(1);
        }

        // Calculate approval rate
        const approvedReviews = reviews.filter(r => r.approved).length;
        const approvalRate = totalReviews > 0
            ? parseFloat(((approvedReviews / totalReviews) * 100).toFixed(1))
            : 0;

        // Calculate PR throughput (PRs merged per day)
        const daysInTimeframe = (now - startDate) / (1000 * 60 * 60 * 24);
        const prThroughput = daysInTimeframe > 0
            ? parseFloat((mergedPRs / daysInTimeframe).toFixed(2))
            : 0;

        // Calculate PR size distribution
        const sizeDistribution = {
            small: 0,    // <50 lines
            medium: 0,   // 50-300 lines
            large: 0,    // 300-1000 lines
            xlarge: 0    // >1000 lines
        };

        for (const pr of prs) {
            const totalChanges = (pr.additions || 0) + (pr.deletions || 0);
            if (totalChanges < 50) {
                sizeDistribution.small++;
            } else if (totalChanges < 300) {
                sizeDistribution.medium++;
            } else if (totalChanges < 1000) {
                sizeDistribution.large++;
            } else {
                sizeDistribution.xlarge++;
            }
        }

        // Calculate PR cycle time (time from opened to merged)
        const cycleTimes = [];
        for (const pr of prs) {
            if (pr.merged && pr.mergedAt) {
                const cycleTime = new Date(pr.mergedAt) - new Date(pr.createdAt);
                cycleTimes.push(cycleTime);
            }
        }

        let medianCycleTimeHours = 0;
        if (cycleTimes.length > 0) {
            cycleTimes.sort((a, b) => a - b);
            const midIndex = Math.floor(cycleTimes.length / 2);
            const medianMs = cycleTimes.length % 2 !== 0
                ? cycleTimes[midIndex]
                : (cycleTimes[midIndex - 1] + cycleTimes[midIndex]) / 2;
            medianCycleTimeHours = (medianMs / (1000 * 60 * 60)).toFixed(1);
        }

        // Calculate project health score (0-100)
        // Factors: PR throughput, review time, approval rate, PR size

        // Review time score - lower is better (max score at ≤4 hours)
        const reviewTimeScore = 100 - Math.min(parseFloat(medianReviewTimeHours) * 5, 80);

        // Throughput score - higher is better (max score at ≥5 PRs per day)
        const throughputScore = Math.min(prThroughput * 20, 100);

        // Size distribution score - more small PRs is better
        const smallPRPercentage = totalPRs > 0
            ? (sizeDistribution.small + sizeDistribution.medium) / totalPRs * 100
            : 0;
        const sizeScore = Math.min(smallPRPercentage, 100);

        // Cycle time score - lower is better (max score at ≤24 hours)
        const cycleTimeScore = 100 - Math.min(parseFloat(medianCycleTimeHours) / 2, 80);

        // Calculate final health score (weighted average)
        const healthScore = Math.round(
            (reviewTimeScore * 0.25) +
            (throughputScore * 0.25) +
            (sizeScore * 0.25) +
            (cycleTimeScore * 0.25)
        );

        const metrics = {
            projectId,
            projectName: project.name,
            timeframe,
            startDate,
            healthScore,
            prMetrics: {
                totalPRs,
                mergedPRs,
                openPRs,
                closedPRs,
                medianCycleTimeHours,
                prThroughput,
                sizeDistribution
            },
            reviewMetrics: {
                totalReviews,
                medianReviewTimeHours,
                approvalRate,
                approvedReviews
            },
            // Add insights based on metrics
            insights: generateInsights({
                healthScore,
                reviewTimeScore,
                throughputScore,
                sizeScore,
                cycleTimeScore,
                medianReviewTimeHours,
                medianCycleTimeHours,
                prThroughput,
                sizeDistribution,
                totalPRs
            })
        };

        res.json(metrics);

    } catch (error) {
        console.error('Error fetching project health metrics:', error);
        res.status(500).json({ error: error.message });
    }
};

// Helper function to generate insights based on metrics
function generateInsights(metrics) {
    const insights = [];

    // Review time insights
    if (metrics.medianReviewTimeHours > 24) {
        insights.push({
            type: 'warning',
            message: 'PRs take more than a day to get first reviews',
            recommendation: 'Consider adding automated initial reviews or set team expectations for review times'
        });
    } else if (metrics.medianReviewTimeHours < 4) {
        insights.push({
            type: 'positive',
            message: 'PRs are being reviewed quickly',
            recommendation: 'Keep up the good work with responsive reviews'
        });
    }

    // PR size insights
    if (metrics.totalPRs > 0) {
        const largePRPercentage =
            (metrics.sizeDistribution.large + metrics.sizeDistribution.xlarge) / metrics.totalPRs * 100;

        if (largePRPercentage > 30) {
            insights.push({
                type: 'warning',
                message: 'Many large PRs detected',
                recommendation: 'Consider breaking down work into smaller, more reviewable PRs'
            });
        } else if (metrics.sizeDistribution.small / metrics.totalPRs > 0.6) {
            insights.push({
                type: 'positive',
                message: 'Most PRs are small and focused',
                recommendation: 'Small PRs help maintain review quality and speed'
            });
        }
    }

    // Throughput insights
    if (metrics.prThroughput < 0.5) {
        insights.push({
            type: 'warning',
            message: 'Low PR throughput',
            recommendation: 'Project might benefit from more frequent, smaller changes'
        });
    } else if (metrics.prThroughput > 3) {
        insights.push({
            type: 'positive',
            message: 'High PR throughput',
            recommendation: 'The team is shipping changes at a good pace'
        });
    }

    // Cycle time insights
    if (metrics.medianCycleTimeHours > 72) {
        insights.push({
            type: 'warning',
            message: 'PRs take a long time to merge',
            recommendation: 'Look for bottlenecks in the review process or consider smaller PRs'
        });
    } else if (metrics.medianCycleTimeHours < 24) {
        insights.push({
            type: 'positive',
            message: 'PRs move quickly from creation to merge',
            recommendation: 'Continue maintaining an efficient review process'
        });
    }

    // Overall health insights
    if (metrics.healthScore < 50) {
        insights.push({
            type: 'critical',
            message: 'Project health needs attention',
            recommendation: 'Focus on improving review times and PR size'
        });
    } else if (metrics.healthScore > 80) {
        insights.push({
            type: 'positive',
            message: 'Project is in excellent health',
            recommendation: 'Maintain current practices and share them with other teams'
        });
    }

    return insights;
}
