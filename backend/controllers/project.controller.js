// controllers/project.controller.js
const Project = require('../models/project.model');
const Team = require('../models/team.model');

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
            .populate('teams.team', 'name description members')
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

        res.json(project);
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

        res.json(project);
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
