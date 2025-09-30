import express from 'express';
import { createFeedback, getPublicFeedbacks, getAllFeedbacks, respondToFeedback } from '../controllers/feedbackController.js';
import { protect } from '../middlewares/authMiddleware.js';
import { authorizeRoles } from '../middlewares/roleMiddleware.js';
const router = express.Router();

// Public: list published feedback
router.get('/public', getPublicFeedbacks);

// Registered users: create feedback
router.post('/', protect, createFeedback);

// Admin: list all feedbacks
router.get('/', protect, authorizeRoles('Admin'), getAllFeedbacks);

// Admin: respond to a feedback
router.put('/:id/respond', protect, authorizeRoles('Admin'), respondToFeedback);

export default router;
