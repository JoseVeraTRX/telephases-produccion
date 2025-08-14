// src/pages/PatientDashboardPage.js - VERSIÓN FINAL "A PRUEBA DE BALAS"
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import './PatientDashboard.css';
import { ReactComponent as Logo } from '../assets/logo-intelicare.svg';

const PatientDashboardPage = () => {
  const [dashboardData, setDashboardData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const response = await api.get('/patients/me/dashboard');
        setDashboardData(response.data);
      } catch (error) {
        console.error("Error al cargar los datos del dashboard", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchDashboardData();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    navigate('/login');
  };
  
  const getTranslatedExamName = (examName) => {
    if (typeof examName !== 'string') return "Desconocido";
    const nameMap = {
      'OXYGEN_SATURATION': 'Saturación de Oxígeno','BLOOD_PRESSURE': 'Presión Arterial','TEMPERATURE': 'Temperatura','GLUCOSE': 'Glucosa','HEART_RATE': 'Frecuencia Cardíaca','WEIGHT': 'Peso','BMI': 'Índice de Masa Corporal (IMC)','BLOOD_PRESSURE_DIASTOLIC': 'Presión Diastólica','BLOOD_PRESSURE_SYSTOLIC': 'Presión Sistólica',
    };
    return nameMap[examName] || examName;
  };

  if (isLoading) {
    return <div className="loading-container">Cargando...</div>;
  }

  if (!dashboardData) {
    return (
      <div className="loading-container">
        No se pudieron cargar los datos. Por favor, <span onClick={() => navigate('/login')} style={{cursor: 'pointer', textDecoration: 'underline'}}>intenta iniciar sesión de nuevo</span>.
      </div>
    );
  }

  return (
    <div className="patient-dashboard">
      <header className="dashboard-header">
        <Logo className="header-logo" />
        <button onClick={handleLogout} className="logout-button">
          <span className="material-symbols-outlined">logout</span>
          Cerrar Sesión
        </button>
      </header>

      <main className="dashboard-content">
        <h1>Hola, {dashboardData?.profile?.primer_nombre}!</h1>
        <p className="welcome-message">Aquí tienes un resumen de tus mediciones más recientes.</p>

        <div className="metrics-grid">
          {Array.isArray(dashboardData?.latestExams) && dashboardData.latestExams.map(exam => (
            exam && (
              <div key={exam.id} className="metric-card" style={{ borderTop: `5px solid ${exam.estado_color || '#ccc'}` }}>
                <h3 className="metric-title">{getTranslatedExamName(exam.tipo_examen_nombre)}</h3>
                <p className="metric-value">{exam.valor} <span className="metric-unit">{exam.unidad}</span></p>
                <p className="metric-status" style={{ color: exam.estado_color || '#333' }}>
                  <span className="estado-emoji">{exam.estado_emoji}</span> {exam.estado_nombre}
                </p>
                <p className="metric-date">
                  Última medición: {new Date(exam.fecha_creacion).toLocaleDateString()}
                </p>
              </div>
            )
          ))}
        </div>
        
        <div className="history-link">
          <button onClick={() => navigate('/patient-history')}>
            Ver Historial Completo de Exámenes
          </button>
        </div>
      </main>
    </div>
  );
};

export default PatientDashboardPage;