import mongoose from 'mongoose';
import Facility from '../models/Facility.js';
import FacilityBooking from '../models/FacilityBooking.js';

// Get all facilities
export const getAllFacilities = async (req, res) => {
  try {
    const { type, location, minPrice, maxPrice } = req.query;
    let filter = { isAvailable: true };
    
    if (type) filter.type = type;
    if (location) filter.location = { $regex: location, $options: 'i' };
    if (minPrice || maxPrice) {
      filter.pricePerNight = {};
      if (minPrice) filter.pricePerNight.$gte = Number(minPrice);
      if (maxPrice) filter.pricePerNight.$lte = Number(maxPrice);
    }
    
  const facilities = await Facility.find(filter).sort({ rating: -1, pricePerNight: 1 });
  res.json({ currency: 'LKR', symbol: 'Rs.', items: facilities });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get facility by ID
export const getFacilityById = async (req, res) => {
  try {
    const facility = await Facility.findById(req.params.id);
    if (!facility) {
      return res.status(404).json({ message: 'Facility not found' });
    }
  res.json({ currency: 'LKR', symbol: 'Rs.', item: facility });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Create facility (Admin/Staff only)
export const createFacility = async (req, res) => {
  try {
    const facility = await Facility.create(req.body);
  res.status(201).json({ currency: 'LKR', symbol: 'Rs.', item: facility });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update facility (Admin/Staff only)
export const updateFacility = async (req, res) => {
  try {
    const facility = await Facility.findById(req.params.id);
    if (!facility) {
      return res.status(404).json({ message: 'Facility not found' });
    }
    Object.assign(facility, req.body);
    await facility.save();
  res.json({ currency: 'LKR', symbol: 'Rs.', item: facility });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Delete facility (Admin only)
export const deleteFacility = async (req, res) => {
  try {
    const facility = await Facility.findById(req.params.id);
    if (!facility) {
      return res.status(404).json({ message: 'Facility not found' });
    }
    await facility.deleteOne();
    res.json({ message: 'Facility deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Create facility booking
export const createFacilityBooking = async (req, res) => {
  try {
    const { 
      facilityId, 
      checkIn, 
      checkOut, 
      numberOfGuests, 
      discountCode, 
      flexibleDates, 
      specialRequests,
      contactInfo 
    } = req.body;

    // Basic payload validation
    if (!req.user || !req.user._id) {
      return res.status(401).json({ message: 'Not authorized, user missing' });
    }
    if (!facilityId) {
      return res.status(400).json({ message: 'facilityId is required' });
    }
    if (!mongoose.isValidObjectId(facilityId)) {
      return res.status(400).json({ message: 'Invalid facilityId' });
    }
    if (!checkIn || !checkOut) {
      return res.status(400).json({ message: 'checkIn and checkOut are required' });
    }
    if (!numberOfGuests || Number(numberOfGuests) < 1) {
      return res.status(400).json({ message: 'numberOfGuests must be at least 1' });
    }
    // Contact info required
    if (!contactInfo || !contactInfo.phone || !contactInfo.email || !contactInfo.emergencyContact) {
      return res.status(400).json({ message: 'phone, email and emergencyContact are required in contactInfo' });
    }
    const phone = String(contactInfo.phone).trim();
    const email = String(contactInfo.email).trim();
    const emergencyContact = String(contactInfo.emergencyContact).trim();
    if (!/^[0-9]{9,15}$/.test(phone)) {
      return res.status(400).json({ message: 'Invalid phone format (digits only 9-15)' });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ message: 'Invalid email format' });
    }
    if (!/^[0-9]{9,15}$/.test(emergencyContact)) {
      return res.status(400).json({ message: 'Invalid emergencyContact format (digits only 9-15)' });
    }

    // Get facility details
    const facility = await Facility.findById(facilityId);
    if (!facility) {
      return res.status(404).json({ message: 'Facility not found' });
    }

    if (!facility.isAvailable) {
      return res.status(400).json({ message: 'Facility is not available' });
    }

    const guests = Number(numberOfGuests);
    if (guests > facility.maxGuests) {
      return res.status(400).json({ message: `Maximum guests allowed: ${facility.maxGuests}` });
    }

    // Calculate dates and pricing
  const checkInDate = new Date(checkIn);
  const checkOutDate = new Date(checkOut);
  const todayMidnight = new Date(); todayMidnight.setHours(0,0,0,0);

    if (isNaN(checkInDate.getTime()) || isNaN(checkOutDate.getTime())) {
      return res.status(400).json({ message: 'Invalid date format for checkIn/checkOut' });
    }
    if (checkInDate < todayMidnight) {
      return res.status(400).json({ message: 'Check-in cannot be in the past' });
    }
    const totalNights = Math.ceil((checkOutDate - checkInDate) / (1000 * 60 * 60 * 24));
    
    if (totalNights <= 0) {
      return res.status(400).json({ message: 'Check-out date must be after check-in date' });
    }

    const pricePerNight = facility.pricePerNight;
    const totalAmount = totalNights * pricePerNight;
    
    // Apply discount if provided
    let discountAmount = 0;
    if (discountCode) {
      const code = String(discountCode).trim().toUpperCase();
      if (!/^[A-Z0-9]{4,15}$/.test(code)) {
        return res.status(400).json({ message: 'Invalid discount code format' });
      }
      if (code === 'HERITAGE10') {
        discountAmount = totalAmount * 0.1;
      } else if (code === 'EARLY20') {
        discountAmount = totalAmount * 0.2;
      }
    }

    let sanitizedRequests = specialRequests;
    if (sanitizedRequests && typeof sanitizedRequests === 'string') {
      sanitizedRequests = sanitizedRequests.trim();
      if (sanitizedRequests.length > 400) {
        return res.status(400).json({ message: 'Special requests must be 400 characters or less' });
      }
    }
    
    const finalAmount = totalAmount - discountAmount;

    // Check for existing bookings
    const existingBooking = await FacilityBooking.findOne({
      facility: facilityId,
      $or: [
        {
          checkIn: { $lte: checkInDate },
          checkOut: { $gt: checkInDate }
        },
        {
          checkIn: { $lt: checkOutDate },
          checkOut: { $gte: checkOutDate }
        },
        {
          checkIn: { $gte: checkInDate },
          checkOut: { $lte: checkOutDate }
        }
      ],
      status: { $in: ['Pending', 'Confirmed', 'CheckedIn'] }
    });

    if (existingBooking) {
      return res.status(400).json({ message: 'Facility is already booked for these dates' });
    }

    // Create booking initially in PendingPayment status
    const booking = await FacilityBooking.create({
      guest: req.user._id,
      facility: facilityId,
      checkIn: checkInDate,
      checkOut: checkOutDate,
      numberOfGuests: guests,
      totalNights,
      pricePerNight,
      totalAmount,
      discountCode,
      discountAmount,
      finalAmount,
      flexibleDates,
  specialRequests: sanitizedRequests,
      contactInfo,
  // ensure sanitized contactInfo saved
  // (trimmed already)
      status: 'PendingPayment',
      paymentStatus: 'Pending'
    });

    await booking.populate('facility guest');
  res.status(201).json({ currency: 'LKR', symbol: 'Rs.', item: booking });
  } catch (error) {
    console.error('createFacilityBooking error:', error);
    res.status(500).json({ message: error.message || 'Internal Server Error' });
  }
};

// Get user's facility bookings
export const getMyFacilityBookings = async (req, res) => {
  try {
    const bookings = await FacilityBooking.find({ guest: req.user._id })
      .populate('facility', 'name type location images pricePerNight')
      .populate('guest', 'name email')
      .sort({ createdAt: -1 });
  res.json({ currency: 'LKR', symbol: 'Rs.', items: bookings });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get all facility bookings (Staff/Admin)
export const getAllFacilityBookings = async (req, res) => {
  try {
    const bookings = await FacilityBooking.find()
      .populate('facility guest staff')
      .sort({ createdAt: -1 });
  res.json({ currency: 'LKR', symbol: 'Rs.', items: bookings });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update facility booking
export const updateFacilityBooking = async (req, res) => {
  try {
    const booking = await FacilityBooking.findById(req.params.id);
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    // Only allow guest to update their own booking or staff/admin to update any
    const isOwner = booking.guest.toString() === req.user._id.toString();
    const isStaffOrAdmin = ['Staff', 'Admin'].includes(req.user.role);
    
    if (!isOwner && !isStaffOrAdmin) {
      return res.status(403).json({ message: 'Not authorized to update this booking' });
    }

    Object.assign(booking, req.body);
    await booking.save();
    await booking.populate('facility guest');
  res.json({ currency: 'LKR', symbol: 'Rs.', item: booking });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Cancel facility booking
export const cancelFacilityBooking = async (req, res) => {
  try {
    const booking = await FacilityBooking.findById(req.params.id);
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    // Only allow guest to cancel their own booking or staff/admin to cancel any
    const isOwner = booking.guest.toString() === req.user._id.toString();
    const isStaffOrAdmin = ['Staff', 'Admin'].includes(req.user.role);
    
    if (!isOwner && !isStaffOrAdmin) {
      return res.status(403).json({ message: 'Not authorized to cancel this booking' });
    }

    booking.status = 'Cancelled';
    await booking.save();
    res.json({ message: 'Booking cancelled successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Delete facility booking (Admin only)
export const deleteFacilityBooking = async (req, res) => {
  try {
    const booking = await FacilityBooking.findById(req.params.id);
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    // Only allow admin to delete bookings
    if (!['Admin'].includes(req.user.role)) {
      return res.status(403).json({ message: 'Not authorized to delete this booking' });
    }

    await booking.deleteOne();
    res.json({ message: 'Booking deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Mark facility booking as paid (Staff/Admin or owner auto-confirm if policy allows)
export const markFacilityBookingPaid = async (req, res) => {
  try {
    const booking = await FacilityBooking.findById(req.params.id).populate('facility guest');
    if (!booking) return res.status(404).json({ message: 'Booking not found' });

    const isOwner = booking.guest && booking.guest._id.toString() === req.user._id.toString();
    const isStaffOrAdmin = ['Staff','Admin'].includes(req.user.role);
    if (!isOwner && !isStaffOrAdmin) {
      return res.status(403).json({ message: 'Not authorized to modify this booking' });
    }

    if (booking.status !== 'PendingPayment') {
      return res.status(400).json({ message: 'Booking not in PendingPayment state' });
    }

    booking.status = 'Confirmed';
    booking.paymentStatus = 'Paid';
    if (req.body.paymentConfirmation) booking.paymentConfirmation = req.body.paymentConfirmation;
    await booking.save();
    res.json({ currency: 'LKR', symbol: 'Rs.', item: booking });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};