// routes/project.routes.js
const express = require('express');
const router = express.Router();
const projectController = require('../controllers/project.controller');
const authMiddleware = require('../middlewares/auth.middleware');
const adminMiddleware = require('../middlewares/admin.middleware');

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
 *     summary: Create a new project (Admin only)
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
 *         description: Admin privileges required
 *       500:
 *         description: Server error
 */
router.post('/', adminMiddleware, projectController.createProject);

/**
 * @swagger
 * /api/projects:
 *   get:
 *     summary: Get all projects
 *     tags: [Projects]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of all projects
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
 *     summary: Get project by ID
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
 *       404:
 *         description: Project not found
 *       500:
 *         description: Server error
 */
router.get('/:id', projectController.getProjectById);

/**
 * @swagger
 * /api/projects/{id}:
 *   put:
 *     summary: Update project by ID (Admin only)
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
 *         description: Admin privileges required
 *       404:
 *         description: Project not found
 *       500:
 *         description: Server error
 */
router.put('/:id', adminMiddleware, projectController.updateProject);

/**
 * @swagger
 * /api/projects/{id}:
 *   delete:
 *     summary: Delete project by ID (Admin only)
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
 *         description: Admin privileges required
 *       404:
 *         description: Project not found
 *       500:
 *         description: Server error
 */
router.delete('/:id', adminMiddleware, projectController.deleteProject);

/**
 * @swagger
 * /api/projects/{id}/teams:
 *   post:
 *     summary: Add team to project (Admin only)
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
 *                 description: Team ID
 *               accessLevel:
 *                 type: string
 *                 enum: [read, write, admin]
 *                 default: read
 *     responses:
 *       200:
 *         description: Team added to project successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Project'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Admin privileges required
 *       404:
 *         description: Project or team not found
 *       500:
 *         description: Server error
 */
router.post('/:id/teams', adminMiddleware, projectController.addTeam);

/**
 * @swagger
 * /api/projects/{id}/teams/{teamId}:
 *   delete:
 *     summary: Remove team from project (Admin only)
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
 *         description: Team ID to remove from the project
 *     responses:
 *       200:
 *         description: Team removed from project successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Project'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Admin privileges required
 *       404:
 *         description: Project or team not found
 *       500:
 *         description: Server error
 */
router.delete('/:id/teams/:teamId', adminMiddleware, projectController.removeTeam);

/**
 * @swagger
 * /api/projects/{id}/github:
 *   put:
 *     summary: Update GitHub repository information (Admin only)
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
 *               owner:
 *                 type: string
 *                 example: octocat
 *               repo:
 *                 type: string
 *                 example: hello-world
 *               url:
 *                 type: string
 *                 example: https://github.com/octocat/hello-world
 *     responses:
 *       200:
 *         description: GitHub repository information updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Project'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Admin privileges required
 *       404:
 *         description: Project not found
 *       500:
 *         description: Server error
 */
router.put('/:id/github', adminMiddleware, projectController.updateGithubRepo);

module.exports = router;
