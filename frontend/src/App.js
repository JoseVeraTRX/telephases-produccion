// src/App.js - VERSIÓN FINAL Y COMPLETA
import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
// import PatientListPage from './pages/PatientListPage';
import AdminDashboardPage from './pages/AdminDashboardPage';
import ProtectedRoute from './components/ProtectedRoute';
import PatientDashboardPage from './pages/PatientDashboardPage';
import PatientHistoryPage from './pages/PatientHistoryPage';
import RegisterPatientPage from './pages/RegisterPatientPage';

// Importa las páginas nuevas para el manejo de CAMS
import AppointmentListPage from './pages/AppointmentListPage';
import AppointmentFormPage from './pages/AppointmentFormPage';
import CreateAppointmentPage from './pages/AppointmentFormPage';
import PatientAppointmentsPage from './pages/PatientAppointmentsPage';
function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        
        {/* Rutas de Admin */}
        <Route path="/results" element={ <ProtectedRoute> <AdminDashboardPage /> </ProtectedRoute> } />
        <Route path="/register-patient" element={ <ProtectedRoute> <RegisterPatientPage /> </ProtectedRoute> } />
        <Route path="/appointments" element={ <ProtectedRoute> <AppointmentListPage /> </ProtectedRoute> } />
        <Route path="/create-appointment" element={ <ProtectedRoute> <CreateAppointmentPage /> </ProtectedRoute> } />
        <Route path="/edit-appointment/:citaId" element={ <ProtectedRoute> <AppointmentFormPage /> </ProtectedRoute> } />

        
        {/* Rutas de Paciente */}
        <Route path="/patient-dashboard" element={ <ProtectedRoute> <PatientDashboardPage /> </ProtectedRoute> } />
        <Route path="/patient-history" element={ <ProtectedRoute> <PatientHistoryPage /> </ProtectedRoute> } />
        <Route path="/my-appointments" element={ <ProtectedRoute> <PatientAppointmentsPage /> </ProtectedRoute> } />

        <Route path="*" element={<Navigate to="/login" />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;