// src/controllers/patientController.js - VERSIÓN FINAL Y COMPLETA
const db = require('../services/db');
const bcrypt = require('bcryptjs'); 


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
      SELECT ex.*, te.nombre as tipo_examen_nombre, es.codigo as estado_codigo, es.nombre as estado_nombre, 
             es.emoji as estado_emoji, es.color as estado_color, u.primer_nombre, u.primer_apellido, u.numero_documento
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

exports.getPatientDashboard = async (req, res) => {
  const patientId = req.user.userId;
  try {
    const patientQuery = 'SELECT primer_nombre, primer_apellido FROM usuario WHERE id = $1';
    const patientResult = await db.query(patientQuery, [patientId]);
    if (patientResult.rows.length === 0) {
      return res.status(404).json({ message: 'Paciente no encontrado.' });
    }
    const examsQuery = `
      SELECT DISTINCT ON (te.nombre) ex.*, te.nombre as tipo_examen_nombre, es.nombre as estado_nombre,
             es.emoji as estado_emoji, es.color as estado_color
      FROM examen AS ex
      JOIN tipo_examen AS te ON ex.tipo_examen_id = te.id
      LEFT JOIN estado_salud AS es ON ex.estado_salud_id = es.id
      WHERE ex.usuario_id = $1 AND ex.activo = TRUE
      ORDER BY te.nombre, ex.fecha_creacion DESC;
    `;
    const examsResult = await db.query(examsQuery, [patientId]);
    res.status(200).json({
      profile: patientResult.rows[0],
      latestExams: examsResult.rows
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
      SELECT ex.*, te.nombre as tipo_examen_nombre, es.codigo as estado_codigo, es.nombre as estado_nombre, 
             es.emoji as estado_emoji, es.color as estado_color, u.primer_nombre, u.primer_apellido, u.numero_documento
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

// Función para registrar un nuevo paciente
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
    // --- LÓGICA DE GENERACIÓN AUTOMÁTICA ---
    // 1. Generamos el username usando el patrón de la BD
    const username = `paciente_${numero_documento}`;
    
    // 2. Generamos el hash de la contraseña usando el documento como password por defecto
    const passwordHash = await bcrypt.hash(numero_documento, 10);

    // --- CONSULTA INSERT FINAL Y COMPLETA ---
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