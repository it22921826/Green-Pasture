import Staff from '../models/Staff.js';

// Get all staff members
export const getAllStaff = async (req, res) => {
  try {
    console.log('Fetching all staff records...'); // Debugging log
    const staff = await Staff.find();
    console.log('Staff records fetched:', staff); // Debugging log
    res.status(200).json(staff);
  } catch (error) {
    console.error('Error fetching staff records:', error); // Debugging log
    res.status(500).json({ message: 'Error fetching staff records', error });
  }
};

// Get a single staff member by ID
export const getStaffById = async (req, res) => {
  try {
    const staff = await Staff.findById(req.params.id);
    if (!staff) {
      return res.status(404).json({ message: 'Staff member not found' });
    }
    res.status(200).json(staff);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching staff record', error });
  }
};

// Create a new staff member
export const createStaff = async (req, res) => {
  try {
    console.log('[staffController] createStaff payload:', req.body);
    const newStaff = new Staff(req.body);
    const savedStaff = await newStaff.save();
    console.log('[staffController] created staff id:', savedStaff._id);
    res.status(201).json(savedStaff);
  } catch (error) {
    console.error('[staffController] createStaff error:', error.message);
    res.status(500).json({ message: 'Error creating staff record', error: error.message });
  }
};

// Update a staff member by ID
export const updateStaff = async (req, res) => {
  try {
    const updatedStaff = await Staff.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!updatedStaff) {
      return res.status(404).json({ message: 'Staff member not found' });
    }
    res.status(200).json(updatedStaff);
  } catch (error) {
    res.status(500).json({ message: 'Error updating staff record', error });
  }
};

// Delete a staff member by ID
export const deleteStaff = async (req, res) => {
  try {
    const deletedStaff = await Staff.findByIdAndDelete(req.params.id);
    if (!deletedStaff) {
      return res.status(404).json({ message: 'Staff member not found' });
    }
    res.status(200).json({ message: 'Staff member deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting staff record', error });
  }
};