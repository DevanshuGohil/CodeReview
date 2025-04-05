const express = require('express');
const router = express.Router();
const auth = require('../middlewares/auth.middleware');
const prCommentController = require('../controllers/pr-comment.controller');

/**
 * @swagger
 * /api/projects/{projectId}/pulls/{pullNumber}/comments:
 *   get:
 *     summary: Get all comments for a PR
 *     description: Retrieves all comments for a specific pull request
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the project
 *       - in: path
 *         name: pullNumber
 *         required: true
 *         schema:
 *           type: integer
 *         description: Number of the pull request
 *     responses:
 *       200:
 *         description: List of comments
 *       404:
 *         description: Project not found
 *       500:
 *         description: Server error
 */
router.get('/projects/:projectId/pulls/:pullNumber/comments', auth, prCommentController.getCommentsByPR);

/**
 * @swagger
 * /api/projects/{projectId}/pulls/{pullNumber}/comments:
 *   post:
 *     summary: Create a new comment
 *     description: Add a new comment to a pull request
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the project
 *       - in: path
 *         name: pullNumber
 *         required: true
 *         schema:
 *           type: integer
 *         description: Number of the pull request
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - content
 *             properties:
 *               content:
 *                 type: string
 *                 description: Comment content
 *               fileLocation:
 *                 type: object
 *                 properties:
 *                   path:
 *                     type: string
 *                   line:
 *                     type: integer
 *               parentComment:
 *                 type: string
 *                 description: ID of the parent comment (for replies)
 *     responses:
 *       201:
 *         description: Comment created successfully
 *       404:
 *         description: Project not found
 *       500:
 *         description: Server error
 */
router.post('/projects/:projectId/pulls/:pullNumber/comments', auth, prCommentController.createComment);

/**
 * @swagger
 * /api/comments/{commentId}:
 *   put:
 *     summary: Update a comment
 *     description: Update an existing comment
 *     parameters:
 *       - in: path
 *         name: commentId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the comment to update
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - content
 *             properties:
 *               content:
 *                 type: string
 *                 description: Updated comment content
 *     responses:
 *       200:
 *         description: Comment updated successfully
 *       403:
 *         description: Not authorized to update this comment
 *       404:
 *         description: Comment not found
 *       500:
 *         description: Server error
 */
router.put('/comments/:commentId', auth, prCommentController.updateComment);

/**
 * @swagger
 * /api/comments/{commentId}:
 *   delete:
 *     summary: Delete a comment
 *     description: Soft delete a comment (mark as deleted)
 *     parameters:
 *       - in: path
 *         name: commentId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the comment to delete
 *     responses:
 *       200:
 *         description: Comment deleted successfully
 *       403:
 *         description: Not authorized to delete this comment
 *       404:
 *         description: Comment not found
 *       500:
 *         description: Server error
 */
router.delete('/comments/:commentId', auth, prCommentController.deleteComment);

/**
 * @swagger
 * /api/comments/{commentId}/replies:
 *   get:
 *     summary: Get replies to a comment
 *     description: Retrieves all replies to a specific comment
 *     parameters:
 *       - in: path
 *         name: commentId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the parent comment
 *     responses:
 *       200:
 *         description: List of replies
 *       500:
 *         description: Server error
 */
router.get('/comments/:commentId/replies', auth, prCommentController.getCommentReplies);

module.exports = router; 