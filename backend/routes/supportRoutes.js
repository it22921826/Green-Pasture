import express from 'express';
import { createSupportMessage, getAllSupportMessages, updateSupportStatus, getMyRefundStatus } from '../controllers/supportController.js';
import { protect, optionalProtect } from '../middlewares/authMiddleware.js';
import { authorizeRoles } from '../middlewares/roleMiddleware.js';
const router = express.Router();

// Public create; attach user if token is provided
router.post('/', optionalProtect, createSupportMessage);

// Staff/Admin endpoints
router.get('/', protect, authorizeRoles('Staff', 'Admin'), getAllSupportMessages);
router.put('/:id/status', protect, authorizeRoles('Staff', 'Admin'), updateSupportStatus);

// Logged-in user: get refund status for a specific booking
router.get('/my/refund-status/:bookingId', protect, getMyRefundStatus);

export default router;
