// src/pages/PatientListPage.js - VERSIÓN FINAL CON BOTÓN CORREGIDO

import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import './PatientList.css';
import PatientExamsModal from '../components/PatientExamsModal';
import { ReactComponent as Logo } from '../assets/logo-intelicare.svg';


const PatientListPage = () => {
  // --- ESTADOS Y LÓGICA (SIN CAMBIOS) ---
  const [patients, setPatients] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('name');

  const fetchPatients = async () => {
    setIsLoading(true);
    try {
      const response = await api.get('/patients');
      setPatients(response.data);
    } catch (error) { console.error("Error al cargar pacientes", error); } 
    finally { setIsLoading(false); }
  };

  useEffect(() => {
    fetchPatients();
  }, []);

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

  return (
    <div className="results-page">
      <header className="header">
        
        <Logo className="header-logo" />

        <h1 className="header-title">
          <span className="material-symbols-outlined">group</span>
          Lista de Pacientes
        </h1>
        {/* Rellenamos el botón con su contenido  */}
        <button onClick={handleLogout} className="logout-button">
          <span className="material-symbols-outlined">logout</span>
          Cerrar Sesión
        </button>
      </header>

      <div className="toolbar">
        <form className="patient-search-form" onSubmit={(e) => e.preventDefault()}>
          <input 
            type="text" 
            placeholder="Buscar por nombre o cédula..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <button type="submit"><span className="material-symbols-outlined">search</span></button>
        </form>
        <div className="toolbar-actions">
          <button onClick={() => setSortBy('recent')} className={sortBy === 'recent' ? 'active' : ''}>Más Recientes</button>
          <button onClick={() => setSortBy('name')} className={sortBy === 'name' ? 'active' : ''}>Ordenar A-Z</button>
          <button onClick={fetchPatients} className="refresh-button" title="Actualizar lista">
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
                    <button className="action-button" onClick={() => setSelectedPatient(patient)}>
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

      {selectedPatient && <PatientExamsModal patient={selectedPatient} onClose={() => setSelectedPatient(null)} />}
    </div>
  );
};

export default PatientListPage;