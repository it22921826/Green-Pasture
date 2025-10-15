import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Login from './pages/Login';
import Register from './pages/Register';
import Profile from './pages/Profile';
import BookingForm from './pages/BookingForm';
import FacilityBooking from './pages/FacilityBooking';
import MyBookings from './pages/MyBookings';
import StaffDashboard from './pages/StaffDashboard';
import ProtectedRoute from './components/ProtectedRoute';
import Home from './pages/Home';
import StaffManagement from './pages/StaffManagement';
import Settings from './pages/Settings';
import Footer from './components/Footer';
import FloatingSupport from './components/FloatingSupport';
import Feedback from './pages/Feedback';
import Rooms from './pages/Rooms';
import RoomDetails from './pages/RoomDetails';
import GuestPayment from './components/Payment';
import RefundStatus from './pages/RefundStatus';

function App() {
  return (
    <Router>
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
  <Route path="/settings" element={<ProtectedRoute roles={["Guest","User","Staff","Admin"]}><Settings /></ProtectedRoute>} />
  <Route path="/book" element={<ProtectedRoute roles={["Guest","User"]}><BookingForm /></ProtectedRoute>} />
  <Route path="/facility-booking" element={<ProtectedRoute roles={["Guest","User","Staff","Admin"]}><FacilityBooking /></ProtectedRoute>} />
  <Route path="/my-bookings" element={<ProtectedRoute roles={["Guest","User"]}><MyBookings /></ProtectedRoute>} />
        <Route path="/dashboard" element={<ProtectedRoute roles={["Staff","Admin"]}><StaffDashboard /></ProtectedRoute>} />
        <Route path="/staff-management" element={<ProtectedRoute roles={["Staff","Admin"]}><StaffManagement /></ProtectedRoute>} />
        <Route path="/feedback" element={<Feedback />} />
        <Route path="/rooms" element={<Rooms />} />
        <Route path="/rooms/:id" element={<RoomDetails />} />
  <Route path="/payment" element={<ProtectedRoute roles={["Guest","User","Staff","Admin"]}><GuestPayment /></ProtectedRoute>} />
    <Route path="/refund-status" element={<ProtectedRoute roles={["Guest","User"]}><RefundStatus /></ProtectedRoute>} />
      </Routes>
      <FloatingSupport />
      <Footer />
    </Router>
  );
}

export default App;
