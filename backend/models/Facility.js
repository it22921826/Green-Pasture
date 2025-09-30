import mongoose from 'mongoose';

const facilitySchema = new mongoose.Schema({
  name: { type: String, required: true },
  type: { 
    type: String, 
    required: true, 
    enum: [
      'Hotel', 
      'Resort', 
      'Villa', 
      'Suite', 
      'Conference Hall', 
      'Spa', 
      'Restaurant',
      // Newly added event-related / business facility types
      'Event',
      'Business Center',
      'Executive Lounge',
      'Outdoor Event Space'
    ] 
  },
  description: { type: String },
  location: { type: String, required: true },
  amenities: [{ type: String }],
  images: [{ type: String }],
  pricePerNight: { type: Number, required: true },
  maxGuests: { type: Number, required: true, default: 2 },
  isAvailable: { type: Boolean, default: true },
  features: {
    wifi: { type: Boolean, default: false },
    parking: { type: Boolean, default: false },
    airConditioning: { type: Boolean, default: false },
    roomService: { type: Boolean, default: false },
    spa: { type: Boolean, default: false },
    gym: { type: Boolean, default: false },
    pool: { type: Boolean, default: false },
    restaurant: { type: Boolean, default: false }
  },
  rating: { type: Number, min: 0, max: 5, default: 0 },
  totalReviews: { type: Number, default: 0 }
}, { timestamps: true });

const Facility = mongoose.model('Facility', facilitySchema);
export default Facility;