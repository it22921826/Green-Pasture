const express = require('express');
const {
  getAllFacilities,
  getFacilityById,
  createFacility,
  updateFacility,
  deleteFacility,
  createFacilityBooking,
  getMyFacilityBookings,
  getAllFacilityBookings,
  updateFacilityBooking,
  cancelFacilityBooking,
  deleteFacilityBooking,
  markFacilityBookingPaid
} = require('../controllers/facilityController');
const { protect } = require('../middlewares/authMiddleware');
const { authorizeRoles } = require('../middlewares/roleMiddleware');

const router = express.Router();

// Facility booking routes (place specific paths BEFORE generic '/:id')
router.post('/book', protect, createFacilityBooking);
router.get('/bookings/my', protect, getMyFacilityBookings);
router.get('/bookings/all', protect, authorizeRoles('Admin', 'Staff'), getAllFacilityBookings);
router.put('/bookings/:id', protect, updateFacilityBooking);
router.patch('/bookings/:id/cancel', protect, cancelFacilityBooking);
router.delete('/bookings/:id', protect, authorizeRoles('Admin'), deleteFacilityBooking);
router.post('/bookings/:id/mark-paid', protect, markFacilityBookingPaid);

// Facility routes
router.get('/', getAllFacilities); // Public route to view facilities
router.post('/', protect, authorizeRoles('Admin', 'Staff'), createFacility);
router.put('/:id', protect, authorizeRoles('Admin', 'Staff'), updateFacility);
router.delete('/:id', protect, authorizeRoles('Admin'), deleteFacility);
router.get('/:id', getFacilityById); // Keep this last to avoid shadowing

module.exports = router;