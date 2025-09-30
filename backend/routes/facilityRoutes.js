import express from 'express';
import {
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
} from '../controllers/facilityController.js';
import { protect } from '../middlewares/authMiddleware.js';
import { authorizeRoles } from '../middlewares/roleMiddleware.js';

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

export default router;