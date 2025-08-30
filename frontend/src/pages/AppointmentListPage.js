import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import { usePopperTooltip } from 'react-popper-tooltip';
import api from '../services/api';
import './Appointments.css';
import '../pages/AdminDashboard.css';
import { ReactComponent as Logo } from '../assets/logo-intelicare.svg';
import AppointmentPopover from '../components/AppointmentPopover';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import 'moment/locale/es';

moment.locale('es');
const localizer = momentLocalizer(moment);

const AppointmentListPage = () => {
  const [citas, setCitas] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [viewMode, setViewMode] = useState('calendar');
  const navigate = useNavigate();
  const [selectedEvent, setSelectedEvent] = useState(null);

  const {
    getArrowProps,
    getTooltipProps,
    setTooltipRef,
    setTriggerRef,
    visible,
    hideTooltip,
  } = usePopperTooltip({
    trigger: 'click',
    closeOnOutsideClick: true,
    placement: 'auto',
    onVisibleChange: (isVisible) => {
        if (!isVisible) {
            setSelectedEvent(null);
            if (setTriggerRef) setTriggerRef(null);
        }
    }
  });

  const fetchCitas = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await api.get('/citas');
      setCitas(response.data);
    } catch (error) { 
      console.error("Error al cargar citas", error); 
    } finally { 
      setIsLoading(false); 
    }
  }, []);

  useEffect(() => { 
    fetchCitas(); 
  }, [fetchCitas]);

  const events = useMemo(() => {
    return citas.map(cita => ({
      title: `${cita.paciente_nombre} ${cita.paciente_apellido}`,
      start: new Date(cita.fecha_cita),
      end: new Date(new Date(cita.fecha_cita).getTime() + 60 * 60 * 1000),
      resource: cita,
    }));
  }, [citas]);

  const handleSelectEvent = (event, e) => {
    if (e.target.classList.contains('rbc-show-more')) return;
    setSelectedEvent(event);
    if (setTriggerRef) setTriggerRef(e.currentTarget);
  };

  
  const handleEditFromPopover = () => {
    if (!selectedEvent) return;
    const citaId = selectedEvent.resource.cita_id;
    navigate(`/edit-appointment/${citaId}`);
  };
  
  const handleCancelFromPopover = async (citaId) => {
    if (window.confirm('¿Confirmas que deseas cancelar esta cita?')) {
      try {
        await api.delete(`/citas/${citaId}`);
        hideTooltip();
        fetchCitas();
      } catch (error) {
        alert('No se pudo cancelar la cita.');
      }
    }
  };
  
  const handleConfirmFromPopover = async (citaId) => {
    try {
      await api.put(`/citas/${citaId}/confirm`);
      hideTooltip();
      fetchCitas();
    } catch (error) {
      alert(error.response?.data?.message || 'No se pudo confirmar la cita.');
    }
  };

  const getStatusClassName = (statusName) => {
    if (typeof statusName !== 'string') return '';
    return `status-${statusName.split(' ')[0]}`;
  };

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    navigate('/login');
  };
  
  const getTranslatedExamName = (examName) => {
    if (typeof examName !== 'string') return "N/A";
    const nameMap = { 'OXYGEN_SATURATION': 'Saturación', 'BLOOD_PRESSURE': 'Presión Arterial', 'TEMPERATURE': 'Temperatura', 'GLUCOSE': 'Glucosa', 'HEART_RATE': 'Frec. Cardíaca', 'WEIGHT': 'Peso', 'BMI': 'IMC', 'BLOOD_PRESSURE_DIASTOLIC': 'Diastólica', 'BLOOD_PRESSURE_SYSTOLIC': 'Sistólica'};
    return examName.split(', ').map(name => nameMap[name] || name).join(', ');
  };

  const EventComponent = ({ event }) => (
    <div className={`rbc-event-custom status-${event.resource.estado_cita.split(' ')[0]}`}>
      <strong>{event.title}</strong>
    </div>
  );

  const TooltipComponent = ({ event }) => (
    <div className="custom-tooltip">
      <strong>{event.title}</strong><br/>
      <span>{new Date(event.start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span><br/>
      <span>Exámenes: {getTranslatedExamName(event.resource.examenes_previstos)}</span>
    </div>
  );

  return (
    <div className="results-page">
      <header className="header">
        <div className="header-branding">
          <Logo className="header-logo" />
          <h1>Agenda de Citas</h1>
        </div>
        <div className="header-actions">
          <button onClick={() => navigate('/results')} className="logout-button"><span className="material-symbols-outlined">group</span>Pacientes</button>
          <button onClick={handleLogout} className="logout-button"><span className="material-symbols-outlined">logout</span>Cerrar Sesión</button>
        </div>
      </header>
      <div className="toolbar">
        <div className="view-switcher">
          <button onClick={() => setViewMode('list')} className={`view-button ${viewMode === 'list' ? 'active' : ''}`}><span className="material-symbols-outlined">view_list</span>Lista</button>
          <button onClick={() => setViewMode('calendar')} className={`view-button ${viewMode === 'calendar' ? 'active' : ''}`}><span className="material-symbols-outlined">calendar_month</span>Calendario</button>
        </div>
        <div className="toolbar-actions">
          <button onClick={() => navigate('/create-appointment')} className="add-patient-button"><span className="material-symbols-outlined">add_circle</span>Programar Nueva Cita</button>
        </div>
      </div>
      <div className="results-container">
        {isLoading ? ( <p className="results-message">Cargando citas...</p> ) : viewMode === 'list' ? (
          citas.length > 0 ? (
            <table className="results-table">
              <thead>
                <tr>
                  <th>Paciente</th>
                  <th>Cédula</th>
                  <th>Fecha de la Cita</th>
                  <th>Estado</th>
                  <th className="observations-cell">Exámenes Previstos</th>
                  <th className="observations-cell">Observaciones</th>
                  <th className="actions-cell">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {citas.map((cita) => (
                  <tr key={cita.cita_id}>
                    <td>{`${cita.paciente_nombre} ${cita.paciente_apellido}`}</td>
                    <td>{cita.paciente_cedula}</td>
                    <td>{new Date(cita.fecha_cita).toLocaleString('es-CO', { dateStyle: 'long', timeStyle: 'short' })}</td>
                    <td><span className={`status-cell ${getStatusClassName(cita.estado_cita)}`}>{cita.estado_cita}</span></td>
                    <td className="observations-cell">{getTranslatedExamName(cita.examenes_previstos)}</td>
                    <td className="observations-cell">{cita.observaciones_admin || 'N/A'}</td>
                    <td className="actions-cell">
                      <button className="action-button" title="Editar Cita" onClick={() => navigate(`/edit-appointment/${cita.cita_id}`)}><span className="material-symbols-outlined">edit</span></button>
                      <button className="action-button" title="Cancelar Cita" onClick={() => handleCancelFromPopover(cita.cita_id)}><span className="material-symbols-outlined">delete</span></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : ( <p className="results-message">No hay citas programadas.</p> )
        ) : (
          <div className="calendar-container">
            <Calendar
              localizer={localizer}
              events={events}
              startAccessor="start"
              endAccessor="end"
              messages={{next: "Siguiente", previous: "Anterior", today: "Hoy", month: "Mes", week: "Semana", day: "Día", agenda: "Agenda"}}
              components={{ event: EventComponent, tooltip: TooltipComponent }}
              onSelectEvent={handleSelectEvent}
              step={120}
              timeslots={1}
              popup
              views={['month', 'week', 'day', 'agenda']}
            />
          </div>
        )}
      </div>
      
      {visible && selectedEvent && (
        <div ref={setTooltipRef} {...getTooltipProps({ className: 'tooltip-container' })}>
          <div {...getArrowProps({ className: 'tooltip-arrow' })} />
          <AppointmentPopover 
            event={selectedEvent} 
            onEdit={handleEditFromPopover}
            onCancel={handleCancelFromPopover}
            onConfirm={handleConfirmFromPopover}
          />
        </div>
      )}
    </div>
  );
};

export default AppointmentListPage;