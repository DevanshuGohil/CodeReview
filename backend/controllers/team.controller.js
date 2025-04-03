// controllers/team.controller.js
const Team = require('../models/team.model');
const User = require('../models/user.model');

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
        const teams = await Team.find()
            .populate('members.user', 'username email firstName lastName avatar')
            .populate('createdBy', 'username email');

        res.json(teams);
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
