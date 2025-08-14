import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import './Login.css';
import { ReactComponent as Logo } from '../assets/logo-intelicare.svg';

import bg1 from '../assets/images/med-bg-1.webp';
import bg2 from '../assets/images/med-bg-2.webp';
import bg3 from '../assets/images/med-bg-3.webp';

const images = [bg1, bg2, bg3];

const LoginPage = () => {
  const [loginMode, setLoginMode] = useState('admin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [numeroDocumento, setNumeroDocumento] = useState('');
  const [fechaNacimiento, setFechaNacimiento] = useState('');
  const [patientStep, setPatientStep] = useState('enterId');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  useEffect(() => {
    const intervalId = setInterval(() => {
      setCurrentImageIndex((prevIndex) => (prevIndex + 1) % images.length);
    }, 5000);
    return () => clearInterval(intervalId);
  }, []);

  const handleAdminLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const response = await api.post('/auth/login', { email, password });
      localStorage.setItem('authToken', response.data.token);
      navigate('/results');
    } catch (err) {
      setError(err.response?.data?.message || 'Error al iniciar sesión.');
      setLoading(false);
    }
  };

  const handlePatientLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (patientStep === 'enterId') {
      try {
        await api.post('/auth/patient-login', { numero_documento: numeroDocumento, fecha_nacimiento: '1900-01-01' });
      } catch (err) {
        if (err.response?.status === 401 || err.response?.status === 404) {
          if (err.response.data.message === 'Paciente no encontrado.') {
              setError('El número de documento no se encuentra registrado.');
          } else {
              setPatientStep('enterDob');
          }
        } else {
          setError(err.response?.data?.message || 'Error al verificar documento.');
        }
      } finally {
        setLoading(false);
      }
    } else if (patientStep === 'enterDob') {
      try {
        const response = await api.post('/auth/patient-login', { numero_documento: numeroDocumento, fecha_nacimiento: fechaNacimiento });
        localStorage.setItem('authToken', response.data.token);
        navigate('/patient-dashboard');
      } catch (err) {
        setError(err.response?.data?.message || 'Error al iniciar sesión.');
      } finally {
        setLoading(false);
      }
    }
  };
  
  const switchMode = (mode) => {
    setLoginMode(mode);
    setError('');
    setEmail('');
    setPassword('');
    setNumeroDocumento('');
    setFechaNacimiento('');
    setPatientStep('enterId');
  };

  const handlePatientBack = () => {
    setPatientStep('enterId');
    setError('');
    setFechaNacimiento('');
  };

  return (
    <div className="login-container">
      <div className="login-slideshow">
        {images.map((img, index) => (
          <div 
            key={index}
            className={`slide ${index === currentImageIndex ? 'active' : ''}`} 
            style={{ backgroundImage: `url(${img})` }}
          />
        ))}
      </div>

      <div className="login-form-container">
        {loginMode === 'admin' ? (
          <form className="login-form" onSubmit={handleAdminLogin}>
            <Logo className="login-logo" />
            <h2 className="login-title">Portal de Administración</h2>
            <p className="login-subtitle">Acceso para personal autorizado</p>
            <div className="input-group">
              <label htmlFor="email">Correo Electrónico</label>
              <input type="email" id="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <div className="input-group">
              <label htmlFor="password">Contraseña</label>
              <input type="password" id="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
            </div>
            <button type="submit" className="login-button" disabled={loading}>{loading ? 'Ingresando...' : 'Ingresar'}</button>
            {error && <p className="error-message">{error}</p>}
            <p className="role-switch-text">
              ¿Eres un paciente? <span onClick={() => switchMode('patient')}>Inicia sesión aquí.</span>
            </p>
          </form>
        ) : (
          <form className="login-form" onSubmit={handlePatientLogin}>
            <Logo className="login-logo" />
            <h2 className="login-title">Acceso de Paciente</h2>
            <p className="login-subtitle">Consulta tus resultados de forma segura</p>
            <div className="input-group">
              <label htmlFor="documento">Número de Cédula</label>
              <input type="text" id="documento" value={numeroDocumento} onChange={(e) => setNumeroDocumento(e.target.value)} required readOnly={patientStep === 'enterDob'} />
            </div>

            {patientStep === 'enterDob' && (
              <div className="input-group">
                <label htmlFor="fechaNacimiento">Fecha de Nacimiento</label>
                <input type="date" id="fechaNacimiento" value={fechaNacimiento} onChange={(e) => setFechaNacimiento(e.target.value)} required />
              </div>
            )}

            <div className="action-buttons">
              {patientStep === 'enterDob' && (
                <button type="button" className="back-button" onClick={handlePatientBack} title="Volver">
                  <span className="material-symbols-outlined">arrow_back</span>
                </button>
              )}
              <button type="submit" className="login-button" disabled={loading}>
                {loading ? 'Verificando...' : (patientStep === 'enterId' ? 'Verificar Cédula' : 'Ingresar')}
              </button>
            </div>

            {error && <p className="error-message">{error}</p>}
            <p className="role-switch-text">
              ¿Personal autorizado? <span onClick={() => switchMode('admin')}>Inicia sesión aquí.</span>
            </p>
          </form>
        )}
      </div>
    </div>
  );
};

export default LoginPage;