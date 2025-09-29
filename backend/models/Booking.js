const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  guest: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  staff: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  roomNumber: { type: String, required: true },
  checkIn: { type: Date, required: true },
  checkOut: { type: Date, required: true },
  // Introduce PendingPayment state; booking is only 'Booked' after payment proof submission
  status: { type: String, enum: ['PendingPayment', 'Booked', 'CheckedIn', 'CheckedOut', 'Cancelled'], default: 'PendingPayment' },
  specialRequests: { type: String },
  paymentConfirmation: { type: String }, // payment proof filename or reference
}, { timestamps: true });

module.exports = mongoose.model('Booking', bookingSchema);
