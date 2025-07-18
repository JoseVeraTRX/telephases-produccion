// src/controllers/resultsController.js
const db = require('../services/db');

exports.searchExamsByDocument = async (req, res) => {
  // 1. Obtener el número de documento de los parámetros de la URL (?cedula=123)
  // Usamos 'cedula' como el nombre del parámetro que vendrá del frontend
  const { cedula } = req.query;

  if (!cedula) {
    return res.status(400).json({ message: 'El número de documento es requerido.' });
  }

  try {
    // 2. Escribir la consulta SQL para obtener los exámenes
    // Esta consulta es la magia: une tres tablas.
    // - Empieza en 'examen'
    // - Se une con 'usuario' para filtrar por numero_documento y obtener el nombre del paciente.
    // - Se une con 'tipo_examen' para obtener el nombre del examen.
    const query = `
      SELECT
        examen.id,
        examen.titulo,
        examen.valor,
        examen.unidad,
        examen.observaciones,
        examen.fecha_creacion,
        tipo_examen.nombre AS tipo_examen_nombre,
        usuario.primer_nombre,
        usuario.primer_apellido
      FROM examen
      JOIN usuario ON examen.usuario_id = usuario.id
      JOIN tipo_examen ON examen.tipo_examen_id = tipo_examen.id
      WHERE usuario.numero_documento = $1
      ORDER BY examen.fecha_creacion DESC;
    `;

    // 3. Ejecutar la consulta en la base de datos
    const { rows } = await db.query(query, [cedula]);

    // 4. Devolver los resultados
    // Si no se encuentran exámenes para esa cédula, rows será un array vacío, lo cual es correcto.
    res.status(200).json(rows);

  } catch (error) {
    console.error('Error al buscar exámenes:', error);
    res.status(500).json({ message: 'Error interno del servidor.' });
  }
};