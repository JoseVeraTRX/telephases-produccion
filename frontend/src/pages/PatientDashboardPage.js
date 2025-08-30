import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import './PatientDashboard.css';
import { ReactComponent as Logo } from '../assets/logo-intelicare.svg';
import ExamChart from '../components/ExamChart';

const PatientDashboardPage = () => {
  const [dashboardData, setDashboardData] = useState(null);
  const [allExams, setAllExams] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const [activeChartType, setActiveChartType] = useState(null);

  useEffect(() => {
    const fetchAllData = async () => {
      setIsLoading(true);
      try {
        const [dashboardRes, allExamsRes] = await Promise.all([
          api.get('/patients/me/dashboard'),
          api.get('/patients/me/exams')
        ]);
        setDashboardData(dashboardRes.data);
        setAllExams(allExamsRes.data);
      } catch (error) {
        console.error("Error al cargar los datos de la página", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchAllData();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    navigate('/login');
  };

  const getTranslatedExamName = (examName) => {
    if (typeof examName !== 'string') return "Desconocido";
    const nameMap = { 'OXYGEN_SATURATION': 'Saturación de Oxígeno', 'BLOOD_PRESSURE': 'Presión Arterial', 'TEMPERATURE': 'Temperatura', 'GLUCOSE': 'Glucosa', 'HEART_RATE': 'Frecuencia Cardíaca', 'WEIGHT': 'Peso', 'BMI': 'Índice de Masa Corporal (IMC)', 'BLOOD_PRESSURE_DIASTOLIC': 'Presión Diastólica', 'BLOOD_PRESSURE_SYSTOLIC': 'Presión Sistólica' };
    return nameMap[examName] || examName;
  };

  if (isLoading || !dashboardData) {
    return <div className="loading-container"><h1>Cargando tus datos...</h1><p>Un momento por favor.</p></div>;
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
        <h1>Hola, {dashboardData.profile.primer_nombre}!</h1>
        <p className="welcome-message">Aquí tienes un resumen de tu salud. Haz clic en una tarjeta para ver la evolución.</p>

        <div className="metrics-grid">
          {dashboardData.latestExams.map(exam => (
            exam && (
              <div 
                key={exam.id} 
                className={`metric-card ${activeChartType === exam.tipo_examen_nombre ? 'active-chart' : ''}`}
                style={{ borderTop: `5px solid ${exam.estado_color || '#ccc'}` }} 
                onClick={() => setActiveChartType(activeChartType === exam.tipo_examen_nombre ? null : exam.tipo_examen_nombre)}
              >
                <h3 className="metric-title">{getTranslatedExamName(exam.tipo_examen_nombre)}</h3>
                <p className="metric-value">{exam.valor} <span className="metric-unit">{exam.unidad}</span></p>
                <p className="metric-status" style={{ color: exam.estado_color || '#333' }}><span className="estado-emoji">{exam.estado_emoji}</span> {exam.estado_nombre}</p>
                <p className="metric-date">Última medición: {new Date(exam.fecha_creacion).toLocaleDateString()}</p>
              </div>
            )
          ))}
        </div>
        
        {activeChartType && (
            <div className="chart-display-container">
                <div className="chart-header">
                    <h3>Evolución de {getTranslatedExamName(activeChartType)}</h3>
                    <button className="close-chart-btn" onClick={() => setActiveChartType(null)}>&times;</button>
                </div>
                <ExamChart exams={allExams} examType={activeChartType} />
            </div>
        )}
        
        <div className="history-link">
          <button onClick={() => navigate('/my-appointments')}>Ver Mis Citas</button>
          <button onClick={() => navigate('/patient-history')}>Ver Historial Completo de Exámenes</button>
        </div>
      </main>
    </div>
  );
};

export default PatientDashboardPage;