// routes/project.routes.js
const express = require('express');
const router = express.Router();
const projectController = require('../controllers/project.controller');
const authMiddleware = require('../middlewares/auth.middleware');
const adminMiddleware = require('../middlewares/admin.middleware');
const managerMiddleware = require('../middlewares/manager.middleware');
const resourceAccessMiddleware = require('../middlewares/resource-access.middleware');
const projectOwnerMiddleware = require('../middlewares/project-owner.middleware');

/**
 * @swagger
 * tags:
 *   name: Projects
 *   description: Project management
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     Project:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           description: The auto-generated ID
 *         name:
 *           type: string
 *           description: Project name
 *         key:
 *           type: string
 *           description: Project key (short identifier)
 *         description:
 *           type: string
 *           description: Project description
 *         teams:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               team:
 *                 type: string
 *                 description: Team ID
 *               accessLevel:
 *                 type: string
 *                 enum: [read, write, admin]
 *                 description: Team's access level to the project
 *         githubRepo:
 *           type: object
 *           properties:
 *             owner:
 *               type: string
 *               description: GitHub repository owner
 *             repo:
 *               type: string
 *               description: GitHub repository name
 *             url:
 *               type: string
 *               description: GitHub repository URL
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: When the project was created
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: When the project was last updated
 */

// Apply auth middleware to all routes
router.use(authMiddleware);

/**
 * @swagger
 * /api/projects:
 *   post:
 *     summary: Create a new project (Manager only)
 *     tags: [Projects]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - key
 *             properties:
 *               name:
 *                 type: string
 *                 example: New Project
 *               key:
 *                 type: string
 *                 example: PROJ
 *               description:
 *                 type: string
 *                 example: A new project description
 *               teams:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     team:
 *                       type: string
 *                       description: Team ID
 *                     accessLevel:
 *                       type: string
 *                       enum: [read, write, admin]
 *                       default: read
 *               githubRepo:
 *                 type: object
 *                 properties:
 *                   owner:
 *                     type: string
 *                     example: octocat
 *                   repo:
 *                     type: string
 *                     example: hello-world
 *                   url:
 *                     type: string
 *                     example: https://github.com/octocat/hello-world
 *     responses:
 *       201:
 *         description: Project created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Project'
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Manager privileges required
 *       500:
 *         description: Server error
 */
router.post('/', managerMiddleware, projectController.createProject);

/**
 * @swagger
 * /api/projects:
 *   get:
 *     summary: Get all projects (Managers see all, Users see only projects they're part of)
 *     tags: [Projects]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of projects
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Project'
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get('/', projectController.getAllProjects);

/**
 * @swagger
 * /api/projects/{id}:
 *   get:
 *     summary: Get project by ID (Managers see all, Users see only projects they're part of)
 *     tags: [Projects]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Project ID
 *     responses:
 *       200:
 *         description: Project data
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Project'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Access denied
 *       404:
 *         description: Project not found
 *       500:
 *         description: Server error
 */
router.get('/:id', resourceAccessMiddleware.project, projectController.getProjectById);

/**
 * @swagger
 * /api/projects/{id}:
 *   put:
 *     summary: Update project by ID (Manager only)
 *     tags: [Projects]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Project ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: Updated Project Name
 *               description:
 *                 type: string
 *                 example: Updated project description
 *     responses:
 *       200:
 *         description: Project updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Project'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Manager privileges required
 *       404:
 *         description: Project not found
 *       500:
 *         description: Server error
 */
router.put('/:id', managerMiddleware, projectController.updateProject);

/**
 * @swagger
 * /api/projects/{id}:
 *   delete:
 *     summary: Delete project by ID (Manager only)
 *     tags: [Projects]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Project ID
 *     responses:
 *       200:
 *         description: Project deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Project deleted successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Manager privileges required
 *       404:
 *         description: Project not found
 *       500:
 *         description: Server error
 */
router.delete('/:id', managerMiddleware, projectController.deleteProject);

