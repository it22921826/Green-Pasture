import express from 'express';
import * as bookingController from '../controllers/bookingController.js';
import { protect } from '../middlewares/authMiddleware.js';
import { authorizeRoles } from '../middlewares/roleMiddleware.js';
const router = express.Router();

router.post('/', protect, authorizeRoles('Guest', 'Staff', 'Admin'), bookingController.createBooking);
router.get('/my', protect, authorizeRoles('Guest'), bookingController.getMyBookings);
router.get('/', protect, authorizeRoles('Staff', 'Admin'), bookingController.getAllBookings);
router.put('/:id', protect, authorizeRoles('Staff', 'Admin'), bookingController.updateBooking);
router.patch('/:id/status', protect, authorizeRoles('Staff','Admin'), bookingController.setBookingStatus);
router.delete('/:id', protect, authorizeRoles('Staff', 'Admin'), bookingController.deleteBooking);
router.post('/:id/mark-paid', protect, authorizeRoles('Staff','Admin'), bookingController.markBookingPaid);
// Dedicated cancel route to ensure room is freed correctly
router.patch('/:id/cancel', protect, authorizeRoles('Staff','Admin','Guest'), bookingController.cancelBooking);

export default router;
