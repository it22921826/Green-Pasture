const express = require('express');
const { protect } = require('../middlewares/authMiddleware');
const { authorizeRoles } = require('../middlewares/roleMiddleware');
const { uploadRoomPhotos } = require('../middlewares/upload');
const {
  getRooms,
  getRoomById,
  createRoom,
  updateRoom,
  deleteRoom,
} = require('../controllers/roomController');

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

module.exports = router;
