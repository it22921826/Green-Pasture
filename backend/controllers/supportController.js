import SupportMessage from '../models/SupportMessage.js';
import Booking from '../models/Booking.js';
import Invoice from '../models/invoice.js';
import { sendEmail } from '../utils/nodemailer.js';

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
      const msg = await SupportMessage.findById(id).select('message email subject name createdAt');
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
    // Notify guest via email when refund approved (Resolved)
    if (status === 'Resolved' || status === 'Cancelled') {
      const to = updated.email;
      if (to) {
        const subjectText = String(updated.subject || '');
        const match = subjectText.match(/booking\s+([A-Za-z0-9]+)/i);
        const bookingId = match?.[1];
        let bookingRef = bookingId ? `Booking ${bookingId}` : 'your booking';
        let checkIn = '', checkOut = '', refundAmount = '';
        if (bookingId) {
          try {
            const booking = await Booking.findById(bookingId);
            if (booking) {
              bookingRef = `Room ${booking.roomNumber}`;
              checkIn = booking.checkIn ? new Date(booking.checkIn).toLocaleDateString() : '';
              checkOut = booking.checkOut ? new Date(booking.checkOut).toLocaleDateString() : '';
              // Try to find invoice for this booking
              const invoice = await Invoice.findOne({ roomNo: booking.roomNumber, email: updated.email });
              if (invoice) {
                refundAmount = invoice.amount ? `LKR ${invoice.amount.toLocaleString()}` : '';
              }
            }
          } catch (e) {
            // ignore lookup errors
          }
        }
        let mailSubject = status === 'Resolved' ? 'Your refund request has been approved' : 'Your refund request has been declined';
        let html = `<div style="font-family:Arial,Helvetica,sans-serif;font-size:14px;color:#111">
          <p>Dear ${updated.name || 'Guest'},</p>
          <p>${status === 'Resolved' ? 'Good news! Your refund request' : 'We reviewed your refund request'} for <strong>${bookingRef}</strong>${checkIn && checkOut ? ` (${checkIn} to ${checkOut})` : ''} has been <strong>${status === 'Resolved' ? 'approved' : 'declined'}</strong>.</p>
          ${refundAmount ? `<p>Refund amount: <strong>${refundAmount}</strong></p>` : ''}
          <p>${status === 'Resolved' ? 'Please allow 3-5 business days for the refund to be processed by your payment provider. If you have any questions, just reply to this email.' : 'If you believe this was a mistake or would like to provide additional information, please reply to this email and our team will take another look.'}</p>
          <p>Kind regards,<br/>Green Pasture Support</p>
        </div>`;
        let text = `Dear ${updated.name || 'Guest'},\n\nYour refund request for ${bookingRef}${checkIn && checkOut ? ` (${checkIn} to ${checkOut})` : ''} has been ${status === 'Resolved' ? 'approved' : 'declined'}.${refundAmount ? `\nRefund amount: ${refundAmount}` : ''}\n\n${status === 'Resolved' ? 'Please allow 3-5 business days for processing.' : 'If you believe this was a mistake or have more details to share, please reply to this email.'}\n\nGreen Pasture Support`;
        try {
          await sendEmail({ to, subject: mailSubject, html, text });
        } catch (mailErr) {
          console.error('updateSupportStatus: failed to send refund status email:', mailErr?.message || mailErr);
        }
      }
    }
    // Notify guest via email when refund cancelled
    if (status === 'Cancelled') {
      const to = updated.email;
      if (to) {
        const subjectText = String(updated.subject || '');
        const match = subjectText.match(/booking\s+([A-Za-z0-9]+)/i);
        const bookingRef = match?.[1] ? `Booking ${match[1]}` : 'your booking';
        const mailSubject = `Your refund request has been declined`;
        const html = `
          <div style="font-family:Arial,Helvetica,sans-serif;font-size:14px;color:#111">
            <p>Dear ${updated.name || 'Guest'},</p>
            <p>We reviewed your refund request for <strong>${bookingRef}</strong> and unfortunately it has been <strong>declined</strong>.</p>
            <p>If you believe this was a mistake or would like to provide additional information, please reply to this email and our team will take another look.</p>
            <p>Kind regards,<br/>Green Pasture Support</p>
          </div>`;
        const text = `Dear ${updated.name || 'Guest'},\n\nYour refund request for ${bookingRef} has been declined. If you believe this was a mistake or have more details to share, please reply to this email.\n\nGreen Pasture Support`;
        try {
          await sendEmail({ to, subject: mailSubject, html, text });
        } catch (mailErr) {
          console.error('updateSupportStatus: failed to send cancellation email:', mailErr?.message || mailErr);
        }
      }
    }
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
