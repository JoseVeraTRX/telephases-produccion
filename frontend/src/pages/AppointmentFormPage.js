import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../services/api';
import './Appointments.css';
import { ReactComponent as Logo } from '../assets/logo-intelicare.svg';

const AppointmentFormPage = () => {
  const navigate = useNavigate();
  const { citaId } = useParams(); // Obtenemos el ID de la cita desde la URL
  const isEditMode = Boolean(citaId); // Si hay un citaId, estamos en modo edición

  const [step, setStep] = useState(isEditMode ? 2 : 1); // Si edita, va directo al paso 2
  const [numeroDocumento, setNumeroDocumento] = useState('');
  const [foundPatient, setFoundPatient] = useState(null);
  
  // Estado combinado para los datos del formulario de la cita
  const [appointmentData, setAppointmentData] = useState({
    fecha_cita: '',
    observaciones_admin: '',
    examenes_previstos: [],
  });

  const [availableExams, setAvailableExams] = useState([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  // useEffect para cargar los datos de la cita si estamos en modo edición
  useEffect(() => {
    // Carga los tipos de examen disponibles en ambos modos
    const fetchExamTypes = async () => {
      try {
        const response = await api.get('/results/exam-types');
        setAvailableExams(response.data);
      } catch (err) {
        console.error("Error al cargar los tipos de examen", err);
      }
    };
    fetchExamTypes();

    // Si estamos en modo edición, carga los datos de la cita
    if (isEditMode) {
      setLoading(true);
      const fetchCitaData = async () => {
        try {
          const response = await api.get(`/citas/${citaId}`);
          const { fecha_cita, observaciones_admin, examenes_previstos, ...patientInfo } = response.data;
          
          setAppointmentData({
            fecha_cita: new Date(fecha_cita).toISOString().slice(0, 16),
            observaciones_admin: observaciones_admin || '',
            examenes_previstos: examenes_previstos.map(String) || [],
          });
          setFoundPatient(patientInfo);
        } catch (error) {
          setError('No se pudo cargar la información de la cita para editar.');
        } finally {
          setLoading(false);
        }
      };
      fetchCitaData();
    }
  }, [citaId, isEditMode]);


  const handlePatientSearch = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const response = await api.get(`/patients/documento/${numeroDocumento}`);
      setFoundPatient(response.data);
      setStep(2);
    } catch (err) {
      setError(err.response?.data?.message || 'Error al buscar el paciente.');
      setFoundPatient(null);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const dataToSubmit = {
        ...appointmentData,
        examenes_previstos: appointmentData.examenes_previstos.map(id => parseInt(id, 10)),
      };
      
      if (isEditMode) {
        await api.put(`/citas/${citaId}`, dataToSubmit);
        setSuccess('Cita actualizada exitosamente.');
      } else {
        const postData = { ...dataToSubmit, paciente_id: foundPatient.id };
        await api.post('/citas', postData);
        setSuccess('Cita creada exitosamente.');
      }
      setTimeout(() => navigate('/appointments'), 2000);
    } catch (err) {
      setError(err.response?.data?.message || 'Ocurrió un error.');
    } finally {
      setLoading(false);
    }
  };
  
  const handleDataChange = (e) => {
    setAppointmentData({ ...appointmentData, [e.target.name]: e.target.value });
  };
  
  const toggleExamSelection = (examId) => {
    const id = examId.toString();
    const currentSelection = appointmentData.examenes_previstos;
    let newSelection;
    if (currentSelection.includes(id)) {
      newSelection = currentSelection.filter(item => item !== id);
    } else {
      newSelection = [...currentSelection, id];
    }
    setAppointmentData({ ...appointmentData, examenes_previstos: newSelection });
  };

   const getTranslatedExamName = (examName) => {
    if (typeof examName !== 'string') return "Desconocido";
    const nameMap = {
      'OXYGEN_SATURATION': 'Saturación de Oxígeno',
      'BLOOD_PRESSURE': 'Presión Arterial',
      'TEMPERATURE': 'Temperatura',
      'GLUCOSE': 'Glucosa',
      'HEART_RATE': 'Frecuencia Cardíaca',
      'WEIGHT': 'Peso',
      'BMI': 'Índice de Masa Corporal (IMC)',
      'BLOOD_PRESSURE_DIASTOLIC': 'Presión Diastólica',
      'BLOOD_PRESSURE_SYSTOLIC': 'Presión Sistólica',
    };
    return nameMap[examName] || examName;
  };

  const renderIconForExam = (examName) => {
    if (typeof examName !== 'string') { return 'medical_information'; }
    const name = examName.toLowerCase();
    if (name.includes('presión')) return 'blood_pressure';
    if (name.includes('cardiaca')) return 'cardiology';
    if (name.includes('peso')) return 'weight';
    if (name.includes('ecg')) return 'ecg_heart';
    if (name.includes('oxígeno')) return 'oxygen_saturation';
    if (name.includes('temperatura')) return 'thermostat';
    return 'medical_information';
  };
  
  return (
    <div className="register-page">
      <header className="header">
        <div className="header-branding">
          <Logo className="header-logo" />
          <h1>{isEditMode ? 'Editar Cita' : 'Programar Nueva Cita'}</h1>
        </div>
        <button onClick={() => navigate('/appointments')} className="logout-button">
          <span className="material-symbols-outlined">arrow_back</span>
          Volver a la Agenda
        </button>
      </header>
      
      {!isEditMode && step === 1 && (
        <form className="register-form" onSubmit={handlePatientSearch}>
          <h2>Paso 1: Buscar Paciente</h2>
          <div className="input-group full-width">
            <label htmlFor="numeroDocumento">Cédula del Paciente</label>
            <input type="text" id="numeroDocumento" value={numeroDocumento} onChange={e => setNumeroDocumento(e.target.value)} required />
          </div>
          <div className="form-actions">
            {error && <p className="error-message">{error}</p>}
            <button type="submit" className="submit-button" disabled={loading}>
              {loading ? 'Buscando...' : 'Buscar Paciente'}
            </button>
          </div>
        </form>
      )}

      {step === 2 && foundPatient && (
        <form className="register-form" onSubmit={handleSubmit}>
          <h2>{isEditMode ? 'Editando detalles de la cita' : 'Paso 2: Detalles de la Cita'}</h2>
          <p className="patient-info">
            Cita para: <strong>{foundPatient.primer_nombre} {foundPatient.primer_apellido}</strong>
          </p>
          <div className="form-grid">
            <div className="input-group full-width">
              <label htmlFor="fecha_cita">Fecha y Hora de la Cita *</label>
              <input type="datetime-local" id="fecha_cita" name="fecha_cita" value={appointmentData.fecha_cita} onChange={handleDataChange} required />
            </div>
            <div className="input-group full-width">
              <label>Exámenes Previstos</label>
              <div className="exam-selection-grid">
                {availableExams.map(exam => (
                  <button type="button" key={exam.id}
                    className={`exam-chip ${appointmentData.examenes_previstos.includes(exam.id.toString()) ? 'selected' : ''}`}
                    onClick={() => toggleExamSelection(exam.id)}
                  >
                    <span className="material-symbols-outlined">{renderIconForExam(exam.nombre)}</span>
                    {getTranslatedExamName(exam.nombre)}
                  </button>
                ))}
              </div>
            </div>
            <div className="input-group full-width">
              <label htmlFor="observaciones_admin">Observaciones</label>
              <textarea id="observaciones_admin" name="observaciones_admin" value={appointmentData.observaciones_admin} onChange={handleDataChange} rows="3"></textarea>
            </div>
          </div>
          <div className="form-actions">
            {error && <p className="error-message">{error}</p>}
            {success && <p className="success-message">{success}</p>}
            {!isEditMode && <button type="button" className="cancel-button" onClick={() => { setStep(1); setFoundPatient(null); setError(''); }}>Atrás</button>}
            <button type="submit" className="submit-button" disabled={loading}>
              {loading ? 'Guardando...' : (isEditMode ? 'Actualizar Cita' : 'Guardar Cita')}
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

export default AppointmentFormPage;