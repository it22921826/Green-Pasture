const express = require('express');
const router = express.Router();
const { createSupportMessage, getAllSupportMessages, updateSupportStatus } = require('../controllers/supportController');
const { protect } = require('../middlewares/authMiddleware');
const { authorizeRoles } = require('../middlewares/roleMiddleware');

// Public create; if logged in, middleware is optional
router.post('/', (req, res, next) => next(), createSupportMessage);

// Admin endpoints
router.get('/', protect, authorizeRoles('Admin'), getAllSupportMessages);
router.put('/:id/status', protect, authorizeRoles('Admin'), updateSupportStatus);

module.exports = router;
