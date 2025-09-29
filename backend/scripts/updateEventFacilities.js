// Script to update or create event-related facilities with specified prices and capacities
// Usage: node backend/scripts/updateEventFacilities.js

require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

const mongoose = require('mongoose');
const Facility = require('../models/Facility');

const TARGETS = [
  { name: 'Conference & Meeting Rooms', pricePerNight: 16000, maxGuests: 8 },
  { name: 'Ballrooms & Banquet Halls', pricePerNight: 200000, maxGuests: 200 },
  { name: 'Business Center', pricePerNight: 50000, maxGuests: 20 },
  { name: 'Executive Lounge', pricePerNight: 170000, maxGuests: 160 },
  { name: 'Outdoor/Unique Event Spaces', pricePerNight: 90000, maxGuests: 100 }
];

(async () => {
  const uri = process.env.MONGO_URI;
  if (!uri) {
    console.error('MONGO_URI not found. Ensure backend/.env contains it.');
    process.exit(1);
  }
  try {
    await mongoose.connect(uri);
    console.log('Connected to MongoDB');

    const results = [];
    for (const target of TARGETS) {
      const existing = await Facility.findOne({ name: target.name });
      if (existing) {
        existing.pricePerNight = target.pricePerNight;
        existing.maxGuests = target.maxGuests;
        existing.isAvailable = true;
        await existing.save();
        results.push({ action: 'updated', name: target.name });
      } else {
        const created = await Facility.create({
          name: target.name,
          type: 'Event',
          description: `${target.name} facility`,
          location: 'Sri Lanka',
            amenities: ['WiFi','Parking'],
          images: [],
          pricePerNight: target.pricePerNight,
          maxGuests: target.maxGuests,
          isAvailable: true,
          rating: 4.5,
          totalReviews: 0
        });
        results.push({ action: 'created', name: created.name });
      }
    }

    console.log('Summary:');
    results.forEach(r => console.log(` - ${r.action.toUpperCase()}: ${r.name}`));
  } catch (err) {
    console.error('Error updating facilities:', err);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
})();
