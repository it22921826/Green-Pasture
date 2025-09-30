import Booking from '../models/Booking.js';
import Room from '../models/Room.js';

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

    // Force status Booked for immediate reflection
    const booking = await Booking.create({
      guest: req.user._id,
      roomNumber,
      checkIn,
      checkOut,
      specialRequests,
      paymentConfirmation: paymentConfirmation || undefined,
      status: 'Booked'
    });

    // Update room status prior to responding
    room.status = 'Booked';
    await room.save();
    const freshRoom = await Room.findById(room._id); // ensure we send latest persisted doc
    console.log('[createBooking] Booking created and room marked booked:', { bookingId: booking._id, roomNumber });
    res.status(201).json({ booking, updatedRoom: freshRoom });
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
