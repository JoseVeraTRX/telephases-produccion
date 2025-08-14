import React from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import './RegisterPatient.css';
import { ReactComponent as Logo } from '../assets/logo-intelicare.svg';

const RegisterPatientPage = () => {
  const [formData, setFormData] = React.useState({
    primer_nombre: '',
    segundo_nombre: '',
    primer_apellido: '',
    segundo_apellido: '',
    tipo_documento_id: '',
    numero_documento: '',
    email: '',
    telefono: '',
    fecha_nacimiento: '',
    genero: '',
  });

  const [error, setError] = React.useState('');
  const [success, setSuccess] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      const response = await api.post('/patients', formData);
      setSuccess(response.data.message);
      setFormData({
        primer_nombre: '', segundo_nombre: '', primer_apellido: '',
        segundo_apellido: '', tipo_documento_id: '', numero_documento: '', 
        email: '', telefono: '', fecha_nacimiento: '', genero: '',
      });
      setTimeout(() => navigate('/results'), 2000);
    } catch (err) {
      setError(err.response?.data?.message || 'Ocurrió un error al registrar.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="register-page">
      <header className="header">
        <div className="header-branding">
          <Logo className="header-logo" />
          <h1>Registrar Nuevo Paciente</h1>
        </div>
        <button onClick={() => navigate('/results')} className="logout-button">
          <span className="material-symbols-outlined">arrow_back</span>
          Volver a la Lista
        </button>
      </header>

      <form className="register-form" onSubmit={handleSubmit}>
        <div className="form-grid">
          <div className="input-group">
            <label htmlFor="primer_nombre">Primer Nombre *</label>
            <input type="text" id="primer_nombre" name="primer_nombre" value={formData.primer_nombre} onChange={handleChange} required />
          </div>
          <div className="input-group">
            <label htmlFor="segundo_nombre">Segundo Nombre</label>
            <input type="text" id="segundo_nombre" name="segundo_nombre" value={formData.segundo_nombre} onChange={handleChange} />
          </div>

          <div className="input-group">
            <label htmlFor="primer_apellido">Primer Apellido *</label>
            <input type="text" id="primer_apellido" name="primer_apellido" value={formData.primer_apellido} onChange={handleChange} required />
          </div>
          <div className="input-group">
            <label htmlFor="segundo_apellido">Segundo Apellido</label>
            <input type="text" id="segundo_apellido" name="segundo_apellido" value={formData.segundo_apellido} onChange={handleChange} />
          </div>

          <div className="input-group">
            <label htmlFor="tipo_documento_id">Tipo de Documento *</label>
            <select id="tipo_documento_id" name="tipo_documento_id" value={formData.tipo_documento_id} onChange={handleChange} required>
              <option value="" disabled>Seleccionar...</option>
              <option value="1">Cédula de Ciudadanía (CC)</option>
              <option value="2">Tarjeta de Identidad (TI)</option>
              <option value="3">Pasaporte</option>
              <option value="4">Cédula de Extranjería</option>
            </select>
          </div>
          <div className="input-group">
            <label htmlFor="numero_documento">Número de Documento *</label>
            <input type="text" id="numero_documento" name="numero_documento" value={formData.numero_documento} onChange={handleChange} required />
          </div>

          <div className="input-group">
            <label htmlFor="email">Correo Electrónico</label>
            <input type="email" id="email" name="email" value={formData.email} onChange={handleChange} />
          </div>
          <div className="input-group">
            <label htmlFor="telefono">Teléfono</label>
            <input type="tel" id="telefono" name="telefono" value={formData.telefono} onChange={handleChange} />
          </div>

          <div className="input-group">
            <label htmlFor="fecha_nacimiento">Fecha de Nacimiento</label>
            <input type="date" id="fecha_nacimiento" name="fecha_nacimiento" value={formData.fecha_nacimiento} onChange={handleChange} />
          </div>
          <div className="input-group">
            <label htmlFor="genero">Género</label>
            <select id="genero" name="genero" value={formData.genero} onChange={handleChange}>
              <option value="">Seleccionar...</option>
              <option value="M">Masculino</option>
              <option value="F">Femenino</option>
              <option value="O">Otro</option>
            </select>
          </div>
          
          <div className="form-actions full-width">
            {/* Mensajes de éxito y error con estilo mejorado */}
            <div className="message-container">
              {error && <p className="error-message">{error}</p>}
              {success && <p className="success-message">{success}</p>}
            </div>
            <button type="button" className="cancel-button" onClick={() => navigate('/results')}>Cancelar</button>
            <button type="submit" className="submit-button" disabled={loading}>
              {loading ? 'Registrando...' : 'Registrar Paciente'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default RegisterPatientPage;