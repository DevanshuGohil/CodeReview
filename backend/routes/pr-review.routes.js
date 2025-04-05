const express = require('express');
const router = express.Router();
const prReviewController = require('../controllers/pr-review.controller');
const authMiddleware = require('../middlewares/auth.middleware');
const resourceAccessMiddleware = require('../middlewares/resource-access.middleware');

// Apply auth middleware to all routes
router.use(authMiddleware);

/**
 * @swagger
 * tags:
 *   name: PR Reviews
 *   description: Pull Request Review management
 */

/**
 * @swagger
 * /api/projects/{projectId}/pulls/{pullNumber}/reviews:
 *   get:
 *     summary: Get all reviews for a PR
 *     tags: [PR Reviews]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: projectId
 *         schema:
 *           type: string
 *         required: true
 *         description: Project ID
 *       - in: path
 *         name: pullNumber
 *         schema:
 *           type: integer
 *         required: true
 *         description: Pull Request Number
 *     responses:
 *       200:
 *         description: List of PR reviews
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Project not found
 *       500:
 *         description: Server error
 */
router.get('/projects/:projectId/pulls/:pullNumber/reviews',
    resourceAccessMiddleware.project,
    prReviewController.getReviewsByPR);

/**
 * @swagger
 * /api/projects/{projectId}/pulls/{pullNumber}/reviews/user:
 *   get:
 *     summary: Get the current user's review for a PR
 *     tags: [PR Reviews]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: projectId
 *         schema:
 *           type: string
 *         required: true
 *         description: Project ID
 *       - in: path
 *         name: pullNumber
 *         schema:
 *           type: integer
 *         required: true
 *         description: Pull Request Number
 *     responses:
 *       200:
 *         description: User's review or indication that no review exists
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get('/projects/:projectId/pulls/:pullNumber/reviews/user',
    resourceAccessMiddleware.project,
    prReviewController.getUserReviewForPR);

/**
 * @swagger
 * /api/projects/{projectId}/pulls/{pullNumber}/reviews:
 *   post:
 *     summary: Submit a new review or update existing review
 *     tags: [PR Reviews]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: projectId
 *         schema:
 *           type: string
 *         required: true
 *         description: Project ID
 *       - in: path
 *         name: pullNumber
 *         schema:
 *           type: integer
 *         required: true
 *         description: Pull Request Number
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - approved
 *               - teamId
 *             properties:
 *               approved:
 *                 type: boolean
 *                 description: Whether the PR is approved
 *               comment:
 *                 type: string
 *                 description: Review comment (optional)
 *               teamId:
 *                 type: string
 *                 description: Team ID the user is reviewing on behalf of
 *     responses:
 *       200:
 *         description: Review submitted successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: User is not a member of the team
 *       404:
 *         description: Project or team not found
 *       500:
 *         description: Server error
 */
router.post('/projects/:projectId/pulls/:pullNumber/reviews',
    resourceAccessMiddleware.project,
    prReviewController.submitReview);

/**
 * @swagger
 * /api/projects/{projectId}/pulls/{pullNumber}/status:
 *   get:
 *     summary: Check if a PR has been approved by all teams
 *     tags: [PR Reviews]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: projectId
 *         schema:
 *           type: string
 *         required: true
 *         description: Project ID
 *       - in: path
 *         name: pullNumber
 *         schema:
 *           type: integer
 *         required: true
 *         description: Pull Request Number
 *     responses:
 *       200:
 *         description: PR approval status
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Project not found
 *       500:
 *         description: Server error
 */
router.get('/projects/:projectId/pulls/:pullNumber/status',
    resourceAccessMiddleware.project,
    prReviewController.checkPRApprovalStatus);

/**
 * @swagger
 * /api/projects/{projectId}/pulls/{pullNumber}/merge:
 *   post:
 *     summary: Merge a PR that has been approved by all teams
 *     tags: [PR Reviews]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: projectId
 *         schema:
 *           type: string
 *         required: true
 *         description: Project ID
 *       - in: path
 *         name: pullNumber
 *         schema:
 *           type: integer
 *         required: true
 *         description: Pull Request Number
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               mergeMethod:
 *                 type: string
 *                 enum: [merge, squash, rebase]
 *                 default: merge
 *                 description: Merge method to use
 *               commitTitle:
 *                 type: string
 *                 description: Title for the merge commit
 *               commitMessage:
 *                 type: string
 *                 description: Message for the merge commit
 *     responses:
 *       200:
 *         description: PR merged successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Not all teams have approved the PR
 *       404:
 *         description: Project not found
 *       500:
 *         description: Server error
 */
router.post('/projects/:projectId/pulls/:pullNumber/merge',
    resourceAccessMiddleware.project,
    prReviewController.mergePullRequest);

/**
 * @swagger
 * /api/reviews/activity-summary:
 *   get:
 *     summary: Get PR activity summary for dashboard
 *     tags: [PR Reviews]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: timeframe
 *         schema:
 *           type: string
 *           enum: [day, week, month]
 *           default: week
 *         description: Timeframe for summary (day, week, month)
 *     responses:
 *       200:
 *         description: PR activity summary data
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get('/reviews/activity-summary',
    authMiddleware,
    prReviewController.getPRActivitySummary);

// Export the router - this should be the last line
module.exports = router;
