// src/components/ExamChart.js - VERSIÓN FINAL CON CHART.JS

import React, { useMemo } from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

// Registramos los componentes que Chart.js necesita para dibujar un gráfico de líneas
ChartJS.register(
  CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend
);

const getTranslatedExamName = (examName) => {
    if (typeof examName !== 'string') return "Desconocido";
    const nameMap = { 'OXYGEN_SATURATION': 'Saturación de Oxígeno', 'BLOOD_PRESSURE': 'Presión Arterial', 'TEMPERATURE': 'Temperatura', 'GLUCOSE': 'Glucosa', 'HEART_RATE': 'Frecuencia Cardíaca', 'WEIGHT': 'Peso', 'BMI': 'Índice de Masa Corporal (IMC)', 'BLOOD_PRESSURE_DIASTOLIC': 'Presión Diastólica', 'BLOOD_PRESSURE_SYSTOLIC': 'Presión Sistólica' };
    return nameMap[examName] || examName;
};

const ExamChart = ({ exams, examType }) => {
    
    // Chart.js necesita los datos en un formato específico: labels y datasets
    const dataForChart = useMemo(() => {
        if (!exams || !examType) return { labels: [], datasets: [] };

        const relevantExams = exams
            .filter(exam => exam && exam.tipo_examen_nombre === examType)
            .reverse(); // Ordenamos de más antiguo a más reciente
        
        if (relevantExams.length < 2) {
            return { labels: [], datasets: [] };
        }

        const labels = relevantExams.map(e => new Date(e.fecha_creacion).toLocaleDateString('es-CO', { day: 'numeric', month: 'short' }));
        
        if (examType === 'BLOOD_PRESSURE') {
            return {
                labels,
                datasets: [
                    {
                        label: 'Sistólica',
                        data: relevantExams.map(e => parseFloat(e.valor.split('/')[0])),
                        borderColor: 'rgb(255, 99, 132)',
                        backgroundColor: 'rgba(255, 99, 132, 0.5)',
                    },
                    {
                        label: 'Diastólica',
                        data: relevantExams.map(e => parseFloat(e.valor.split('/')[1])),
                        borderColor: 'rgb(53, 162, 235)',
                        backgroundColor: 'rgba(53, 162, 235, 0.5)',
                    },
                ]
            };
        }

        return {
            labels,
            datasets: [
                {
                    label: getTranslatedExamName(examType),
                    data: relevantExams.map(e => parseFloat(e.valor)),
                    borderColor: 'rgb(75, 192, 192)',
                    backgroundColor: 'rgba(75, 192, 192, 0.5)',
                }
            ]
        };

    }, [exams, examType]);

    if (dataForChart.datasets.length === 0) {
        return <p className="results-message">Se necesitan al menos dos mediciones para mostrar la evolución.</p>;
    }

    const options = {
        responsive: true,
        plugins: {
            legend: { position: 'top' },
            title: { display: false }
        },
    };

    return <Line options={options} data={dataForChart} />;
};

export default ExamChart;