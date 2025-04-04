// routes/team.routes.js
const express = require('express');
const router = express.Router();
const teamController = require('../controllers/team.controller');
const authMiddleware = require('../middlewares/auth.middleware');
const adminMiddleware = require('../middlewares/admin.middleware');
const managerMiddleware = require('../middlewares/manager.middleware');
const resourceAccessMiddleware = require('../middlewares/resource-access.middleware');

/**
 * @swagger
 * tags:
 *   name: Teams
 *   description: Team management
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     Team:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           description: The auto-generated ID
 *         name:
 *           type: string
 *           description: Team name
 *         description:
 *           type: string
 *           description: Team description
 *         members:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               user:
 *                 type: string
 *                 description: User ID
 *               role:
 *                 type: string
 *                 enum: [member, leader]
 *                 description: User's role in the team
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: When the team was created
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: When the team was last updated
 */

// Apply auth middleware to all routes
router.use(authMiddleware);

/**
 * @swagger
 * /api/teams:
 *   post:
 *     summary: Create a new team (Manager only)
 *     tags: [Teams]
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
 *             properties:
 *               name:
 *                 type: string
 *                 example: Development Team
 *               description:
 *                 type: string
 *                 example: Team responsible for application development
 *     responses:
 *       201:
 *         description: Team created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Team'
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Manager privileges required
 *       500:
 *         description: Server error
 */
router.post('/', managerMiddleware, teamController.createTeam);

/**
 * @swagger
 * /api/teams:
 *   get:
 *     summary: Get all teams (Managers see all, Users see only teams they belong to)
 *     tags: [Teams]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of teams
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Team'
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get('/', teamController.getAllTeams);

/**
 * @swagger
 * /api/teams/{id}:
 *   get:
 *     summary: Get team by ID (Managers see all, Users see only teams they belong to)
 *     tags: [Teams]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Team ID
 *     responses:
 *       200:
 *         description: Team data
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Team'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Access denied
 *       404:
 *         description: Team not found
 *       500:
 *         description: Server error
 */
router.get('/:id', resourceAccessMiddleware.team, teamController.getTeamById);

/**
 * @swagger
 * /api/teams/{id}:
 *   put:
 *     summary: Update team by ID (Manager only)
 *     tags: [Teams]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Team ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: Updated Team Name
 *               description:
 *                 type: string
 *                 example: Updated team description
 *     responses:
 *       200:
 *         description: Team updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Team'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Manager privileges required
 *       404:
 *         description: Team not found
 *       500:
 *         description: Server error
 */
router.put('/:id', managerMiddleware, teamController.updateTeam);

/**
 * @swagger
 * /api/teams/{id}:
 *   delete:
 *     summary: Delete team by ID (Manager only)
 *     tags: [Teams]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Team ID
 *     responses:
 *       200:
 *         description: Team deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Team deleted successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Manager privileges required
 *       404:
 *         description: Team not found
 *       500:
 *         description: Server error
 */
router.delete('/:id', managerMiddleware, teamController.deleteTeam);

/**
 * @swagger
 * /api/teams/{id}/members:
 *   post:
 *     summary: Add member to team (Manager only)
 *     tags: [Teams]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Team ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userId
 *             properties:
 *               userId:
 *                 type: string
 *                 example: 60d21b4667d0d8992e610c85
 *               role:
 *                 type: string
 *                 enum: [member, leader]
 *                 default: member
 *                 example: member
 *     responses:
 *       200:
 *         description: Member added successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Team'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Manager privileges required
 *       404:
 *         description: Team or user not found
 *       500:
 *         description: Server error
 */
router.post('/:id/members', managerMiddleware, teamController.addMember);

/**
 * @swagger
 * /api/teams/{id}/members/{userId}:
 *   delete:
 *     summary: Remove member from team (Manager only)
 *     tags: [Teams]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Team ID
 *       - in: path
 *         name: userId
 *         schema:
 *           type: string
 *         required: true
 *         description: User ID
 *     responses:
 *       200:
 *         description: Member removed successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Team'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Manager privileges required
 *       404:
 *         description: Team or user not found
 *       500:
 *         description: Server error
 */
router.delete('/:id/members/:userId', managerMiddleware, teamController.removeMember);

module.exports = router;
