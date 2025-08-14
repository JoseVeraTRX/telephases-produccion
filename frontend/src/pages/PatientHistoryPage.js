// src/pages/PatientHistoryPage.js - VERSIÓN FINAL Y CORRECTA
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import './PatientList.css';
import { ReactComponent as Logo } from '../assets/logo-intelicare.svg';
import ExamsTable from '../components/ExamsTable';

const PatientHistoryPage = () => {
  const [exams, setExams] = useState([]);
  const [patientProfile, setPatientProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchHistory = async () => {
      setIsLoading(true);
      try {
        const response = await api.get('/patients/me/exams');
        setExams(response.data);

        if (response.data && response.data.length > 0) {
          const firstExam = response.data[0];
          setPatientProfile({
            primer_nombre: firstExam.primer_nombre,
            primer_apellido: firstExam.primer_apellido,
            numero_documento: firstExam.numero_documento,
          });
        }
      } catch (error) {
        console.error("Error al cargar el historial del paciente", error);
        setExams([]);
        setPatientProfile(null);
      } finally {
        setIsLoading(false);
      }
    };
    fetchHistory();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    navigate('/login');
  };
  
  return (
    <div className="results-page">
      <header className="header">
        <div className="header-branding">
          <Logo className="header-logo" />
          <h1>Mi Historial de Exámenes</h1>
        </div>
        <div className="header-actions">
            <button onClick={() => navigate('/patient-dashboard')} className="logout-button">
                <span className="material-symbols-outlined">arrow_back</span>
                Volver
            </button>
            <button onClick={handleLogout} className="logout-button">
              <span className="material-symbols-outlined">logout</span>
              Cerrar Sesión
            </button>
        </div>
      </header>
      
      <div className="results-container">
        <ExamsTable 
          exams={exams} 
          patient={patientProfile} 
          isLoading={isLoading} 
        />
      </div>
    </div>
  );
};

export default PatientHistoryPage;