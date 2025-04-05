const express = require('express');
const router = express.Router();
const userActivityController = require('../controllers/user-activity.controller');
const authMiddleware = require('../middlewares/auth.middleware');

// Apply auth middleware to all routes
router.use(authMiddleware);

/**
 * @swagger
 * /api/activities/user:
 *   get:
 *     summary: Get current user's activities
 *     tags: [Activities]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: timeframe
 *         schema:
 *           type: string
 *           enum: [day, week, month, all]
 *         description: Timeframe for filtering activities
 *     responses:
 *       200:
 *         description: List of user activities
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get('/user', userActivityController.getUserActivities);

/**
 * @swagger
 * /api/activities/team/{teamId}:
 *   get:
 *     summary: Get team activities
 *     tags: [Activities]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: teamId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the team
 *       - in: query
 *         name: timeframe
 *         schema:
 *           type: string
 *           enum: [day, week, month, all]
 *         description: Timeframe for filtering activities
 *     responses:
 *       200:
 *         description: List of team activities
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Access denied
 *       404:
 *         description: Team not found
 *       500:
 *         description: Server error
 */
router.get('/team/:teamId', userActivityController.getTeamActivities);

module.exports = router; 