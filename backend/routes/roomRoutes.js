import express from 'express';
import { protect } from '../middlewares/authMiddleware.js';
import { authorizeRoles } from '../middlewares/roleMiddleware.js';
import { uploadRoomPhotos } from '../middlewares/upload.js';
import {
  getRooms,
  getRoomById,
  createRoom,
  updateRoom,
  deleteRoom,
} from '../controllers/roomController.js';

const router = express.Router();

// Public listing and detail
router.get('/', getRooms);
router.get('/:id', getRoomById);

// Admin/Staff create/update
router.post(
  '/',
  protect,
  authorizeRoles('Admin', 'Staff'),
  uploadRoomPhotos.array('photos', 5),
  createRoom
);

router.put(
  '/:id',
  protect,
  authorizeRoles('Admin', 'Staff'),
  uploadRoomPhotos.array('photos', 5),
  updateRoom
);

// Admin/Staff delete
router.delete('/:id', protect, authorizeRoles('Admin', 'Staff'), deleteRoom);

export default router;
