// src/controllers/patientController.js
const db = require('../services/db');

/**
 * Obtiene una lista de todos los pacientes (rol_id = 2)
 * con un conteo de sus exámenes y la fecha del último examen.
 */
exports.getAllPatients = async (req, res) => {
  try {
    const query = `
      SELECT 
        u.id, u.primer_nombre, u.segundo_nombre, u.primer_apellido, 
        u.segundo_apellido, u.numero_documento,
        CAST(COUNT(e.id) AS INT) AS exam_count,
        MAX(e.fecha_creacion) AS last_exam_date
      FROM usuario u
      LEFT JOIN examen e ON u.id = e.usuario_id
      WHERE u.rol_id = 2 AND u.activo = TRUE
      GROUP BY u.id
      ORDER BY u.primer_apellido, u.primer_nombre;
    `;
    const { rows } = await db.query(query);
    res.status(200).json(rows);
  } catch (error) {
    console.error('Error al obtener pacientes:', error);
    res.status(500).json({ message: 'Error interno del servidor.' });
  }
};

/**
 * Obtiene todos los exámenes de un paciente específico,
 * utilizando una consulta similar a la que ya teníamos en resultsController.
 */
exports.getExamsByPatientId = async (req, res) => {
  const { patientId } = req.params; // Obtiene el ID del paciente desde la URL
  
  try {
    const query = `
      SELECT 
          ex.*,
          te.nombre as tipo_examen_nombre,
          es.codigo as estado_codigo, es.nombre as estado_nombre, 
          es.emoji as estado_emoji, es.color as estado_color,
          u.primer_nombre, u.primer_apellido, u.numero_documento
      FROM examen AS ex
      JOIN usuario AS u ON ex.usuario_id = u.id
      JOIN tipo_examen AS te ON ex.tipo_examen_id = te.id
      LEFT JOIN estado_salud AS es ON ex.estado_salud_id = es.id
      WHERE ex.activo = TRUE AND ex.usuario_id = $1
      ORDER BY ex.fecha_creacion DESC;
    `;
    const { rows } = await db.query(query, [patientId]);
    res.status(200).json(rows);
  } catch (error) {
    console.error('Error al obtener exámenes del paciente:', error);
    res.status(500).json({ message: 'Error interno del servidor.' });
  }
};