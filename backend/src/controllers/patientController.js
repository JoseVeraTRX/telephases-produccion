const db = require('../services/db');
const bcrypt = require('bcryptjs');

const calculateTrends = (allRecentExams, examTypes) => {
  const trends = {};

  for (const examType of examTypes) {
    const examsForType = allRecentExams.filter(e => e.tipo_examen_nombre === examType.nombre);
    
    if (examsForType.length < 2) {
      trends[examType.nombre] = 'estable';
      continue;
    }

    examsForType.sort((a, b) => new Date(a.fecha_creacion) - new Date(b.fecha_creacion));

    const latestExam = examsForType[examsForType.length - 1];
    const previousExams = examsForType.slice(0, examsForType.length - 1);

    const parseValue = (exam) => {
      if (!exam || !exam.valor) return null;
      return parseFloat(exam.valor.split('/')[0]);
    };
    
    const latestValue = parseValue(latestExam);
    
    if (previousExams.length === 0) {
        trends[examType.nombre] = 'estable';
        continue;
    }
    const avgPrevious = previousExams.reduce((sum, exam) => sum + parseValue(exam), 0) / previousExams.length;

    if (latestValue === null || isNaN(latestValue) || isNaN(avgPrevious)) {
      trends[examType.nombre] = 'estable';
      continue;
    }
    
    const difference = latestValue - avgPrevious;
    const threshold = avgPrevious * 0.05;

    const isHigherBetter = examType.nombre === 'OXYGEN_SATURATION';

    if (Math.abs(difference) < threshold) {
      trends[examType.nombre] = 'estable';
    } else if (isHigherBetter) {
      trends[examType.nombre] = difference > 0 ? 'mejora' : 'empeora';
    } else {
      trends[examType.nombre] = difference < 0 ? 'mejora' : 'empeora';
    }
  }

  return trends;
};

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

exports.getExamsByPatientId = async (req, res) => {
  const { patientId } = req.params;
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

exports.findPatientByDocument = async (req, res) => {
  const { numero_documento } = req.params;
  try {
    const query = 'SELECT id, primer_nombre, primer_apellido FROM usuario WHERE numero_documento = $1 AND rol_id = 2';
    const { rows } = await db.query(query, [numero_documento]);
    if (rows.length === 0) {
      return res.status(404).json({ message: 'No se encontró ningún paciente con ese número de documento.' });
    }
    res.status(200).json(rows[0]);
  } catch (error) {
    console.error('Error al buscar paciente por documento:', error);
    res.status(500).json({ message: 'Error interno del servidor.' });
  }
};

exports.registerPatient = async (req, res) => {
  const {
    primer_nombre, segundo_nombre, primer_apellido, segundo_apellido,
    tipo_documento_id, numero_documento,
    email, telefono, fecha_nacimiento, genero
  } = req.body;

  if (!primer_nombre || !primer_apellido || !numero_documento || !tipo_documento_id) {
    return res.status(400).json({ message: 'Nombre, apellido, tipo y número de documento son obligatorios.' });
  }

  try {
    const username = `paciente_${numero_documento}`;
    const passwordHash = await bcrypt.hash(numero_documento, 10);

    const query = `
      INSERT INTO usuario (
        username, password_hash,
        primer_nombre, segundo_nombre, primer_apellido, segundo_apellido,
        tipo_documento_id, numero_documento,
        email, telefono, fecha_nacimiento, genero,
        rol_id, activo
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, 2, TRUE)
      RETURNING id, primer_nombre, primer_apellido;
    `;
    const values = [
      username,
      passwordHash,
      primer_nombre,
      segundo_nombre || null,
      primer_apellido,
      segundo_apellido || null,
      tipo_documento_id,
      numero_documento,
      email || null,
      telefono || null,
      fecha_nacimiento || null,
      genero || null
    ];

    const { rows } = await db.query(query, values);
    
    res.status(201).json({
      message: 'Paciente registrado exitosamente.',
      patient: rows[0]
    });

  } catch (error) {
    console.error('Error al registrar paciente:', error);
    if (error.code === '23505') { 
      return res.status(409).json({ message: 'El número de documento, email o username ya se encuentran registrados.' });
    }
    res.status(500).json({ message: 'Error interno del servidor.' });
  }
};

exports.getPatientDashboard = async (req, res) => {
  const patientId = req.user.userId;

  try {
    const patientQuery = db.query('SELECT primer_nombre, primer_apellido FROM usuario WHERE id = $1', [patientId]);
    
    const examsQuery = db.query(`
      SELECT DISTINCT ON (te.nombre) ex.id, ex.titulo, ex.valor, ex.unidad, ex.fecha_creacion,
             te.nombre as tipo_examen_nombre, es.nombre as estado_nombre,
             es.emoji as estado_emoji, es.color as estado_color, es.nivel_urgencia
      FROM examen AS ex
      JOIN tipo_examen AS te ON ex.tipo_examen_id = te.id
      LEFT JOIN estado_salud AS es ON ex.estado_salud_id = es.id
      WHERE ex.usuario_id = $1 AND ex.activo = TRUE
      ORDER BY te.nombre, ex.fecha_creacion DESC;
    `, [patientId]);
    
    // --- CORRECCIÓN CLAVE AQUÍ ---
    // Añadimos el prefijo 'examen.' a las columnas 'fecha_creacion' para eliminar la ambigüedad
    const trendQuery = db.query(`
      SELECT valor, te.nombre as tipo_examen_nombre, examen.fecha_creacion 
      FROM examen 
      JOIN tipo_examen te ON examen.tipo_examen_id = te.id
      WHERE usuario_id = $1 AND examen.fecha_creacion >= NOW() - INTERVAL '15 days'
    `, [patientId]);
    
    const allExamTypesQuery = db.query('SELECT nombre FROM tipo_examen');

    const [
      patientResult,
      examsResult,
      trendResult,
      allExamTypesResult
    ] = await Promise.all([patientQuery, examsQuery, trendQuery, allExamTypesQuery]);

    if (patientResult.rows.length === 0) {
      return res.status(404).json({ message: 'Paciente no encontrado.' });
    }
    
    const trends = calculateTrends(trendResult.rows, allExamTypesResult.rows);
    
    res.status(200).json({
      profile: patientResult.rows[0],
      latestExams: examsResult.rows,
      trends: trends
    });

  } catch (error) {
    console.error('Error al obtener datos del dashboard del paciente:', error);
    res.status(500).json({ message: 'Error interno del servidor.' });
  }
};

exports.getPatientExams = async (req, res) => {
  const patientId = req.user.userId;
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
    console.error('Error al obtener el historial de exámenes del paciente:', error);
    res.status(500).json({ message: 'Error interno del servidor.' });
  }
};