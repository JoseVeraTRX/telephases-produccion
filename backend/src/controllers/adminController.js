// src/controllers/adminController.js
const db = require('../services/db');

exports.getDashboardData = async (req, res) => {
  try {
    // --- 1. Consulta para los KPIs ---
    const kpiQueries = [
      db.query("SELECT COUNT(*) FROM usuario WHERE rol_id = 2 AND activo = TRUE"),
      db.query("SELECT COUNT(*) FROM examen WHERE fecha_creacion >= CURRENT_DATE"),
      db.query("SELECT COUNT(*) FROM citas WHERE fecha_cita >= CURRENT_DATE AND fecha_cita < CURRENT_DATE + INTERVAL '1 day' AND estado_cita_id NOT IN (3, 4)")
    ];
    
    // --- 2. Consulta para las Alertas Críticas ---
    // Busca exámenes de las últimas 48h con nivel de urgencia alto (3 o 4)
    const alertsQuery = db.query(`
      SELECT
          u.primer_nombre, u.primer_apellido, u.numero_documento,
          ex.valor, ex.unidad, ex.fecha_creacion,
          te.nombre AS tipo_examen_nombre,
          es.nombre AS estado_nombre, es.emoji AS estado_emoji, es.color AS estado_color
      FROM examen ex
      JOIN usuario u ON ex.usuario_id = u.id
      JOIN tipo_examen te ON ex.tipo_examen_id = te.id
      JOIN estado_salud es ON ex.estado_salud_id = es.id
      WHERE ex.fecha_creacion >= NOW() - INTERVAL '48 hours'
      AND es.nivel_urgencia >= 3
      ORDER BY ex.fecha_creacion DESC
      LIMIT 10;
    `);

    // Ejecutamos las consultas de KPIs en paralelo para máxima eficiencia
    const [patientCountResult, examsTodayResult, appointmentsTodayResult] = await Promise.all(kpiQueries);
    const alertsResult = await alertsQuery;

    const dashboardData = {
      kpis: {
        totalPatients: parseInt(patientCountResult.rows[0].count, 10),
        examsToday: parseInt(examsTodayResult.rows[0].count, 10),
        appointmentsToday: parseInt(appointmentsTodayResult.rows[0].count, 10),
      },
      alerts: alertsResult.rows
    };

    res.status(200).json(dashboardData);

  } catch (error) {
    console.error('Error al obtener los datos del dashboard del admin:', error);
    res.status(500).json({ message: 'Error interno del servidor.' });
  }
};