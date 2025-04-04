const Project = require('../models/project.model');
const Team = require('../models/team.model');

/**
 * Middleware factory to check if a user has access to a specific resource
 * Regular users can only access resources they are a member of
 * Managers and admins have access to all resources
 */
const resourceAccessMiddleware = {
    /**
     * Check if user has access to the specified project
     */
    project: async (req, res, next) => {
        try {
            const projectId = req.params.id || req.params.projectId;

            // Managers and admins have full access
            if (req.user.role === 'admin' || req.user.role === 'manager') {
                return next();
            }

            const project = await Project.findById(projectId).populate('teams.team');

            if (!project) {
                return res.status(404).json({ message: 'Project not found' });
            }

            // Check if user is a member of any team associated with the project
            const userTeams = project.teams.map(t => t.team);
            const hasAccess = await Team.exists({
                _id: { $in: userTeams.map(team => team._id) },
                members: { $elemMatch: { user: req.user._id } }
            });

            if (!hasAccess) {
                return res.status(403).json({ message: 'You do not have access to this project' });
            }

            next();
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    },

    /**
     * Check if user has access to the specified team
     */
    team: async (req, res, next) => {
        try {
            const teamId = req.params.id || req.params.teamId;

            // Managers and admins have full access
            if (req.user.role === 'admin' || req.user.role === 'manager') {
                return next();
            }

            const team = await Team.findById(teamId);

            if (!team) {
                return res.status(404).json({ message: 'Team not found' });
            }

            // Check if user is a member of the team
            const isMember = team.members.some(member =>
                member.user.toString() === req.user._id.toString()
            );

            if (!isMember) {
                return res.status(403).json({ message: 'You do not have access to this team' });
            }

            next();
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    }
};

module.exports = resourceAccessMiddleware;
