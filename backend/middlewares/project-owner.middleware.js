// middlewares/project-owner.middleware.js
const Project = require('../models/project.model');
const Team = require('../models/team.model');

/**
 * Middleware to check if the user is the owner or has admin rights on a project
 * This allows only project admins/owners to perform sensitive operations
 */
module.exports = async (req, res, next) => {
    try {
        // Skip check for admin users
        if (req.user.role === 'admin') {
            return next();
        }

        const projectId = req.params.id || req.params.projectId;
        if (!projectId) {
            return res.status(400).json({ message: 'Project ID is required' });
        }

        // Get the project
        const project = await Project.findById(projectId);
        if (!project) {
            return res.status(404).json({ message: 'Project not found' });
        }

        // Get the user's teams
        const userTeams = await Team.find({
            'members.user': req.user.id
        });

        const userTeamIds = userTeams.map(team => team._id.toString());

        // Check if any of the user's teams have admin access to the project
        const hasAdminAccess = project.teams.some(
            teamAccess =>
                userTeamIds.includes(teamAccess.team.toString()) &&
                teamAccess.accessLevel === 'admin'
        );

        if (hasAdminAccess) {
            return next();
        }

        // No admin access found
        return res.status(403).json({
            message: 'You need to be a project admin to perform this action'
        });
    } catch (error) {
        console.error('Project owner middleware error:', error);
        return res.status(500).json({ message: 'Server error' });
    }
}; 