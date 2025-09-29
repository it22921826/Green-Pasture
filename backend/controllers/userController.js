const User = require('../models/User');
const generateToken = require('../utils/generateToken');

// Register User/Staff/Guest
exports.register = async (req, res) => {
  try {
    const { name, email, password, phone, address, role, preferences, documents } = req.body;

    // Check if user already exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Create user
    const user = await User.create({
      name,
      email,
      password,
      phone,
      address,
      role,
      preferences,
      documents,
    });

    // Return user info with token
    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      token: generateToken(user._id, user.role),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Login
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // Check password
    const isPasswordValid = await user.matchPassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // Return user info with token
    res.status(200).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      token: generateToken(user._id, user.role),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get Profile
exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate('bookingHistory');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update Profile
exports.updateProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const { name, phone, address, preferences, documents } = req.body;

    user.name = name || user.name;
    user.phone = phone || user.phone;
    user.address = address || user.address;
    user.preferences = preferences || user.preferences;
    user.documents = documents || user.documents;

    const updatedUser = await user.save();

    res.json(updatedUser);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Admin: Get all users
exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find();
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Admin: Delete user
exports.deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    await user.remove();
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Delete Guest User
exports.deleteGuest = async (req, res) => {
  try {
    console.log('deleteGuest: Route hit');
    console.log('deleteGuest: Requesting user:', req.user && { id: req.user._id?.toString?.(), role: req.user.role });
    console.log('deleteGuest: Target guest ID:', req.params.id);

    if (!req.params.id) {
      return res.status(400).json({ message: 'Guest ID is required' });
    }

    // Guests can only delete themselves
    const requesterRole = req.user?.role;
    const requesterId = req.user?._id?.toString?.();
    if (requesterRole === 'Guest' && requesterId !== req.params.id) {
      return res.status(403).json({ message: 'Guests can only delete their own account' });
    }

    console.log('deleteGuest: Checking if user exists');
    const user = await User.findById(req.params.id);
    if (!user) {
      console.log('deleteGuest: User not found');
      return res.status(404).json({ message: 'User not found' });
    }

    console.log('deleteGuest: Deleting user...');
    await User.findByIdAndDelete(req.params.id);

    console.log('deleteGuest: Deletion successful');
    res.status(200).json({ message: 'Guest user deleted successfully' });
  } catch (error) {
    console.error('deleteGuest: Error occurred:', error);
    res.status(500).json({ message: 'Failed to delete guest user', error: error.message });
  }
};

// Change Password
exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    console.log('changePassword: Request received', {
      userId: req.user?._id?.toString?.(),
      hasCurrent: Boolean(currentPassword),
      hasNew: Boolean(newPassword),
    });

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'Current and new password are required' });
    }

    if (currentPassword === newPassword) {
      return res.status(400).json({ message: 'New password must be different from current password' });
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      console.log('changePassword: User not found');
      return res.status(404).json({ message: 'User not found' });
    }

    const isValid = await user.matchPassword(currentPassword);
    console.log('changePassword: Current password valid?', isValid);
    if (!isValid) {
      return res.status(400).json({ message: 'Current password is incorrect' });
    }

    user.password = newPassword; // hashed by pre-save hook
    await user.save();
    console.log('changePassword: Password updated for user', user._id.toString());

    res.status(200).json({ message: 'Password updated successfully' });
  } catch (error) {
    console.error('changePassword: Error', error);
    res.status(500).json({ message: 'Failed to change password', error: error.message });
  }
};
