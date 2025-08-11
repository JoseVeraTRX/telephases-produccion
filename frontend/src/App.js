// src/App.js - ACTUALIZADO
import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
// Importamos el nuevo nombre de la página ---
import PatientListPage from './pages/PatientListPage';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route
          path="/results" 
          element={
            <ProtectedRoute>
              {/* ---  Usamos el nuevo componente --- */}
              <PatientListPage />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<Navigate to="/login" />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;