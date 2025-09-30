import express from 'express';
import * as userController from '../controllers/userController.js';
import { protect } from '../middlewares/authMiddleware.js';
import { authorizeRoles } from '../middlewares/roleMiddleware.js';
const router = express.Router();

// Public routes
router.post('/register', userController.register);
router.post('/login', userController.login);

// Protected routes
router.get('/profile', protect, userController.getProfile);
router.put('/profile', protect, userController.updateProfile);
router.put('/change-password', protect, userController.changePassword);

// Admin routes
router.get('/', protect, authorizeRoles('Admin'), userController.getAllUsers);
// Place specific route before generic "/:id" to avoid any accidental shadowing
router.delete('/delete-guest/:id', protect, userController.deleteGuest);
router.delete('/:id', protect, authorizeRoles('Admin'), userController.deleteUser);

export default router;
