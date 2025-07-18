// src/pages/ResultsPage.js
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import './Results.css';

const ResultsPage = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState(null); // null para el estado inicial
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery) return;
    
    setIsLoading(true);
    setError('');
    setResults(null);
    
    try {
      const response = await api.get(`/results/search?cedula=${searchQuery}`);
      setResults(response.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Error al realizar la búsqueda.');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleLogout = () => {
    localStorage.removeItem('authToken');
    navigate('/login');
  };

  const renderIconForExam = (examName) => {
    const name = examName.toLowerCase();
    if (name.includes('presión')) return 'blood_pressure';
    if (name.includes('cardiaca')) return 'cardiology';
    if (name.includes('peso')) return 'weight';
    if (name.includes('ecg')) return 'ecg_heart';
    return 'medical_information'; // Icono por defecto
  };

  return (
    <div className="results-page">
      <header className="header">
        <h1 className="header-title">
          <span className="material-symbols-outlined">ecg_heart</span>
          Resultados de Exámenes
        </h1>
        <button onClick={handleLogout} className="logout-button">
          <span className="material-symbols-outlined">logout</span>
          Cerrar Sesión
        </button>
      </header>

      <form className="search-bar" onSubmit={handleSearch}>
        <input
          type="text"
          placeholder="Buscar por número de cédula..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        <button type="submit">Buscar</button>
      </form>

      {isLoading && <p className="results-message">Cargando...</p>}
      {error && <p className="results-message error-message">{error}</p>}
      
      {results && (
        results.length > 0 ? (
          <table className="results-table">
            <thead>
              <tr>
                <th>Tipo de Examen</th>
                <th>Paciente</th>
                <th>Valor</th>
                <th>Unidad</th>
                <th>Fecha</th>
                <th>Observaciones</th>
              </tr>
            </thead>
            <tbody>
              {results.map((exam) => (
                <tr key={exam.id}>
                  <td>
                    <span className="material-symbols-outlined">
                      {renderIconForExam(exam.tipo_examen_nombre)}
                    </span>
                    {` ${exam.tipo_examen_nombre}`}
                  </td>
                  <td>{`${exam.primer_nombre} ${exam.primer_apellido}`}</td>
                  <td>{exam.valor}</td>
                  <td>{exam.unidad}</td>
                  <td>{new Date(exam.fecha_creacion).toLocaleDateString()}</td>
                  <td>{exam.observaciones}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="results-message">No se encontraron resultados para la cédula ingresada.</p>
        )
      )}

      {results === null && !isLoading && (
          <p className="results-message">Ingrese un número de cédula para buscar los exámenes de un paciente.</p>
      )}

    </div>
  );
};

export default ResultsPage;