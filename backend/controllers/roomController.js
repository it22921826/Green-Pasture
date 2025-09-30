import Room from '../models/Room.js';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

// Recreate __dirname for ESM modules (was missing previously and broke file path resolution when photos existed)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Robust helper to build a public URL for uploaded files relative to uploads root
const toPublicPath = (req, filepath) => {
  try {
    const uploadsRoot = path.join(__dirname, '..', 'uploads');
    let rel = path.relative(uploadsRoot, filepath); // e.g. rooms/filename.ext
    rel = rel.split(path.sep).join('/');
    if (!rel || rel.startsWith('..')) {
      // Fallback if relative fails
      const parts = filepath.split(path.sep);
      const last = parts.slice(-2).join('/');
      rel = last.includes('rooms/') ? last : `rooms/${last}`;
    }
    if (!rel.startsWith('rooms/')) rel = `rooms/${rel}`;
    return `${req.protocol}://${req.get('host')}/uploads/${rel}`;
  } catch (e) {
    console.warn('[toPublicPath] failed for', filepath, e.message);
    return '';
  }
};

// GET /api/rooms?type=&status=&minPrice=&maxPrice=
export const getRooms = async (req, res) => {
  try {
    const { type, status, minPrice, maxPrice } = req.query;
    const filter = {};
    if (type) filter.type = type;
    if (status) filter.status = status;
    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.$gte = Number(minPrice);
      if (maxPrice) filter.price.$lte = Number(maxPrice);
    }
  const rooms = await Room.find(filter).sort({ price: 1, roomNumber: 1 });
  // Wrap with currency metadata (non-breaking for existing clients expecting array? Provide fallback compatibility if caller treats response as array)
  // If client expects array, adjust frontend accordingly.
  res.json({ currency: 'LKR', symbol: 'Rs.', items: rooms });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/rooms/:id
export const getRoomById = async (req, res) => {
  try {
    const room = await Room.findById(req.params.id);
  if (!room) return res.status(404).json({ message: 'Room not found' });
  res.json({ currency: 'LKR', symbol: 'Rs.', item: room });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// POST /api/rooms (Admin/Staff) multipart/form-data with photos
export const createRoom = async (req, res) => {
  try {
    const body = { ...req.body };
    console.log('[createRoom] content-type:', req.headers['content-type']);
    console.log('[createRoom] body keys:', Object.keys(body));
    console.log('[createRoom] raw files meta:', (req.files || []).map(f => ({ field: f.fieldname, name: f.originalname, mime: f.mimetype, size: f.size })));
    // Normalize types
    if (typeof body.amenities === 'string') {
      // Allow CSV or single value; also support JSON array string
      try {
        const parsed = JSON.parse(body.amenities);
        body.amenities = Array.isArray(parsed) ? parsed : [String(parsed)];
      } catch {
        body.amenities = body.amenities
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean);
      }
    }
    if (body.price) body.price = Number(body.price);
    if (body.capacity) body.capacity = Number(body.capacity);

    // Enforce a maximum of 50 rooms total
    const MAX_ROOMS = 50;
    const total = await Room.countDocuments();
    if (total >= MAX_ROOMS) {
      // Clean up any uploaded files from this request, if any
      if (Array.isArray(req.files) && req.files.length) {
        await Promise.all(
          req.files.map((f) => fs.promises.unlink(f.path).catch(() => {}))
        );
      }
      return res.status(400).json({ message: `Room limit reached (${MAX_ROOMS}). Delete a room before adding a new one.` });
    }

  const photos = (req.files || []).map((f) => {
    try {
      // New: prefer in-memory buffer -> base64 data URI for DB storage
      if (f.buffer) {
        const base64 = f.buffer.toString('base64');
        return `data:${f.mimetype};base64,${base64}`;
      }
      // Fallback (legacy disk-based path)
      if (f.path) return toPublicPath(req, f.path);
      return '';
    } catch (e) {
      console.warn('[createRoom] photo transform error for', f.originalname, e.message);
      return '';
    }
  }).filter(Boolean);
    // Require at least one photo when creating a room
    if (!photos || photos.length === 0) {
      return res.status(400).json({ message: 'At least one photo is required' });
    }
    let room = new Room({ ...body, photos });
    await room.save();
    let persisted = await Room.findById(room._id).lean();
    if (!persisted || !Array.isArray(persisted.photos) || persisted.photos.length === 0) {
      console.warn('[createRoom] photos missing after save, retrying assignment');
      room.photos = photos;
      await room.save();
      persisted = await Room.findById(room._id).lean();
    }
    console.log('[createRoom] saved room', room._id.toString(), 'photos:', (persisted.photos || []).length);
    res.status(201).json({ currency: 'LKR', symbol: 'Rs.', item: persisted });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// PUT /api/rooms/:id (Admin/Staff) multipart/form-data allowed
export const updateRoom = async (req, res) => {
  try {
    const room = await Room.findById(req.params.id);
    if (!room) return res.status(404).json({ message: 'Room not found' });

    const body = { ...req.body };
    if (typeof body.amenities === 'string') {
      try {
        const parsed = JSON.parse(body.amenities);
        body.amenities = Array.isArray(parsed) ? parsed : [String(parsed)];
      } catch {
        body.amenities = body.amenities
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean);
      }
    }
    if (body.price) body.price = Number(body.price);
    if (body.capacity) body.capacity = Number(body.capacity);

    // Handle removal of existing photos if requested
    let removePhotos = [];
    console.log('Raw removePhotos from body:', body.removePhotos);
    if (typeof body.removePhotos === 'string') {
      try {
        const parsed = JSON.parse(body.removePhotos);
        removePhotos = Array.isArray(parsed) ? parsed : [];
        console.log('Parsed removePhotos:', removePhotos);
      } catch {
        // Fallback: comma-separated
        removePhotos = body.removePhotos.split(',').map((s) => s.trim()).filter(Boolean);
        console.log('Fallback parsed removePhotos:', removePhotos);
      }
    } else if (Array.isArray(body.removePhotos)) {
      removePhotos = body.removePhotos;
      console.log('Array removePhotos:', removePhotos);
    }

    const existingAll = Array.isArray(room.photos) ? room.photos : [];
    console.log('Existing photos:', existingAll);
    const existingAfterRemoval = existingAll.filter((p) => !removePhotos.includes(p));
    console.log('Photos after removal:', existingAfterRemoval);

    // New uploaded photos
  const newPhotos = (req.files || []).map((f) => {
    try {
      if (f.buffer) {
        const base64 = f.buffer.toString('base64');
        return `data:${f.mimetype};base64,${base64}`;
      }
      if (f.path) return toPublicPath(req, f.path);
      return '';
    } catch (e) {
      console.warn('[updateRoom] photo transform error for', f.originalname, e.message);
      return '';
    }
  }).filter(Boolean);

  // Merge existing (post-removal) with new, enforce max 5 and uniqueness
    const set = new Set();
    const merged = [];
    for (const p of existingAfterRemoval) {
      if (!set.has(p)) { set.add(p); merged.push(p); }
    }
    for (const p of newPhotos) {
      if (merged.length >= 5) break;
      if (!set.has(p)) { set.add(p); merged.push(p); }
    }
    body.photos = merged;

    // Require at least one photo to remain after update
    if (!Array.isArray(body.photos) || body.photos.length === 0) {
      return res.status(400).json({ message: 'At least one photo is required' });
    }

    Object.assign(room, body);
    await room.save();
    let persisted = await Room.findById(room._id).lean();
    if ((!persisted.photos || persisted.photos.length === 0) && merged.length > 0) {
      console.warn('[updateRoom] photos missing after save, restoring merged');
      room.photos = merged;
      await room.save();
      persisted = await Room.findById(room._id).lean();
    }
    console.log('[updateRoom] room', room._id.toString(), 'photos:', (persisted.photos || []).length);
    res.json({ currency: 'LKR', symbol: 'Rs.', item: persisted });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// DELETE /api/rooms/:id (Admin)
export const deleteRoom = async (req, res) => {
  try {
    const room = await Room.findById(req.params.id);
    if (!room) return res.status(404).json({ message: 'Room not found' });
    await room.deleteOne();
    res.json({ message: 'Room deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
