const mongoose = require('mongoose');

const roomSchema = new mongoose.Schema(
  {
    roomNumber: { type: String, required: true, unique: true, trim: true },
    type: { type: String, required: true, enum: ['Single', 'Double', 'Suite'] },
    price: { type: Number, required: true, min: 0 },
    amenities: [{ type: String }],
    status: { type: String, enum: ['Available', 'Booked', 'Maintenance'], default: 'Available' },
    photos: [{ type: String }], // store URL/path strings
    description: { type: String },
    capacity: { type: Number, default: 2, min: 1 },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Room', roomSchema);
