import React from 'react';
import { Navigate } from 'react-router-dom';
import { decodeToken, hasRole } from '../utils/authHelper';

const ProtectedRoute = ({ children, roles }) => {
  const token = localStorage.getItem('token');
  if (!token) return <Navigate to="/login" />;
  const user = decodeToken(token);
  console.log('Decoded token:', user);
  if (!user) return <Navigate to="/login" />;
  if (roles && !hasRole(user, roles)) {
    console.log('Role check failed. User:', user, 'Required roles:', roles);
    return <Navigate to="/login" />;
  }
  return children;
};

export default ProtectedRoute;
