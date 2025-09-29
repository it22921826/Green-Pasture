const express = require('express');
const router = express.Router();
const bookingController = require('../controllers/bookingController');
const { protect } = require('../middlewares/authMiddleware');
const { authorizeRoles } = require('../middlewares/roleMiddleware');

router.post('/', protect, authorizeRoles('Guest', 'Staff', 'Admin'), bookingController.createBooking);
router.get('/my', protect, authorizeRoles('Guest'), bookingController.getMyBookings);
router.get('/', protect, authorizeRoles('Staff', 'Admin'), bookingController.getAllBookings);
router.put('/:id', protect, authorizeRoles('Staff', 'Admin'), bookingController.updateBooking);
router.delete('/:id', protect, authorizeRoles('Staff', 'Admin'), bookingController.deleteBooking);
router.post('/:id/mark-paid', protect, authorizeRoles('Staff','Admin'), bookingController.markBookingPaid);

module.exports = router;
