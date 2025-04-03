// routes/team.routes.js
const express = require('express');
const router = express.Router();
const teamController = require('../controllers/team.controller');
const authMiddleware = require('../middlewares/auth.middleware');
const adminMiddleware = require('../middlewares/admin.middleware');

// Apply auth middleware to all routes
router.use(authMiddleware);

// Team routes
router.post('/', adminMiddleware, teamController.createTeam);
router.get('/', teamController.getAllTeams);
router.get('/:id', teamController.getTeamById);
router.put('/:id', adminMiddleware, teamController.updateTeam);
router.delete('/:id', adminMiddleware, teamController.deleteTeam);
router.post('/:id/members', adminMiddleware, teamController.addMember);
router.delete('/:id/members/:userId', adminMiddleware, teamController.removeMember);

module.exports = router;
