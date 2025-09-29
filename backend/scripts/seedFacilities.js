// Seed a few facilities to enable facility booking quickly
require('dotenv').config();
const mongoose = require('mongoose');
const Facility = require('../models/Facility');

const MONGO_URI = process.env.MONGO_URI;

if (!MONGO_URI) {
  console.error('Missing MONGO_URI in .env');
  process.exit(1);
}

async function run() {
  try {
    await mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });
    console.log('Connected to MongoDB');

    const samples = [
      {
        name: 'Conference Room',
        type: 'Conference Hall',
        description: 'Professional conference room with modern amenities.',
        location: 'Dambulla, Sri Lanka',
        amenities: ['WiFi', 'AC', 'Projector', 'Whiteboard'],
        images: [],
  // pricePerNight stored in LKR (Sri Lankan Rupees)
  pricePerNight: 120,
        maxGuests: 200,
        isAvailable: true,
        features: { wifi: true, airConditioning: true, parking: false, roomService: false, spa: false, gym: false, pool: false, restaurant: false },
        rating: 4.5,
        totalReviews: 120,
      },
      {
        name: 'Event Hall',
        type: 'Conference Hall',
        description: 'Spacious reception hall for weddings and events.',
        location: 'Dambulla, Sri Lanka',
        amenities: ['WiFi', 'AC', 'Sound System', 'Stage', 'Catering Service'],
        images: [],
  // pricePerNight stored in LKR (Sri Lankan Rupees)
  pricePerNight: 220,
        maxGuests: 200,
        isAvailable: true,
        features: { wifi: true, airConditioning: true, parking: true, roomService: false, spa: false, gym: false, pool: false, restaurant: true },
        rating: 4.8,
        totalReviews: 85,
      },
    ];

    // Upsert by name to avoid duplicates
    for (const s of samples) {
      const existing = await Facility.findOne({ name: s.name });
      if (existing) {
        console.log(`✔ Facility exists: ${s.name}`);
      } else {
        await Facility.create(s);
        console.log(`＋ Created facility: ${s.name}`);
      }
    }

    console.log('Seeding complete.');
  } catch (err) {
    console.error('Seeding error:', err.message);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

run();
