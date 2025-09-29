const express = require('express');
const router = express.Router();
const { createFeedback, getPublicFeedbacks, getAllFeedbacks, respondToFeedback } = require('../controllers/feedbackController');
const { protect } = require('../middlewares/authMiddleware');
const { authorizeRoles } = require('../middlewares/roleMiddleware');

// Public: list published feedback
router.get('/public', getPublicFeedbacks);

// Registered users: create feedback
router.post('/', protect, createFeedback);

// Admin: list all feedbacks
router.get('/', protect, authorizeRoles('Admin'), getAllFeedbacks);

// Admin: respond to a feedback
router.put('/:id/respond', protect, authorizeRoles('Admin'), respondToFeedback);

module.exports = router;
