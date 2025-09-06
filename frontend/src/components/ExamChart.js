import React, { useMemo, useRef, useImperativeHandle, forwardRef } from 'react';
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

ChartJS.register(
  CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend
);

const getTranslatedExamName = (examName) => {
    if (typeof examName !== 'string') return "Desconocido";
    const nameMap = { 'OXYGEN_SATURATION': 'Saturación de Oxígeno', 'BLOOD_PRESSURE': 'Presión Arterial', 'TEMPERATURE': 'Temperatura', 'GLUCOSE': 'Glucosa', 'HEART_RATE': 'Frecuencia Cardíaca', 'WEIGHT': 'Peso', 'BMI': 'Índice de Masa Corporal (IMC)', 'BLOOD_PRESSURE_DIASTOLIC': 'Presión Diastólica', 'BLOOD_PRESSURE_SYSTOLIC': 'Presión Sistólica' };
    return nameMap[examName] || examName;
};

// --- CAMBIO CLAVE #1: Creamos nuestro plugin de fondo blanco ---
const whiteBackgroundPlugin = {
  id: 'whiteBackground',
  beforeDraw: (chart) => {
    const { ctx } = chart;
    ctx.save();
    ctx.globalCompositeOperation = 'destination-over';
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, chart.width, chart.height);
    ctx.restore();
  }
};

const ExamChart = forwardRef(({ exams, examType }, ref) => {
    const chartRef = useRef(null);

    useImperativeHandle(ref, () => ({
        getImage: () => {
            if (chartRef.current) {
                // Le pasamos el plugin justo antes de generar la imagen
                return chartRef.current.toBase64Image('image/png', { plugins: [whiteBackgroundPlugin] });
            }
            return null;
        }
    }));
    
    const dataForChart = useMemo(() => {
        if (!exams || !examType) return { labels: [], datasets: [] };
        const relevantExams = exams.filter(e => e && e.tipo_examen_nombre === examType).reverse();
        if (relevantExams.length < 2) return { labels: [], datasets: [] };
        const labels = relevantExams.map(e => new Date(e.fecha_creacion).toLocaleDateString('es-CO', { day: 'numeric', month: 'short' }));
        
        if (examType === 'BLOOD_PRESSURE') {
            return {
                labels,
                datasets: [
                    {
                        label: 'Sistólica (mmHg)',
                        data: relevantExams.map(e => parseFloat(e.valor.split('/')[0])),
                        borderColor: 'rgb(255, 99, 132)',
                        backgroundColor: 'rgba(255, 99, 132, 0.5)',
                    },
                    {
                        label: 'Diastólica (mmHg)',
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
        animation: false
    };

    return <Line ref={chartRef} options={options} data={dataForChart} plugins={[whiteBackgroundPlugin]} />;
});

export default ExamChart;