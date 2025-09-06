import React from 'react';
import './PatientExamsModal.css';
import ExamsTable from './ExamsTable';

const PatientExamsModal = ({ patient, exams, isLoading, onClose }) => {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>&times;</button>
        <div className="modal-header">
          <h2>Exámenes de {patient.primer_nombre} {patient.primer_apellido}</h2>
          <p>Cédula: {patient.numero_documento}</p>
        </div>
        <div className="modal-body">
          <ExamsTable 
            exams={exams} 
            patient={patient} 
            isLoading={isLoading}
            isModalView={true} // <-- La clave: le decimos que oculte el botón de gráfico
          />
        </div>
      </div>
    </div>
  );
};

export default PatientExamsModal;