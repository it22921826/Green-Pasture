import User from '../models/User.js';
import generateToken from '../utils/generateToken.js';
import crypto from 'crypto';
import { sendEmail } from '../utils/nodemailer.js';

const hashOtp = (otp) => crypto.createHash('sha256').update(String(otp)).digest('hex');

// Register User/Staff/Guest
export const register = async (req, res) => {
  try {
    const { name, email, password, phone, address, role, preferences, documents } = req.body;

    // Check if user already exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Create user (unverified)
    const user = await User.create({
      name,
      email: String(email).toLowerCase(),
      password,
      phone,
      address,
      role,
      preferences,
      documents,
      isVerified: false,
    });

    // Generate and email OTP
    const otp = Math.floor(100000 + Math.random() * 900000);
    user.otpHash = hashOtp(otp);
    user.otpExpires = new Date(Date.now() + 10 * 60 * 1000);
    await user.save();
    try {
      await sendEmail({
        to: user.email,
        subject: 'Verify your Green Pasture account',
        text: `Your verification code is ${otp} (valid for 10 minutes).`,
        html: `<p>Your verification code is:</p><h2>${otp}</h2><p>Valid for 10 minutes.</p>`
      });
    } catch (mailErr) {
      console.error('[register] OTP email failed:', mailErr?.message || mailErr);
    }

    res.status(201).json({ message: 'Registered. Please check your email for the OTP to verify your account.' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Login
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email: String(email).toLowerCase() });
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // Check password
    const isPasswordValid = await user.matchPassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    if (!user.isVerified) {
      return res.status(403).json({ message: 'Please verify your email using the OTP sent to you.' });
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

export const verifyOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;
    const user = await User.findOne({ email: String(email).toLowerCase() });
    if (!user) return res.status(404).json({ message: 'User not found' });
    if (user.isVerified) return res.json({ message: 'Already verified' });
    if (!user.otpHash || !user.otpExpires) return res.status(400).json({ message: 'No OTP to verify' });
    if (user.otpExpires < new Date()) return res.status(400).json({ message: 'OTP expired' });
    if (user.otpHash !== hashOtp(otp)) return res.status(400).json({ message: 'Invalid OTP' });
    user.isVerified = true;
    user.otpHash = null;
    user.otpExpires = null;
    await user.save();
    return res.json({ message: 'Email verified successfully' });
  } catch (err) {
    return res.status(500).json({ message: 'Verification failed' });
  }
};

export const resendOtp = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email: String(email).toLowerCase() });
    if (!user) return res.status(404).json({ message: 'User not found' });
    if (user.isVerified) return res.status(400).json({ message: 'Account already verified' });
    const otp = Math.floor(100000 + Math.random() * 900000);
    user.otpHash = hashOtp(otp);
    user.otpExpires = new Date(Date.now() + 10 * 60 * 1000);
    await user.save();
    await sendEmail({
      to: user.email,
      subject: 'Your new OTP code',
      text: `OTP: ${otp} (valid for 10 minutes)`,
      html: `<p>OTP:</p><h2>${otp}</h2><p>Valid for 10 minutes.</p>`
    });
    return res.json({ message: 'OTP sent' });
  } catch (err) {
    return res.status(500).json({ message: 'Resend failed' });
  }
};

// Get Profile
export const getProfile = async (req, res) => {
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
export const updateProfile = async (req, res) => {
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
export const getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select('-password');
    console.log(`getAllUsers: by ${req.user?.email || req.user?._id} role=${req.user?.role} count=${users.length}`);
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Admin: Delete user
export const deleteUser = async (req, res) => {
  try {
    const target = await User.findById(req.params.id);
    if (!target) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Safety: disallow deleting own account through this endpoint
    if (target._id.toString() === req.user._id.toString()) {
      return res.status(400).json({ message: 'You cannot delete your own account via this endpoint' });
    }

    const requesterRole = (req.user.role || '').toLowerCase();
    const targetRole = (target.role || '').toLowerCase();

    // Staff can only delete non-staff, non-admin users
    if (requesterRole === 'staff') {
      if (targetRole === 'admin' || targetRole === 'staff') {
        return res.status(403).json({ message: 'Staff cannot delete Admin or Staff users' });
      }
    }

    await target.deleteOne();
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Delete Guest User
export const deleteGuest = async (req, res) => {
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
export const changePassword = async (req, res) => {
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
