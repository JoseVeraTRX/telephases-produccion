import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import './Appointments.css';
import '../pages/AdminDashboard.css';
import { ReactComponent as Logo } from '../assets/logo-intelicare.svg';

const PatientAppointmentsPage = () => {
  const [citas, setCitas] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [notification, setNotification] = useState({ show: false, message: '', type: '' });
  const navigate = useNavigate();

  useEffect(() => {
    const fetchMyCitas = async () => {
      setIsLoading(true);
      try {
        const response = await api.get('/citas/mis-citas');
        setCitas(response.data);
      } catch (error) {
        console.error("Error al cargar mis citas", error);
        // showNotification('No se pudieron cargar tus citas.', 'error');
      } finally {
        setIsLoading(false);
      }
    };
    fetchMyCitas();
  }, []);

  const showNotification = (message, type) => {
    setNotification({ show: true, message, type });
    setTimeout(() => {
      setNotification({ show: false, message: '', type: '' });
    }, 4000);
  };

  const handleConfirm = async (citaId) => {
    if (window.confirm('¿Deseas confirmar tu asistencia para esta cita?')) {
      try {
        const response = await api.put(`/citas/mis-citas/${citaId}/confirm`);
        showNotification(response.data.message, 'success');
        // Para refrescar la lista, necesitamos una forma de llamar a fetchMyCitas de nuevo.
        // Por ahora, recargamos la página. Más adelante podemos mejorarlo.
        window.location.reload(); 
      } catch (error) {
        showNotification(error.response?.data?.message || 'No se pudo confirmar la cita.', 'error');
      }
    }
  };

  const handleCancel = async (citaId) => {
    if (window.confirm('¿Estás seguro de que deseas cancelar tu cita?')) {
      try {
        const response = await api.put(`/citas/mis-citas/${citaId}/cancel`);
        showNotification(response.data.message || 'Tu cita ha sido cancelada.', 'success');
        window.location.reload();
      } catch (error) {
        showNotification(error.response?.data?.message || 'No se pudo cancelar la cita.', 'error');
      }
    }
  };

  const getTranslatedExamName = (examName) => {
    if (typeof examName !== 'string') return "N/A";
    const nameMap = { 'OXYGEN_SATURATION': 'Saturación de Oxígeno', 'BLOOD_PRESSURE': 'Presión Arterial', 'TEMPERATURE': 'Temperatura', 'GLUCOSE': 'Glucosa', 'HEART_RATE': 'Frecuencia Cardíaca', 'WEIGHT': 'Peso', 'BMI': 'Índice de Masa Corporal (IMC)', 'BLOOD_PRESSURE_DIASTOLIC': 'Presión Diastólica', 'BLOOD_PRESSURE_SYSTOLIC': 'Presión Sistólica' };
    return examName.split(', ').map(name => nameMap[name] || name).join(', ');
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
      
      {notification.show && (
        <div className={`notification ${notification.type}`}>{notification.message}</div>
      )}

      <div className="results-container">
        {isLoading ? ( <p className="results-message">Cargando tus citas...</p> ) : (
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
                  const isProgramada = cita.estado_cita === 'Programada';
                  return (
                    <tr key={cita.cita_id} className={cita.is_new ? 'new-appointment-row' : ''}>
                      <td>
                        {cita.is_new && <span className="notification-dot" title="Nueva Cita"></span>}
                        {new Date(cita.fecha_cita).toLocaleString('es-CO', { dateStyle: 'long', timeStyle: 'short' })}
                      </td>
                      <td>
                        <span className={`status-cell ${getStatusClassName(cita.estado_cita)}`}>
                          {cita.estado_cita}
                        </span>
                      </td>
                      <td className="observations-cell">{getTranslatedExamName(cita.examenes_previstos)}</td>
                      <td className="observations-cell">{cita.observaciones_admin || 'N/A'}</td>
                      <td className="actions-cell">
                        {isProgramada && (
                          <button 
                            className="action-button confirm" 
                            title="Confirmar asistencia"
                            onClick={() => handleConfirm(cita.cita_id)}
                          >
                            <span className="material-symbols-outlined">event_available</span>
                          </button>
                        )}
                        <button 
                          className="action-button" 
                          title={isProgramada ? "Cancelar cita" : "Esta cita ya no se puede modificar"}
                          disabled={!isProgramada}
                          onClick={() => handleCancel(cita.cita_id)}
                        >
                          <span className="material-symbols-outlined">{isProgramada ? 'cancel' : 'do_not_disturb_on'}</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          ) : ( <p className="results-message">No tienes ninguna cita programada.</p> )
        )}
      </div>
    </div>
  );
};

export default PatientAppointmentsPage;