/**
 * Comment routes for the PDV API
 */
import express from 'express';
import prisma from '../utils/prisma';

const router = express.Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     Comment:
 *       type: object
 *       required:
 *         - orderId
 *         - content
 *         - createdBy
 *       properties:
 *         id:
 *           type: string
 *           description: The auto-generated ID of the comment
 *         orderId:
 *           type: string
 *           description: The ID of the order this comment belongs to
 *         content:
 *           type: string
 *           description: The content of the comment
 *         createdBy:
 *           type: string
 *           description: The name of the user who created this comment
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: The date the comment was created
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: The date the comment was last updated
 */

/**
 * @swagger
 * /api/comments:
 *   get:
 *     summary: Get all comments
 *     tags: [Comments]
 *     parameters:
 *       - in: query
 *         name: orderId
 *         schema:
 *           type: string
 *         description: Filter comments by order ID
 *     responses:
 *       200:
 *         description: The list of comments
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Comment'
 */
router.get('/', async (req, res) => {
  try {
    const { orderId } = req.query;
    
    // Build filters
    const filters: any = {};
    
    if (orderId) {
      filters.orderId = orderId;
    }
    
    const comments = await prisma.comment.findMany({
      where: filters,
      orderBy: {
        createdAt: 'desc',
      },
    });
    
    res.json(comments);
  } catch (error) {
    console.error('Error fetching comments:', error);
    res.status(500).json({ error: 'Failed to fetch comments' });
  }
});

/**
 * @swagger
 * /api/comments/{id}:
 *   get:
 *     summary: Get a comment by ID
 *     tags: [Comments]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: The comment ID
 *     responses:
 *       200:
 *         description: The comment data
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Comment'
 *       404:
 *         description: Comment not found
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const comment = await prisma.comment.findUnique({
      where: { id },
    });
    
    if (!comment) {
      return res.status(404).json({ error: 'Comment not found' });
    }
    
    res.json(comment);
  } catch (error) {
    console.error('Error fetching comment:', error);
    res.status(500).json({ error: 'Failed to fetch comment' });
  }
});

/**
 * @swagger
 * /api/comments:
 *   post:
 *     summary: Create a new comment
 *     tags: [Comments]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - orderId
 *               - content
 *               - createdBy
 *             properties:
 *               orderId:
 *                 type: string
 *               content:
 *                 type: string
 *               createdBy:
 *                 type: string
 *     responses:
 *       201:
 *         description: The created comment
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Comment'
 *       400:
 *         description: Invalid request data
 *       404:
 *         description: Order not found
 */
router.post('/', async (req, res) => {
  try {
    const { orderId, content, createdBy } = req.body;
    
    // Validate required fields
    if (!orderId || !content || !createdBy) {
      return res.status(400).json({ 
        error: 'Missing required fields: orderId, content, and createdBy are required' 
      });
    }
    
    // Check if order exists
    const order = await prisma.order.findUnique({
      where: { id: orderId },
    });
    
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }
    
    // Create comment
    const comment = await prisma.comment.create({
      data: {
        orderId,
        content,
        createdBy,
      },
    });
    
    res.status(201).json(comment);
  } catch (error) {
    console.error('Error creating comment:', error);
    res.status(500).json({ error: 'Failed to create comment' });
  }
});

/**
 * @swagger
 * /api/comments/{id}:
 *   put:
 *     summary: Update a comment
 *     tags: [Comments]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: The comment ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               content:
 *                 type: string
 *     responses:
 *       200:
 *         description: The updated comment
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Comment'
 *       400:
 *         description: Invalid request data
 *       404:
 *         description: Comment not found
 */
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { content } = req.body;
    
    // Validate required fields
    if (!content) {
      return res.status(400).json({ error: 'Content is required' });
    }
    
    // Check if comment exists
    const existingComment = await prisma.comment.findUnique({
      where: { id },
    });
    
    if (!existingComment) {
      return res.status(404).json({ error: 'Comment not found' });
    }
    
    // Update comment
    const updatedComment = await prisma.comment.update({
      where: { id },
      data: { 
        content,
        updatedAt: new Date(),
      },
    });
    
    res.json(updatedComment);
  } catch (error) {
    console.error('Error updating comment:', error);
    res.status(500).json({ error: 'Failed to update comment' });
  }
});

/**
 * @swagger
 * /api/comments/{id}:
 *   delete:
 *     summary: Delete a comment
 *     tags: [Comments]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: The comment ID
 *     responses:
 *       200:
 *         description: Comment deleted successfully
 *       404:
 *         description: Comment not found
 */
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if comment exists
    const existingComment = await prisma.comment.findUnique({
      where: { id },
    });
    
    if (!existingComment) {
      return res.status(404).json({ error: 'Comment not found' });
    }
    
    // Delete comment
    await prisma.comment.delete({
      where: { id },
    });
    
    res.json({ message: 'Comment deleted successfully' });
  } catch (error) {
    console.error('Error deleting comment:', error);
    res.status(500).json({ error: 'Failed to delete comment' });
  }
});

export default router;