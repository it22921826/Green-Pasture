import SupportMessage from '../models/SupportMessage.js';
import Booking from '../models/Booking.js';

// Create a support message (public - users may or may not be logged in)
export const createSupportMessage = async (req, res) => {
  try {
    const { name, email, phone, subject, message } = req.body;
    if (!name || !email || !subject || !message) {
      return res.status(400).json({ message: 'Missing required fields' });
    }
    const payload = {
      name,
      email,
      phone,
      subject,
      message,
    };
    if (req.user?._id) payload.user = req.user._id;

    const created = await SupportMessage.create(payload);
    return res.status(201).json(created);
  } catch (err) {
    console.error('createSupportMessage error:', err);
    return res.status(500).json({ message: 'Server error' });
  }
};

// Get all support messages (admin only)
export const getAllSupportMessages = async (req, res) => {
  try {
    const items = await SupportMessage.find().sort({ createdAt: -1 });
    return res.json(items);
  } catch (err) {
    console.error('getAllSupportMessages error:', err);
    return res.status(500).json({ message: 'Server error' });
  }
};

// Update message status (admin only)
export const updateSupportStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body; // 'Open' | 'Resolved' | 'Cancelled'
    if (!['Open', 'Resolved', 'Cancelled'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }
    // When resolving (approving refund), ensure a proof image was provided in the original message
    if (status === 'Resolved') {
      const msg = await SupportMessage.findById(id).select('message');
      if (!msg) return res.status(404).json({ message: 'Not found' });
      const text = String(msg.message || '');
      const hasDataUri = /Attachment\s*\(base64\)\s*:\s*data:[^;]+;base64,/i.test(text) || /data:[^;]+;base64,/i.test(text);
      const hasUploadUrl = /\/uploads\//i.test(text);
      if (!hasDataUri && !hasUploadUrl) {
        return res.status(400).json({ message: 'Cannot approve refund: no proof image attached.' });
      }
    }
    const updated = await SupportMessage.findByIdAndUpdate(id, { status }, { new: true });
    if (!updated) return res.status(404).json({ message: 'Not found' });
    return res.json(updated);
  } catch (err) {
    console.error('updateSupportStatus error:', err);
    return res.status(500).json({ message: 'Server error' });
  }
};

// Get refund status for a specific booking for the authenticated user
export const getMyRefundStatus = async (req, res) => {
  try {
    const { bookingId } = req.params;
    if (!bookingId) return res.status(400).json({ message: 'Missing bookingId' });

    // Ensure the booking belongs to the authenticated user
    const booking = await Booking.findById(bookingId).select('guest');
    if (!booking) return res.status(404).json({ message: 'Booking not found' });
    if (!req.user || String(booking.guest) !== String(req.user._id)) {
      return res.status(403).json({ message: 'Not authorized to view this booking refund status' });
    }

    const subject = `Refund Request for Booking ${bookingId}`;
    // Find the most recent support message matching the booking regardless of email/user
    const item = await SupportMessage.findOne({ subject }).sort({ createdAt: -1 });
    if (!item) return res.json({ status: 'NotRequested' });
    return res.json({ status: item.status || 'Open', supportId: item._id, createdAt: item.createdAt });
  } catch (err) {
    console.error('getMyRefundStatus error:', err);
    return res.status(500).json({ message: 'Server error' });
  }
};
