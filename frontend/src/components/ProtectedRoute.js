// src/components/ProtectedRoute.js
import React from 'react';
import { Navigate } from 'react-router-dom';

const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem('authToken');
  if (!token) {
    // Si no hay token, redirige al login
    return <Navigate to="/login" />;
  }
  return children; // Si hay token, muestra la página solicitada
};

export default ProtectedRoute;