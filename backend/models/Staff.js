import mongoose from 'mongoose';

const StaffSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
  },
  role: {
    type: String,
    required: [true, 'Role is required'],
    trim: true,
    match: [/^[A-Za-z\s]+$/, 'Role must contain letters and spaces only'],
  },
  department: {
    type: String,
    required: [true, 'Department is required'],
    trim: true,
    match: [/^[A-Za-z\s]+$/, 'Department must contain letters and spaces only'],
  },
  salary: {
    type: Number,
    required: [true, 'Salary is required'],
  },
  dateOfJoining: {
    type: Date,
    default: Date.now,
  },
});

const Staff = mongoose.model('Staff', StaffSchema);
export default Staff;