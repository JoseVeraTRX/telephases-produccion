// src/App.js - VERSIÓN FINAL Y COMPLETA
import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import PatientListPage from './pages/PatientListPage';
import ProtectedRoute from './components/ProtectedRoute';
import PatientDashboardPage from './pages/PatientDashboardPage';
import PatientHistoryPage from './pages/PatientHistoryPage';
import RegisterPatientPage from './pages/RegisterPatientPage';
function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        
        {/* Rutas de Admin */}
        <Route path="/results" element={ <ProtectedRoute> <PatientListPage /> </ProtectedRoute> } />
        <Route path="/register-patient" element={ <ProtectedRoute> <RegisterPatientPage /> </ProtectedRoute> } />

        
        {/* Rutas de Paciente */}
        <Route path="/patient-dashboard" element={ <ProtectedRoute> <PatientDashboardPage /> </ProtectedRoute> } />
        <Route path="/patient-history" element={ <ProtectedRoute> <PatientHistoryPage /> </ProtectedRoute> } />
        
        <Route path="*" element={<Navigate to="/login" />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;