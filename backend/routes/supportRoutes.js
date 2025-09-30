import express from 'express';
import { createSupportMessage, getAllSupportMessages, updateSupportStatus } from '../controllers/supportController.js';
import { protect } from '../middlewares/authMiddleware.js';
import { authorizeRoles } from '../middlewares/roleMiddleware.js';
const router = express.Router();

// Public create; if logged in, middleware is optional
router.post('/', (req, res, next) => next(), createSupportMessage);

// Admin endpoints
router.get('/', protect, authorizeRoles('Admin'), getAllSupportMessages);
router.put('/:id/status', protect, authorizeRoles('Admin'), updateSupportStatus);

export default router;
