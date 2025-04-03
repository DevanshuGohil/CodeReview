// routes/project.routes.js
const express = require('express');
const router = express.Router();
const projectController = require('../controllers/project.controller');
const authMiddleware = require('../middlewares/auth.middleware');
const adminMiddleware = require('../middlewares/admin.middleware');

// Apply auth middleware to all routes
router.use(authMiddleware);

// Project routes
router.post('/', adminMiddleware, projectController.createProject);
router.get('/', projectController.getAllProjects);
router.get('/:id', projectController.getProjectById);
router.put('/:id', adminMiddleware, projectController.updateProject);
router.delete('/:id', adminMiddleware, projectController.deleteProject);
router.post('/:id/teams', adminMiddleware, projectController.addTeam);
router.delete('/:id/teams/:teamId', adminMiddleware, projectController.removeTeam);
router.put('/:id/github', adminMiddleware, projectController.updateGithubRepo);

module.exports = router;
