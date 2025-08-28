import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import './AdminDashboard.css';
import PatientExamsModal from '../components/PatientExamsModal';
import { ReactComponent as Logo } from '../assets/logo-intelicare.svg';

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

  const filteredAndSortedPatients = useMemo(() => {
    let result = [...patients];
    if (searchQuery) {
      result = result.filter(p => 
        p.numero_documento.includes(searchQuery) ||
        `${p.primer_nombre} ${p.primer_apellido}`.toLowerCase().includes(searchQuery.toLowerCase())
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
    const nameMap = {
      'OXYGEN_SATURATION': 'Saturación de Oxígeno','BLOOD_PRESSURE': 'Presión Arterial','TEMPERATURE': 'Temperatura','GLUCOSE': 'Glucosa','HEART_RATE': 'Frecuencia Cardíaca','WEIGHT': 'Peso','BMI': 'Índice de Masa Corporal (IMC)','BLOOD_PRESSURE_DIASTOLIC': 'Presión Diastólica','BLOOD_PRESSURE_SYSTOLIC': 'Presión Sistólica',
    };
    return nameMap[examName] || examName;
  };

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
          <button type="submit"><span className="material-symbols-outlined">search</span></button>
        </form>
        <div className="toolbar-actions">
          <button onClick={() => navigate('/register-patient')} className="add-patient-button">
            <span className="material-symbols-outlined">person_add</span> Registrar Paciente 
          </button>
          <button onClick={() => setSortBy('recent')} className={sortBy === 'recent' ? 'active' : ''}>Más Recientes</button>
          <button onClick={() => setSortBy('name')} className={sortBy === 'name' ? 'active' : ''}>Ordenar A-Z</button>
          <button onClick={fetchPageData} className="refresh-button" title="Actualizar todo">
            <span className="material-symbols-outlined">refresh</span>
          </button>
        </div>
      </div>
      <div className="results-container">
        {isLoading ? ( <p className="results-message">Cargando pacientes...</p> ) : (
          <table className="results-table">
            <thead>
              <tr>
                <th className="actions-cell">Ver Exámenes</th>
                <th>Nombre</th>
                <th>Apellido</th>
                <th>Cédula</th>
                <th>N° de Exámenes</th>
                <th>Último Examen</th>
              </tr>
            </thead>
            <tbody>
              {filteredAndSortedPatients.map((patient) => (
                <tr key={patient.id}>
                  <td className="actions-cell">
                    <button className="action-button" onClick={() => openExamsModal(patient)}>
                      <span className="material-symbols-outlined">visibility</span>
                    </button>
                  </td>
                  <td>{patient.primer_nombre} {patient.segundo_nombre}</td>
                  <td>{patient.primer_apellido} {patient.segundo_apellido}</td>
                  <td>{patient.numero_documento}</td>
                  <td>{patient.exam_count}</td>
                  <td>{patient.last_exam_date ? new Date(patient.last_exam_date).toLocaleDateString() : 'N/A'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      {selectedPatient && <PatientExamsModal patient={selectedPatient} exams={selectedPatientExams} isLoading={isModalLoading} onClose={closeModal} />}
    </div>
  );
};

export default AdminDashboardPage;