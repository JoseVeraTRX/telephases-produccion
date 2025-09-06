import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import './AdminDashboard.css';
import './PatientDashboard.css';
import { ReactComponent as Logo } from '../assets/logo-intelicare.svg';
import ExamsTable from '../components/ExamsTable';
import ExamChart from '../components/ExamChart';

const PatientHistoryPage = () => {
  const [exams, setExams] = useState([]);
  const [trends, setTrends] = useState({});
  const [patientProfile, setPatientProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const [activeChartType, setActiveChartType] = useState(null);
  const [showBackToTop, setShowBackToTop] = useState(false);

  const chartContainerRef = useRef(null);
  const chartRefs = useRef({});

  useEffect(() => {
    const fetchHistory = async () => {
      setIsLoading(true);
      try {
        const response = await api.get('/patients/me/exams');
        setExams(response.data.exams || []);
        setTrends(response.data.trends || {});

        if (response.data.exams && response.data.exams.length > 0) {
          const firstExam = response.data.exams[0];
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

    const handleScroll = () => {
      if (window.scrollY > 300) {
        setShowBackToTop(true);
      } else {
        setShowBackToTop(false);
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    navigate('/login');
  };

  const showChart = (examType) => {
    const newType = activeChartType === examType ? null : examType;
    setActiveChartType(newType);

    setTimeout(() => {
      if (newType && chartContainerRef.current) {
        chartContainerRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 100);
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  
  const getTranslatedExamName = (examName) => {
    if (typeof examName !== 'string') return "Desconocido";
    const nameMap = { 'OXYGEN_SATURATION': 'Saturación de Oxígeno', 'BLOOD_PRESSURE': 'Presión Arterial', 'TEMPERATURE': 'Temperatura', 'GLUCOSE': 'Glucosa', 'HEART_RATE': 'Frecuencia Cardíaca', 'WEIGHT': 'Peso', 'BMI': 'Índice de Masa Corporal (IMC)', 'BLOOD_PRESSURE_DIASTOLIC': 'Presión Diastólica', 'BLOOD_PRESSURE_SYSTOLIC': 'Presión Sistólica' };
    return nameMap[examName] || examName;
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
          onShowChart={showChart}
          trends={trends}
          chartRefs={chartRefs}
        />
      </div>

      {activeChartType && (
        <div ref={chartContainerRef} className="chart-display-container">
            <div className="chart-header">
                <h3>Evolución de {getTranslatedExamName(activeChartType)}</h3>
                <button className="close-chart-btn" onClick={() => setActiveChartType(null)}>&times;</button>
            </div>
            <ExamChart exams={exams} examType={activeChartType} />
        </div>
      )}
      
      <div style={{ position: 'absolute', left: '-9999px', top: '-9999px', zIndex: -1, opacity: 0 }}>
          {Object.keys(trends).map(examType => (
              <div key={`chart-hidden-${examType}`} style={{ width: 600, height: 300, background: 'white' }}>
                  <ExamChart
                      ref={(el) => (chartRefs.current[examType] = el)}
                      exams={exams} 
                      examType={examType}
                  />
              </div>
          ))}
      </div>

      {showBackToTop && (
        <button onClick={scrollToTop} className="back-to-top-button">
          <span className="material-symbols-outlined">arrow_upward</span>
        </button>
      )}
    </div>
  );
};

export default PatientHistoryPage;