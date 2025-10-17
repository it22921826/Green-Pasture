import Booking from '../models/Booking.js';
import Room from '../models/Room.js';
import nodemailer from 'nodemailer';

// Public: get availability (blocked date ranges) for a given roomNumber
export const getAvailability = async (req, res) => {
  try {
    const { roomNumber } = req.query;
    if (!roomNumber) return res.status(400).json({ message: 'roomNumber is required' });
    const list = await Booking.find({
      roomNumber: String(roomNumber).trim(),
      status: { $in: ['PendingPayment', 'Booked', 'CheckedIn'] },
    }).select('checkIn checkOut');
    const ranges = list.map(b => ({
      start: b.checkIn,
      end: b.checkOut,
    }));
    res.json({ roomNumber, ranges });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

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
    // If room is under maintenance, block any booking
    if (room.status === 'Maintenance') {
      return res.status(400).json({ message: 'Room is under maintenance' });
    }

    // Basic date validation
    const start = new Date(checkIn);
    const end = new Date(checkOut);
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return res.status(400).json({ message: 'Invalid check-in or check-out date' });
    }
    if (!(start < end)) {
      return res.status(400).json({ message: 'Check-out must be after check-in' });
    }

    // Prevent the same user from booking the same room with overlapping dates (including PendingPayment or Booked)
    const overlappingUserBooking = await Booking.findOne({
      guest: req.user._id,
      roomNumber,
      status: { $in: ['PendingPayment', 'Booked'] },
      checkIn: { $lt: end },
      checkOut: { $gt: start },
    });
    if (overlappingUserBooking) {
      return res.status(400).json({
        message: 'You already have a booking for this room that overlaps the selected dates',
      });
    }

    // Optional: prevent overlaps with already Booked reservations by any user
    const overlappingApproved = await Booking.findOne({
      roomNumber,
      status: 'Booked',
      checkIn: { $lt: end },
      checkOut: { $gt: start },
    });
    if (overlappingApproved) {
      return res.status(400).json({ message: 'Room is already booked for the selected dates' });
    }

    // Create booking as PendingPayment initially; room remains Available until approval
    const booking = await Booking.create({
      guest: req.user._id,
      roomNumber,
      checkIn: start,
      checkOut: end,
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

    // Determine prospective values
    const newRoomNumber = (typeof req.body.roomNumber === 'string' ? req.body.roomNumber.trim() : (booking.roomNumber || '')).trim();
    const newCheckIn = req.body.checkIn ? new Date(req.body.checkIn) : new Date(booking.checkIn);
    const newCheckOut = req.body.checkOut ? new Date(req.body.checkOut) : new Date(booking.checkOut);

    if (isNaN(newCheckIn.getTime()) || isNaN(newCheckOut.getTime())) {
      return res.status(400).json({ message: 'Invalid check-in or check-out date' });
    }
    if (!(newCheckIn < newCheckOut)) {
      return res.status(400).json({ message: 'Check-out must be after check-in' });
    }

    // Ensure room exists and not under maintenance if room changed
    const room = await Room.findOne({ roomNumber: newRoomNumber });
    if (!room) return res.status(404).json({ message: 'Room not found' });
    if (room.status === 'Maintenance') {
      return res.status(400).json({ message: 'Room is under maintenance' });
    }

    // Prevent self-overlap for same room
    const overlapSelf = await Booking.findOne({
      _id: { $ne: booking._id },
      guest: booking.guest,
      roomNumber: newRoomNumber,
      status: { $in: ['PendingPayment', 'Booked'] },
      checkIn: { $lt: newCheckOut },
      checkOut: { $gt: newCheckIn },
    });
    if (overlapSelf) {
      return res.status(400).json({ message: 'You already have a booking for this room that overlaps the selected dates' });
    }

    // Prevent overlap with already approved bookings by any user
    const overlapApproved = await Booking.findOne({
      _id: { $ne: booking._id },
      roomNumber: newRoomNumber,
      status: 'Booked',
      checkIn: { $lt: newCheckOut },
      checkOut: { $gt: newCheckIn },
    });
    if (overlapApproved) {
      return res.status(400).json({ message: 'Room is already booked for the selected dates' });
    }

    booking.roomNumber = newRoomNumber;
    booking.checkIn = newCheckIn;
    booking.checkOut = newCheckOut;
    if (typeof req.body.specialRequests !== 'undefined') booking.specialRequests = req.body.specialRequests;
    if (typeof req.body.paymentConfirmation !== 'undefined') booking.paymentConfirmation = req.body.paymentConfirmation;
    if (typeof req.body.status !== 'undefined') booking.status = req.body.status; // consider restricting externally
    await booking.save();
    res.json(booking);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Delete booking
export const deleteBooking = async (req, res) => {
  try {
    const id = req.params.id;
    console.log('[deleteBooking] user=', req.user?._id, 'role=', req.user?.role, 'id=', id);
    const deleted = await Booking.findByIdAndDelete(id);
    if (!deleted) return res.status(404).json({ message: 'Booking not found' });
    res.json({ message: 'Booking deleted', id });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Guest: delete own booking by ID (optional policy: allow when not Booked)
export const deleteMyBooking = async (req, res) => {
  try {
    const id = req.params.id;
    const booking = await Booking.findById(id);
    if (!booking) return res.status(404).json({ message: 'Booking not found' });
    if (String(booking.guest) !== String(req.user._id)) {
      return res.status(403).json({ message: 'Not authorized to delete this booking' });
    }
    // Optional policy: disallow deleting Approved bookings; require cancel instead
    // if (booking.status === 'Booked') return res.status(400).json({ message: 'Cannot delete an approved booking. Please cancel instead.' });
    await Booking.findByIdAndDelete(id);
    return res.json({ message: 'Booking deleted', id });
  } catch (error) {
    return res.status(500).json({ message: error.message });
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

    booking.status = target;
    await booking.save();
    // Do not alter Room.status here; availability is determined by date overlaps, not a global flag.
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
    return res.json({ message: 'Status updated', booking });
  } catch (error) {
    console.error('[setBookingStatus] Error:', error);
    res.status(500).json({ message: error.message });
  }
};
