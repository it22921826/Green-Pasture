const Booking = require('../models/Booking');

// Create booking
exports.createBooking = async (req, res) => {
  try {
    const { roomNumber, checkIn, checkOut, specialRequests, paymentConfirmation } = req.body;
    const status = paymentConfirmation ? 'Booked' : 'PendingPayment';
    const booking = await Booking.create({
      guest: req.user._id,
      roomNumber,
      checkIn,
      checkOut,
      specialRequests,
      paymentConfirmation: paymentConfirmation || undefined,
      status,
    });
    res.status(201).json(booking);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get bookings for user
exports.getMyBookings = async (req, res) => {
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
exports.getAllBookings = async (req, res) => {
  try {
    const bookings = await Booking.find().populate('guest staff');
    res.json(bookings);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update booking
exports.updateBooking = async (req, res) => {
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
exports.deleteBooking = async (req, res) => {
  try {
    await Booking.findByIdAndDelete(req.params.id);
    res.json({ message: 'Booking deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Mark booking as paid (called after payment proof accepted)
exports.markBookingPaid = async (req, res) => {
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
