import express from 'express';
import * as staffController from '../controllers/staffController.js';
const router = express.Router();

// Get all staff members
router.get('/', staffController.getAllStaff);

// Get a single staff member by ID
router.get('/:id', staffController.getStaffById);

// Create a new staff member
router.post('/', staffController.createStaff);

// Update a staff member by ID
router.put('/:id', staffController.updateStaff);

// Delete a staff member by ID
router.delete('/:id', staffController.deleteStaff);

export default router;