/**
 * @swagger
 * /api/projects/{id}/teams:
 *   post:
 *     summary: Add team to project (Manager only)
 *     tags: [Projects]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Project ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - team
 *             properties:
 *               team:
 *                 type: string
 *                 example: 60d21b4667d0d8992e610c85
 *               accessLevel:
 *                 type: string
 *                 enum: [read, write, admin]
 *                 default: read
 *                 example: read
 *     responses:
 *       200:
 *         description: Team added successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Project'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Manager privileges required
 *       404:
 *         description: Project or team not found
 *       500:
 *         description: Server error
 */
router.post('/:id/teams', managerMiddleware, projectController.addTeam);

/**
 * @swagger
 * /api/projects/{id}/teams/{teamId}:
 *   delete:
 *     summary: Remove team from project (Manager only)
 *     tags: [Projects]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Project ID
 *       - in: path
 *         name: teamId
 *         schema:
 *           type: string
 *         required: true
 *         description: Team ID
 *     responses:
 *       200:
 *         description: Team removed successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Project'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Manager privileges required
 *       404:
 *         description: Project or team not found
 *       500:
 *         description: Server error
 */
router.delete('/:id/teams/:teamId', managerMiddleware, projectController.removeTeam);

/**
 * @swagger
 * /api/projects/{id}/github:
 *   put:
 *     summary: Update GitHub repository for project (Manager only)
 *     tags: [Projects]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Project ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - owner
 *               - repo
 *             properties:
 *               owner:
 *                 type: string
 *                 example: octocat
 *               repo:
 *                 type: string
 *                 example: hello-world
 *     responses:
 *       200:
 *         description: GitHub repository updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Project'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Manager privileges required
 *       404:
 *         description: Project not found
 *       500:
 *         description: Server error
 */
router.put('/:id/github', managerMiddleware, projectController.updateGithubRepo);

/**
 * @swagger
 * /api/projects/{projectId}:
 *   get:
 *     summary: Get project details
 *     tags: [Projects]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: projectId
 *         schema:
 *           type: string
 *         required: true
 *         description: Project ID
 *     responses:
 *       200:
 *         description: Project details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Project'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Access denied
 *       404:
 *         description: Project not found
 *       500:
 *         description: Server error
 */
router.get('/:projectId', resourceAccessMiddleware.project, projectController.getProjectById);

/**
 * @swagger
 * /api/projects/{projectId}:
 *   put:
 *     summary: Update project
 *     tags: [Projects]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: projectId
 *         schema:
 *           type: string
 *         required: true
 *         description: Project ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: Updated Project Name
 *               description:
 *                 type: string
 *                 example: Updated project description
 *     responses:
 *       200:
 *         description: Project updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Project'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Access denied
 *       404:
 *         description: Project not found
 *       500:
 *         description: Server error
 */
router.put('/:projectId', [authMiddleware, projectOwnerMiddleware], projectController.updateProject);

/**
 * @swagger
 * /api/projects/{projectId}:
 *   delete:
 *     summary: Delete project
 *     tags: [Projects]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: projectId
 *         schema:
 *           type: string
 *         required: true
 *         description: Project ID
 *     responses:
 *       200:
 *         description: Project deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Project deleted successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Access denied
 *       404:
 *         description: Project not found
 *       500:
 *         description: Server error
 */
router.delete('/:projectId', [authMiddleware, projectOwnerMiddleware], projectController.deleteProject);

/**
 * @swagger
 * /api/projects/{projectId}/health-metrics:
 *   get:
 *     summary: Get project health metrics
 *     tags: [Projects]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: projectId
 *         schema:
 *           type: string
 *         required: true
 *         description: Project ID
 *     responses:
 *       200:
 *         description: Project health metrics
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Access denied
 *       404:
 *         description: Project not found
 *       500:
 *         description: Server error
 */
router.get('/:projectId/health-metrics', authMiddleware, projectController.getProjectHealthMetrics);

module.exports = router;
