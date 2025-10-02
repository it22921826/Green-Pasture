import Booking from '../models/Booking.js';
import Room from '../models/Room.js';
import nodemailer from 'nodemailer';

// Create booking (also updates Room status to 'Booked')
export const createBooking = async (req, res) => {
  try {
    let { roomNumber, checkIn, checkOut, specialRequests, paymentConfirmation } = req.body;
    if (typeof roomNumber === 'string') roomNumber = roomNumber.trim();

    const room = await Room.findOne({ roomNumber });
    if (!room) {
      console.warn('[createBooking] Room not found for number:', roomNumber);
      return res.status(404).json({ message: 'Room not found' });
    }
    if (room.status === 'Booked') {
      console.warn('[createBooking] Attempt to book already booked room:', roomNumber);
      return res.status(400).json({ message: 'Room already booked' });
    }

    // Create booking as PendingPayment initially; room remains Available until approval
    const booking = await Booking.create({
      guest: req.user._id,
      roomNumber,
      checkIn,
      checkOut,
      specialRequests,
      paymentConfirmation: paymentConfirmation || undefined,
      status: 'PendingPayment'
    });
    console.log('[createBooking] Booking created pending approval:', { bookingId: booking._id, roomNumber });
    res.status(201).json({ booking, updatedRoom: room });
  } catch (error) {
    console.error('[createBooking] Error:', error);
    res.status(500).json({ message: error.message });
  }
};

// Get bookings for user
export const getMyBookings = async (req, res) => {
  try {
    const bookings = await Booking.find({ guest: req.user._id })
      .populate('guest', 'name email')
      .populate('staff', 'name email');
    res.json(bookings);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Staff/Admin: Get all bookings
export const getAllBookings = async (req, res) => {
  try {
    const bookings = await Booking.find().populate('guest staff');
    res.json(bookings);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update booking
export const updateBooking = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ message: 'Booking not found' });
    Object.assign(booking, req.body);
    await booking.save();
    res.json(booking);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Delete booking
export const deleteBooking = async (req, res) => {
  try {
    await Booking.findByIdAndDelete(req.params.id);
    res.json({ message: 'Booking deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Mark booking as paid (called after payment proof accepted)
export const markBookingPaid = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ message: 'Booking not found' });
    if (booking.status !== 'PendingPayment') {
      return res.status(400).json({ message: 'Booking not in PendingPayment state' });
    }
    booking.status = 'Booked';
    // Optionally attach paymentConfirmation reference if provided
    if (req.body.paymentConfirmation) booking.paymentConfirmation = req.body.paymentConfirmation;
    await booking.save();
    res.json(booking);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Cancel booking (Guest can cancel own, Staff/Admin can cancel any)
export const cancelBooking = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ message: 'Booking not found' });

    // Authorization: guest only their own
    const role = (req.user.role || '').toLowerCase();
    if (role === 'guest' && String(booking.guest) !== String(req.user._id)) {
      return res.status(403).json({ message: 'Not authorized to cancel this booking' });
    }

    if (booking.status === 'Cancelled') {
      return res.status(200).json({ message: 'Already cancelled', booking });
    }

    booking.status = 'Cancelled';
    await booking.save();

    // Free associated room if currently booked
    const room = await Room.findOne({ roomNumber: booking.roomNumber });
    if (room && room.status === 'Booked') {
      room.status = 'Available';
      await room.save();
    }
    res.json({ message: 'Booking cancelled', booking });
  } catch (error) {
    console.error('[cancelBooking] Error:', error);
    res.status(500).json({ message: error.message });
  }
};

// Staff/Admin: set booking status to 'Booked' (Approve) or 'PendingPayment' (Pending)
export const setBookingStatus = async (req, res) => {
  try {
    const { status } = req.body; // expected: 'Approved'|'Pending'
    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ message: 'Booking not found' });
    let target;
    if (status === 'Approved') target = 'Booked';
    else if (status === 'Pending') target = 'PendingPayment';
    else return res.status(400).json({ message: 'Invalid status. Use Approved or Pending.' });

    // If changing from Cancelled, disallow
    if (booking.status === 'Cancelled') {
      return res.status(400).json({ message: 'Cannot modify a cancelled booking' });
    }

    // Sync room status if necessary
    const room = await Room.findOne({ roomNumber: booking.roomNumber });
    booking.status = target;
    await booking.save();
    if (room) {
      if (target === 'Booked') {
        room.status = 'Booked';
      } else if (target === 'PendingPayment') {
        // Only revert to Available if room not booked by another overlapping approved booking (simple check)
        const anyOtherBooked = await Booking.findOne({ roomNumber: booking.roomNumber, _id: { $ne: booking._id }, status: 'Booked' });
        if (!anyOtherBooked) room.status = 'Available';
      }
      await room.save();
    }
    // Send approval email only when transitioning to Booked
    if (target === 'Booked') {
      try {
        const populated = await booking.populate('guest', 'name email');
        if (populated.guest?.email) {
          const transporter = nodemailer.createTransport({
            service: 'Gmail',
            auth: { user: process.env.SENDER_EMAIL, pass: process.env.EMAIL_PASSWORD }
          });
          await transporter.sendMail({
            to: populated.guest.email,
            from: process.env.SENDER_EMAIL,
            subject: 'Your Room Booking is Approved',
            html: `<p>Dear ${populated.guest.name || 'Guest'},</p>
                   <p>Your booking for room <strong>${booking.roomNumber}</strong> has been approved.</p>
                   <ul>
                     <li>Check-in: ${new Date(booking.checkIn).toLocaleDateString()}</li>
                     <li>Check-out: ${new Date(booking.checkOut).toLocaleDateString()}</li>
                     <li>Status: Booked</li>
                   </ul>
                   <p>We look forward to hosting you.</p>`
          });
        }
      } catch (mailErr) {
        console.error('[setBookingStatus] approval email failed:', mailErr);
      }
    }
    return res.json({ message: 'Status updated', booking, room });
  } catch (error) {
    console.error('[setBookingStatus] Error:', error);
    res.status(500).json({ message: error.message });
  }
};
