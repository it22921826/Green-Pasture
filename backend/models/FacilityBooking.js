const mongoose = require('mongoose');

const facilityBookingSchema = new mongoose.Schema({
  guest: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  facility: { type: mongoose.Schema.Types.ObjectId, ref: 'Facility', required: true },
  staff: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  checkIn: { type: Date, required: true },
  checkOut: { type: Date, required: true },
  numberOfGuests: { type: Number, required: true, min: 1 },
  totalNights: { type: Number, required: true },
  pricePerNight: { type: Number, required: true },
  totalAmount: { type: Number, required: true },
  discountCode: { type: String },
  discountAmount: { type: Number, default: 0 },
  finalAmount: { type: Number, required: true },
  flexibleDates: { type: Boolean, default: false },
  specialRequests: { type: String },
  // Booking lifecycle: PendingPayment -> Confirmed -> CheckedIn -> CheckedOut (or Cancelled)
  status: { 
    type: String, 
    enum: ['PendingPayment', 'Confirmed', 'CheckedIn', 'CheckedOut', 'Cancelled'], 
    default: 'PendingPayment' 
  },
  paymentStatus: {
    type: String,
    enum: ['Pending', 'Paid', 'Failed', 'Refunded'],
    default: 'Pending'
  },
  paymentConfirmation: { type: String }, // URL or file path
  // Generate a default booking reference at document creation time
  bookingReference: {
    type: String,
    unique: true,
    default: () =>
      'FB' + Date.now() + Math.random().toString(36).slice(2, 6).toUpperCase(),
  },
  contactInfo: {
    phone: { type: String },
    email: { type: String },
    emergencyContact: { type: String }
  },
  benefits: {
    bestRateGuaranteed: { type: Boolean, default: true },
    upgradeAvailable: { type: Boolean, default: true },
    earlyCheckIn: { type: Boolean, default: true }
  }
}, { timestamps: true });

module.exports = mongoose.model('FacilityBooking', facilityBookingSchema);