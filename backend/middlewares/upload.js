import multer from 'multer';

// Switch to in-memory storage for room photos so we can persist images directly in Mongo as base64.
// (Existing previously uploaded disk-based photos will continue to render, since we keep their URLs.)
// NOTE: Existing room upload uses memoryStorage (defined below). We also export a single-file memory uploader for payment receipts.
const memoryStorage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
  if (allowed.includes(file.mimetype)) return cb(null, true);
  cb(new Error('Only image files are allowed'));
};

const uploadRoomPhotos = multer({
  storage: memoryStorage,
  fileFilter,
  limits: { files: 5, fileSize: 5 * 1024 * 1024 }, // 5 files, 5MB each
});

// Re-export room photos uploader (already defined as uploadRoomPhotos)
// Add a payment receipt uploader (single file named paymentProof)
const paymentReceiptUpload = multer({
  storage: memoryStorage,
  fileFilter: (req, file, cb) => {
    const allowed = ['image/jpeg','image/png','image/webp','image/jpg','application/pdf'];
    if (allowed.includes(file.mimetype)) return cb(null, true);
    cb(new Error('Only image or PDF files allowed'));
  },
  limits: { files: 1, fileSize: 5 * 1024 * 1024 }
});

export { uploadRoomPhotos, paymentReceiptUpload };
