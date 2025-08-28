import React from 'react';
import './AppointmentPopover.css';

const AppointmentPopover = ({ event, onEdit, onCancel, onConfirm }) => {
  const getTranslatedExamName = (examName) => {
    if (!examName) return 'N/A';
    const nameMap = {
      'OXYGEN_SATURATION': 'Saturación',
      'BLOOD_PRESSURE': 'Presión Arterial',
      'TEMPERATURE': 'Temperatura',
      'GLUCOSE': 'Glucosa',
      'HEART_RATE': 'Frec. Cardíaca',
      'WEIGHT': 'Peso',
      'BMI': 'IMC',
      'BLOOD_PRESSURE_DIASTOLIC': 'Diastólica',
      'BLOOD_PRESSURE_SYSTOLIC': 'Sistólica',
    };
    return examName.split(', ').map(name => nameMap[name] || name).join(', ');
  };
  
  return (
    <div className="popover-content">
      <h4 className="popover-title">{event.title}</h4>
      <div className="popover-details">
        <p><strong><span className="material-symbols-outlined">schedule</span> Hora:</strong> {new Date(event.start).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}</p>
        <p><strong><span className="material-symbols-outlined">label</span> Estado:</strong> {event.resource.estado_cita}</p>
        <p><strong><span className="material-symbols-outlined">science</span> Exámenes:</strong> {getTranslatedExamName(event.resource.examenes_previstos)}</p>
      </div>
      
      <div className="popover-actions">
        {event.resource.estado_cita === 'Programada' && (
          <button className="popover-button confirm" onClick={() => onConfirm(event.resource.cita_id)}>
            <span className="material-symbols-outlined">check_circle</span> Confirmar
          </button>
        )}
        <button className="popover-button edit" onClick={onEdit}>
          <span className="material-symbols-outlined">edit</span> Editar
        </button>
        <button className="popover-button cancel" onClick={() => onCancel(event.resource.cita_id)}>
          <span className="material-symbols-outlined">delete</span> Cancelar
        </button>
      </div>
    </div>
  );
};

export default AppointmentPopover;