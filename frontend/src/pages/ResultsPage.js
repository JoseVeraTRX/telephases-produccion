// src/pages/ResultsPage.js - VERSIÓN FINAL, COMPLETA Y CORREGIDA

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import './Results.css';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const ResultsPage = () => {
  // --- ESTADOS ---
  const [results, setResults] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [examTypes, setExamTypes] = useState([]);
  const [selectedExamType, setSelectedExamType] = useState('');

  // --- LÓGICA DE DATOS ---
  const fetchResults = async (filters = {}) => {
    setIsLoading(true);
    setError('');
    try {
      const params = new URLSearchParams();
      if (filters.cedula) params.append('cedula', filters.cedula);
      if (filters.fechaInicio) params.append('fechaInicio', filters.fechaInicio);
      if (filters.fechaFin) params.append('fechaFin', filters.fechaFin);
      if (filters.tipoExamenId) params.append('tipoExamenId', filters.tipoExamenId);
      const response = await api.get(`/results/search?${params.toString()}`);
      setResults(response.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Error al realizar la búsqueda.');
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const fetchExamTypes = async () => {
      try {
        const response = await api.get('/results/exam-types');
        setExamTypes(response.data);
      } catch (err) { console.error("Error al cargar tipos de examen", err); }
    };
    fetchExamTypes();
    fetchResults({}); // Carga inicial de todos los resultados
  }, []);

  // --- MANEJADORES DE EVENTOS ---
  const handleSearch = (e) => {
    e.preventDefault();
    fetchResults({
      cedula: searchQuery,
      fechaInicio: startDate,
      fechaFin: endDate,
      tipoExamenId: selectedExamType,
    });
  };

  const handleClearFilters = () => {
    setSearchQuery('');
    setStartDate('');
    setEndDate('');
    setSelectedExamType('');
    fetchResults({});
  };
  
  const handleLogout = () => {
    localStorage.removeItem('authToken');
    navigate('/login');
  };

  const handleDownloadPDF = () => {
    if (!results || results.length === 0) return;
    const doc = new jsPDF();
    const patientInfo = searchQuery ? `para la cédula ${searchQuery}` : "de todos los pacientes";
    doc.setFontSize(20);
    doc.text("Reporte de Exámenes", 14, 22);
    doc.setFontSize(12);
    doc.text(`Resultados ${patientInfo}`, 14, 30);
    autoTable(doc, {
      startY: 40,
      head: [['Estado', 'Tipo', 'Paciente', 'Cédula', 'Valor', 'Fecha']],
      body: results.map(exam => [
        exam.estado_emoji || 'N/A',
        exam.tipo_examen_nombre,
        `${exam.primer_nombre} ${exam.primer_apellido}`,
        exam.numero_documento,
        `${exam.valor} ${exam.unidad || ''}`,
        new Date(exam.fecha_creacion).toLocaleDateString(),
      ]),
      theme: 'grid',
      headStyles: { fillColor: [82, 148, 107] },
      columnStyles: {
          0: { cellWidth: 18, halign: 'center' },
          1: { cellWidth: 35 },
          2: { cellWidth: 'auto' },
          3: { cellWidth: 25 },
          4: { cellWidth: 20 },
          5: { cellWidth: 22 },
      }
    });
    doc.save(`reporte_examenes_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  const handleDownloadSinglePDF = (exam) => {
    const doc = new jsPDF();
    const patientName = `${exam.primer_nombre} ${exam.primer_apellido}`;
    doc.setFontSize(18);
    doc.text(`Detalle de Examen`, 14, 22);
    doc.setFontSize(12);
    doc.text(`Paciente: ${patientName}`, 14, 30);
    doc.text(`Cédula: ${exam.numero_documento}`, 14, 36);
    doc.text(`Fecha: ${new Date(exam.fecha_creacion).toLocaleString()}`, 14, 42);
    autoTable(doc, {
      startY: 50,
      head: [['Campo', 'Valor']],
      body: [
        ['Tipo de Examen', `${exam.estado_emoji || ''} ${exam.tipo_examen_nombre}`],
        ['Estado de Salud', exam.estado_nombre || 'N/A'],
        ['Resultado', `${exam.valor} ${exam.unidad || ''}`],
        ['Observaciones', exam.observaciones || 'N/A'],
      ],
      theme: 'striped',
      headStyles: { fillColor: [82, 148, 107] },
      didDrawCell: (data) => { if (data.section === 'body' && data.column.index === 0) { data.cell.styles.fontStyle = 'bold'; } }
    });
    doc.save(`examen_${exam.tipo_examen_nombre}_${exam.numero_documento}_${exam.id}.pdf`);
  };

  const renderIconForExam = (examName) => {
    const name = examName.toLowerCase();
    if (name.includes('presión')) return 'blood_pressure';
    if (name.includes('cardiaca')) return 'cardiology';
    if (name.includes('peso')) return 'weight';
    if (name.includes('ecg')) return 'ecg_heart';
    return 'medical_information';
  };

  // --- RENDERIZADO DEL COMPONENTE (JSX) ---
  return (
    <div className="results-page">
      <header className="header">
        <h1 className="header-title">
          <span className="material-symbols-outlined">ecg_heart</span>
          Dashboard de Exámenes
        </h1>
        <button onClick={handleLogout} className="logout-button">
          <span className="material-symbols-outlined">logout</span>
          Cerrar Sesión
        </button>
      </header>

      <form className="search-bar" onSubmit={handleSearch}>
        <input type="text" className="cedula-input" placeholder="Filtrar por cédula..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}/>
        <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} title="Fecha de inicio"/>
        <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} title="Fecha de fin"/>
        <select value={selectedExamType} onChange={e => setSelectedExamType(e.target.value)}>
          <option value="">-- Todos los tipos --</option>
          {examTypes.map(type => ( <option key={type.id} value={type.id}>{type.nombre}</option> ))}
        </select>
        <button type="submit" className="search-button">Filtrar / Actualizar</button>
        <button type="button" className="clear-button" onClick={handleClearFilters}>Limpiar</button>
      </form>
      
      <div className="table-actions">
        {results && results.length > 0 && (
          <button onClick={handleDownloadPDF} className="download-button">
            <span className="material-symbols-outlined">download</span>
            Descargar Reporte Completo
          </button>
        )}
      </div>

      <div className="results-container">
        {isLoading && <p className="results-message">Cargando resultados...</p>}
        {error && <p className="results-message error-message">{error}</p>}
        
        {!isLoading && results && (
          results.length > 0 ? (
            <table className="results-table">
              <thead>
                <tr>
                  <th>Estado</th>
                  <th>Tipo de Examen</th>
                  <th>Paciente</th>
                  <th>Cédula</th>
                  <th>Valor</th>
                  <th>Unidad</th>
                  <th>Fecha</th>
                  <th className="observations-cell">Observaciones</th>
                  <th className="actions-cell">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {results.map((exam) => (
                  <tr key={exam.id} style={{ borderLeft: `5px solid ${exam.estado_color || '#ccc'}` }}>
                    <td><span className="estado-emoji">{exam.estado_emoji}</span>{` ${exam.estado_nombre || 'N/A'}`}</td>
                    <td><span className="material-symbols-outlined">{renderIconForExam(exam.tipo_examen_nombre)}</span>{` ${exam.tipo_examen_nombre}`}</td>
                    <td>{`${exam.primer_nombre} ${exam.primer_apellido}`}</td>
                    <td>{exam.numero_documento}</td>
                    <td>{exam.valor}</td>
                    <td>{exam.unidad}</td>
                    <td>{new Date(exam.fecha_creacion).toLocaleDateString()}</td>
                    <td className="observations-cell">{exam.observaciones}</td>
                    <td className="actions-cell">
                      <button className="action-button" title="Descargar este resultado en PDF" onClick={() => handleDownloadSinglePDF(exam)}>
                        <span className="material-symbols-outlined">picture_as_pdf</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="results-message">No se encontraron resultados para los filtros aplicados.</p>
          )
        )}
      </div>
    </div>
  );
};

export default ResultsPage;