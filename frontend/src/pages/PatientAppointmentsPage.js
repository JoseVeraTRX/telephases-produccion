// src/pages/PatientAppointmentsPage.js
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import './Appointments.css';
import '../pages/AdminDashboard.css';
import { ReactComponent as Logo } from '../assets/logo-intelicare.svg';

const PatientAppointmentsPage = () => {
  const [citas, setCitas] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  const fetchMyCitas = async () => {
    setIsLoading(true);
    try {
      const response = await api.get('/citas/mis-citas');
      setCitas(response.data);
    } catch (error) {
      console.error("Error al cargar mis citas", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMyCitas();
  }, []);

  const handleCancel = async (citaId) => {
    if (window.confirm('¿Estás seguro de que deseas cancelar tu cita?')) {
      try {
        await api.put(`/citas/mis-citas/${citaId}/cancel`);
        fetchMyCitas(); // Refresca la lista para mostrar el estado actualizado
      } catch (error) {
        console.error("Error al cancelar la cita", error);
        alert('No se pudo cancelar la cita. Por favor, contacta al centro médico.');
      }
    }
  };

  const getTranslatedExamName = (examName) => {
    if (typeof examName !== 'string') return "Desconocido";
    const nameMap = {
      'OXYGEN_SATURATION': 'Saturación de Oxígeno', 'BLOOD_PRESSURE': 'Presión Arterial', 'TEMPERATURE': 'Temperatura', 'GLUCOSE': 'Glucosa', 'HEART_RATE': 'Frecuencia Cardíaca', 'WEIGHT': 'Peso', 'BMI': 'Índice de Masa Corporal (IMC)', 'BLOOD_PRESSURE_DIASTOLIC': 'Presión Diastólica', 'BLOOD_PRESSURE_SYSTOLIC': 'Presión Sistólica',
    };
    return nameMap[examName] || examName;
  };

  const getStatusClassName = (statusName) => {
    if (typeof statusName !== 'string') return '';
    const cleanStatus = statusName.split(' ')[0];
    return `status-${cleanStatus}`;
  };

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    navigate('/login');
  };

  return (
    <div className="results-page">
      <header className="header">
        <div className="header-branding">
          <Logo className="header-logo" />
          <h1>Mis Citas Programadas</h1>
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
        {isLoading ? (
          <p className="results-message">Cargando tus citas...</p>
        ) : (
          citas.length > 0 ? (
            <table className="results-table">
              <thead>
                <tr>
                  <th>Fecha de la Cita</th>
                  <th>Estado</th>
                  <th className="observations-cell">Exámenes Previstos</th>
                  <th className="observations-cell">Observaciones del Médico</th>
                  <th className="actions-cell">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {citas.map((cita) => {
                  const isCancellable = cita.estado_cita === 'Programada' || cita.estado_cita === 'Confirmada';
                  return (
                    <tr key={cita.cita_id}>
                      <td>{new Date(cita.fecha_cita).toLocaleString('es-CO', { dateStyle: 'long', timeStyle: 'short' })}</td>
                      <td>
                        <span className={`status-cell ${getStatusClassName(cita.estado_cita)}`}>
                          {cita.estado_cita}
                        </span>
                      </td>
                      <td className="observations-cell">
                        {cita.examenes_previstos ? cita.examenes_previstos.split(', ').map(getTranslatedExamName).join(', ') : 'N/A'}
                      </td>
                      <td className="observations-cell">{cita.observaciones_admin || 'N/A'}</td>
                      <td className="actions-cell">
                        <button 
                          className="action-button" 
                          title={isCancellable ? "Cancelar cita" : "Esta cita ya no se puede cancelar"}
                          disabled={!isCancellable}
                          onClick={() => handleCancel(cita.cita_id)}
                        >
                          <span className="material-symbols-outlined">
                            {isCancellable ? 'cancel' : 'do_not_disturb_on'}
                          </span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          ) : (
            <p className="results-message">No tienes ninguna cita programada.</p>
          )
        )}
      </div>
    </div>
  );
};

export default PatientAppointmentsPage;