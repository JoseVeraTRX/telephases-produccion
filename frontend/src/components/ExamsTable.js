// src/components/ExamsTable.js

import React from 'react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { logoBase64 } from '../assets/logoBase64';

const getTranslatedStatusText = (statusName) => {
  if (typeof statusName !== 'string') return "Sin Datos";
  const statusMap = { 'NORMAL': 'Normal', 'PRECAUCION_LEVE': 'Observación', 'PRECAUCION_MODERADA': 'Precaución', 'CRITICO': 'Crítico' };
  return statusMap[statusName] || statusName;
};

const getTranslatedExamName = (examName) => {
  if (typeof examName !== 'string') return "Desconocido";
  const nameMap = { 'OXYGEN_SATURATION': 'Saturación de Oxígeno', 'BLOOD_PRESSURE': 'Presión Arterial', 'TEMPERATURE': 'Temperatura', 'GLUCOSE': 'Glucosa', 'HEART_RATE': 'Frecuencia Cardíaca', 'WEIGHT': 'Peso', 'BMI': 'Índice de Masa Corporal (IMC)', 'BLOOD_PRESSURE_DIASTOLIC': 'Presión Diastólica', 'BLOOD_PRESSURE_SYSTOLIC': 'Presión Sistólica' };
  return nameMap[examName] || examName;
};

const handleDownloadPDF = (exams, patient) => {
  if (!exams || exams.length === 0 || !patient) return;
  const doc = new jsPDF();
  doc.addImage(logoBase64, 'PNG', 14, 10, 40, 15);
  doc.setFontSize(20);
  doc.text(`Reporte de Exámenes de ${patient.primer_nombre} ${patient.primer_apellido}`, 14, 35);
  doc.setFontSize(12);
  doc.text(`Cédula: ${patient.numero_documento}`, 14, 42);
  const mostUrgentExam = exams.reduce((a, b) => ((a.estado_nivel_urgencia || 0) > (b.estado_nivel_urgencia || 0) ? a : b), {});
  const headerColor = mostUrgentExam.estado_color || [82, 148, 107];
  autoTable(doc, {
    startY: 50,
    head: [['Estado', 'Tipo de Examen', 'Valor', 'Fecha', 'Observaciones']],
    body: exams.map(exam => [getTranslatedStatusText(exam.estado_nombre), getTranslatedExamName(exam.tipo_examen_nombre), `${exam.valor} ${exam.unidad || ''}`, new Date(exam.fecha_creacion).toLocaleDateString(), exam.observaciones || 'N/A']),
    theme: 'grid',
    headStyles: { fillColor: headerColor },
  });
  doc.save(`reporte_${patient.numero_documento}.pdf`);
};

const handleDownloadSinglePDF = (exam, patient) => {
  if (!exam || !patient) return;
  const doc = new jsPDF();
  doc.addImage(logoBase64, 'PNG', 14, 10, 40, 15);
  doc.setFontSize(18);
  doc.text(`Detalle de Examen`, 14, 35);
  doc.setFontSize(12);
  doc.text(`Paciente: ${patient.primer_nombre} ${patient.primer_apellido}`, 14, 42);
  doc.text(`Cédula: ${patient.numero_documento}`, 14, 49);
  doc.text(`Fecha: ${new Date(exam.fecha_creacion).toLocaleString()}`, 14, 56);
  const headerColor = exam.estado_color || [82, 148, 107];
  autoTable(doc, {
    startY: 65,
    head: [['Campo', 'Valor']],
    body: [
        ['Tipo de Examen', getTranslatedExamName(exam.tipo_examen_nombre)],
        ['Estado de Salud', getTranslatedStatusText(exam.estado_nombre)],
        ['Resultado', `${exam.valor} ${exam.unidad || ''}`],
        ['Observaciones', exam.observaciones || 'N/A'],
    ],
    theme: 'striped', 
    headStyles: { fillColor: headerColor },
    didParseCell: (data) => { if(data.section === 'body' && data.column.index === 0) { data.cell.styles.fontStyle = 'bold'; } }
  });
  doc.save(`examen_${getTranslatedExamName(exam.tipo_examen_nombre)}_${exam.numero_documento}_${exam.id}.pdf`);
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

const ExamsTable = ({ exams, patient, isLoading, onShowChart }) => {
  if (isLoading) {
    return <p className="results-message">Cargando exámenes...</p>;
  }
  if (!exams || exams.length === 0) {
    return <p className="results-message">No se encontraron exámenes para este paciente.</p>;
  }

  return (
    <>
      <div className="table-actions">
        <button onClick={() => handleDownloadPDF(exams, patient)} className="download-button">
          <span className="material-symbols-outlined">download</span>
          Descargar Reporte Completo
        </button>
      </div>
      <table className="results-table">
        <thead>
          <tr>
            <th>Estado</th>
            <th>Tipo de Examen</th>
            <th>Valor</th>
            <th>Unidad</th>
            <th>Fecha</th>
            <th className="observations-cell">Observaciones</th>
            <th className="actions-cell">Acciones</th>
          </tr>
        </thead>
        <tbody>
          {exams.map((exam) => (
            <tr key={exam.id} style={{ borderLeft: `5px solid ${exam.estado_color || '#ccc'}` }}>
              <td><span className="estado-emoji">{exam.estado_emoji}</span>{` ${getTranslatedStatusText(exam.estado_nombre)}`}</td>
              <td><span className="material-symbols-outlined">{renderIconForExam(exam.tipo_examen_nombre)}</span>{` ${getTranslatedExamName(exam.tipo_examen_nombre)}`}</td>
              <td>{exam.valor}</td>
              <td>{exam.unidad}</td>
              <td>{new Date(exam.fecha_creacion).toLocaleDateString()}</td>
              <td className="observations-cell">{exam.observaciones}</td>
              <td className="actions-cell">
                {/* --- NUEVO BOTÓN DE GRÁFICO --- */}
                <button 
                  className="action-button" 
                  title="Ver gráfico de evolución"
                  onClick={() => onShowChart(exam.tipo_examen_nombre)}
                >
                  <span className="material-symbols-outlined">show_chart</span>
                </button>
                <button className="action-button" title="Descargar PDF" onClick={() => handleDownloadSinglePDF(exam, patient)}>
                  <span className="material-symbols-outlined">picture_as_pdf</span>
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
};

export default ExamsTable;