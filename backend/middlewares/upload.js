const multer = require('multer');
const path = require('path');
const fs = require('fs');

const roomsUploadDir = path.join(__dirname, '..', 'uploads', 'rooms');

// Ensure upload directory exists
fs.mkdirSync(roomsUploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, roomsUploadDir);
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    const base = path.basename(file.originalname, ext).replace(/\s+/g, '_');
    cb(null, `${base}_${Date.now()}${ext}`);
  },
});

const fileFilter = (req, file, cb) => {
  const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
  if (allowed.includes(file.mimetype)) return cb(null, true);
  cb(new Error('Only image files are allowed'));
};

const uploadRoomPhotos = multer({
  storage,
  fileFilter,
  limits: { files: 5, fileSize: 5 * 1024 * 1024 }, // 5 files, 5MB each
});

module.exports = { uploadRoomPhotos };
