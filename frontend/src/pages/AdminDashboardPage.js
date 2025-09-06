import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import './AdminDashboard.css';
import PatientExamsModal from '../components/PatientExamsModal';
import { ReactComponent as Logo } from '../assets/logo-intelicare.svg';
import ExamChart from '../components/ExamChart';

const AdminDashboardPage = () => {
  const [dashboardData, setDashboardData] = useState({ kpis: {}, alerts: [] });
  const [patients, setPatients] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [selectedPatientExams, setSelectedPatientExams] = useState([]);
  const [isModalLoading, setIsModalLoading] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('name');
  
  const [activePatientForChart, setActivePatientForChart] = useState(null);
  const chartContainerRef = useRef(null);

  // --- NUEVO (1/4): Estado para controlar la visibilidad del botón "Volver Arriba" ---
  const [showBackToTop, setShowBackToTop] = useState(false);

  const fetchPageData = async () => {
    setIsLoading(true);
    try {
      const [dashboardRes, patientsRes] = await Promise.all([
        api.get('/admin/dashboard'),
        api.get('/patients')
      ]);
      setDashboardData(dashboardRes.data);
      setPatients(patientsRes.data);
    } catch (error) {
      console.error("Error al cargar los datos de la página", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPageData();
  }, []);

  // --- NUEVO (2/4): Hook que escucha el scroll de la página para mostrar/ocultar el botón ---
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 300) {
        setShowBackToTop(true);
      } else {
        setShowBackToTop(false);
      }
    };
    // Se añade el listener al montar el componente
    window.addEventListener('scroll', handleScroll);
    // Se elimina el listener al desmontar el componente para evitar fugas de memoria
    return () => window.removeEventListener('scroll', handleScroll);
  }, []); // El array vacío asegura que este efecto se ejecute solo una vez

  const openExamsModal = async (patient) => {
    setSelectedPatient(patient);
    setIsModalLoading(true);
    try {
      const response = await api.get(`/patients/${patient.id}/exams`);
      setSelectedPatientExams(response.data);
    } catch (error) {
      console.error("Error al cargar los exámenes del paciente", error);
    } finally {
      setIsModalLoading(false);
    }
  };

  const closeModal = () => {
    setSelectedPatient(null);
    setSelectedPatientExams([]);
  };

  const handleShowChart = async (patient) => {
    if (activePatientForChart && activePatientForChart.id === patient.id) {
      setActivePatientForChart(null);
      return;
    }
    setIsLoading(true);
    try {
      const response = await api.get(`/patients/${patient.id}/exams`);
      setActivePatientForChart({ ...patient, exams: response.data });
      setTimeout(() => {
        // --- MODIFICACIÓN CLAVE: Cambiamos 'center' por 'end' ---
        // Esto hace que la vista se desplace hasta el final del contenedor de los gráficos.
        chartContainerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
      }, 100);
    } catch (error) {
      console.error("Error al cargar los exámenes para el gráfico", error);
    } finally {
      setIsLoading(false);
    }
  };
  
  // --- NUEVO (3/4): Función para desplazarse al inicio de la página ---
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const filteredAndSortedPatients = useMemo(() => {
    let result = [...patients];
    if (searchQuery) {
      result = result.filter(p => 
        (p.numero_documento && p.numero_documento.includes(searchQuery)) ||
        (`${p.primer_nombre} ${p.primer_apellido}`.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }
    if (sortBy === 'recent') {
      result.sort((a, b) => new Date(b.last_exam_date) - new Date(a.last_exam_date));
    } else {
      result.sort((a, b) => a.primer_apellido.localeCompare(b.primer_apellido));
    }
    return result;
  }, [patients, searchQuery, sortBy]);
  
  const handleLogout = () => {
    localStorage.removeItem('authToken');
    navigate('/login');
  };

  const getTranslatedExamName = (examName) => {
    if (typeof examName !== 'string') return "Desconocido";
    const nameMap = { 'OXYGEN_SATURATION': 'Saturación', 'BLOOD_PRESSURE': 'Presión Arterial', 'TEMPERATURE': 'Temperatura', 'GLUCOSE': 'Glucosa', 'HEART_RATE': 'Frec. Cardíaca', 'WEIGHT': 'Peso', 'BMI': 'IMC', 'BLOOD_PRESSURE_DIASTOLIC': 'Diastólica', 'BLOOD_PRESSURE_SYSTOLIC': 'Sistólica'};
    return nameMap[examName] || examName;
  };

  const uniqueExamTypesForPatient = useMemo(() => {
      if(!activePatientForChart || !activePatientForChart.exams) return [];
      const examNames = activePatientForChart.exams.map(e => e.tipo_examen_nombre);
      return [...new Set(examNames)];
  }, [activePatientForChart]);

  return (
    <div className="results-page">
      <header className="header">
        <div className="header-branding">
          <Logo className="header-logo" />
          <h1>Centro de Mando</h1>
        </div>
        <div className="header-actions">
            <button onClick={() => navigate('/appointments')} className="logout-button">
                <span className="material-symbols-outlined">calendar_month</span>
                Agenda
            </button>
            <button onClick={handleLogout} className="logout-button">
              <span className="material-symbols-outlined">logout</span>
              Cerrar Sesión
            </button>
        </div>
      </header>
      
      <div className="dashboard-section">
        <div className="kpi-grid">
          <div className="kpi-card">
            <span className="material-symbols-outlined kpi-icon">group</span>
            <div className="kpi-info">
              <p className="kpi-value">{dashboardData.kpis.totalPatients || 0}</p>
              <p className="kpi-label">Pacientes Activos</p>
            </div>
          </div>
          <div className="kpi-card">
            <span className="material-symbols-outlined kpi-icon">checklist</span>
            <div className="kpi-info">
              <p className="kpi-value">{dashboardData.kpis.examsToday || 0}</p>
              <p className="kpi-label">Exámenes Hoy</p>
            </div>
          </div>
          <div className="kpi-card">
            <span className="material-symbols-outlined kpi-icon">event_available</span>
            <div className="kpi-info">
              <p className="kpi-value">{dashboardData.kpis.appointmentsToday || 0}</p>
              <p className="kpi-label">Citas para Hoy</p>
            </div>
          </div>
        </div>
      </div>
      
      {dashboardData.alerts.length > 0 && (
        <div className="dashboard-section">
          <div className="alerts-panel">
            <h2>
              <span className="material-symbols-outlined">warning</span>
              Pacientes con Alertas Recientes (Últimas 48h)
            </h2>
            {dashboardData.alerts.map((alert, index) => (
              <div key={index} className="alert-item">
                <div className="alert-info">
                  <span className="estado-emoji" style={{fontSize: '1.5rem'}}>{alert.estado_emoji}</span>
                  <div>
                    <p className="patient-name">{alert.primer_nombre} {alert.primer_apellido}</p>
                    <p className="exam-details">
                      {getTranslatedExamName(alert.tipo_examen_nombre)}: <strong>{alert.valor} {alert.unidad}</strong>
                      <span style={{marginLeft: '15px', fontSize: '0.9em', color: '#777'}}>
                        ({new Date(alert.fecha_creacion).toLocaleString()})
                      </span>
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      
      <div className="toolbar">
        <form className="patient-search-form" onSubmit={(e) => e.preventDefault()}>
          <input type="text" placeholder="Buscar en lista de pacientes..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
          <button type="submit"><span className="material-symbols-outlined">search</span></button>t
        </form>
        <div className="toolbar-actions">
          <button onClick={() => navigate('/register-patient')} className="add-patient-button"><span className="material-symbols-outlined">person_add</span> Registrar Paciente</button>
          <button onClick={() => setSortBy('recent')} className={`button-base button-tertiary ${sortBy === 'recent' ? 'active' : ''}`}>Más Recientes</button>
          <button onClick={() => setSortBy('name')} className={`button-base button-tertiary ${sortBy === 'name' ? 'active' : ''}`}>Ordenar A-Z</button>
          <button onClick={fetchPageData} className="button-base button-tertiary" title="Actualizar todo"><span className="material-symbols-outlined">refresh</span></button>
        </div>
      </div>
      <div className="results-container">
        {isLoading ? ( <p className="results-message">Cargando pacientes...</p> ) : (
          <table className="results-table">
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Apellido</th>
                <th>Cédula</th>
                <th>N° de Exámenes</th>
                <th>Último Examen</th>
                <th className="actions-cell">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredAndSortedPatients.map((patient) => (
                <tr key={patient.id}>
                  <td>{patient.primer_nombre} {patient.segundo_nombre}</td>
                  <td>{patient.primer_apellido} {patient.segundo_apellido}</td>
                  <td>{patient.numero_documento}</td>
                  <td>{patient.exam_count}</td>
                  <td>{patient.last_exam_date ? new Date(patient.last_exam_date).toLocaleDateString() : 'N/A'}</td>
                  <td className="actions-cell">
                    <button className="action-button" title="Ver tabla de exámenes" onClick={() => openExamsModal(patient)}>
                      <span className="material-symbols-outlined">visibility</span>
                    </button>
                    <button className="action-button" title="Ver gráficos de evolución" onClick={() => handleShowChart(patient)}>
                      <span className="material-symbols-outlined">show_chart</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {activePatientForChart && (
        <div ref={chartContainerRef} className="chart-display-container">
            <div className="chart-header">
                <h3>Evolución de {activePatientForChart.primer_nombre} {activePatientForChart.primer_apellido}</h3>
                <button className="close-chart-btn" onClick={() => setActivePatientForChart(null)}>&times;</button>
            </div>
            {isModalLoading ? <p className="results-message">Cargando gráficos...</p> : (
                uniqueExamTypesForPatient.map(examType => (
                    <div key={examType} className="chart-wrapper">
                        <h4>{getTranslatedExamName(examType)}</h4>
                        <ExamChart exams={activePatientForChart.exams} examType={examType} />
                    </div>
                ))
            )}
        </div>
      )}
      
      {selectedPatient && <PatientExamsModal patient={selectedPatient} exams={selectedPatientExams} isLoading={isModalLoading} onClose={closeModal} />}
      
      {/* --- NUEVO (4/4): Renderizado condicional del botón para subir --- */}
      {showBackToTop && (
        <button onClick={scrollToTop} className="back-to-top-button" title="Volver arriba">
          <span className="material-symbols-outlined">arrow_upward</span>
        </button>
      )}
    </div>
  );
};

export default AdminDashboardPage;