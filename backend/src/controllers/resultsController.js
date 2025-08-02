// src/controllers/resultsController.js
const db = require('../services/db');  

exports.searchExamsByDocument = async (req, res) => {
  // Los filtros siguen llegando igual desde el frontend.
  const { cedula, fechaInicio, fechaFin, tipoExamenId } = req.query;

  try {
    let params = [];
    // Empezamos consultando la vista `examen_con_estado` que ya nos da casi todo.
    //  La unimos (JOIN) con la tabla `usuario` para poder filtrar por `numero_documento`
    //    y para obtener el nombre del paciente.
    let query = `
      SELECT
        vista.*, -- Seleccionamos todas las columnas de la vista
        u.primer_nombre,
        u.primer_apellido,
        u.numero_documento
      FROM examen_con_estado AS vista
      JOIN usuario AS u ON vista.usuario_id = u.id -- El JOIN para encontrar al paciente
      WHERE 1=1
    `;

    // La lógica de construcción de filtros dinámicos 
    if (cedula) {
      params.push(cedula);
      query += ` AND u.numero_documento = $${params.length}`;
    }
    if (fechaInicio) {
      params.push(fechaInicio);
      query += ` AND vista.fecha_creacion >= $${params.length}`;
    }
    if (fechaFin) {
      const adjustedEndDate = new Date(fechaFin);
      adjustedEndDate.setDate(adjustedEndDate.getDate() + 1);
      params.push(adjustedEndDate);
      query += ` AND vista.fecha_creacion < $${params.length}`;
    }
    if (tipoExamenId) {
      
      let joinQuery = `
          SELECT
              ex.*, -- Seleccionamos todo de la tabla examen
              u.primer_nombre, u.primer_apellido, u.numero_documento,
              te.nombre as tipo_examen_nombre,
              es.codigo as estado_codigo, es.nombre as estado_nombre, 
              es.emoji as estado_emoji, es.color as estado_color
          FROM examen AS ex
          JOIN usuario AS u ON ex.usuario_id = u.id
          JOIN tipo_examen AS te ON ex.tipo_examen_id = te.id
          LEFT JOIN estado_salud AS es ON ex.estado_salud_id = es.id
          WHERE ex.activo = TRUE
      `;
      // Esta consulta es esencialmente la misma que la vista, pero nos da más control.
      // Así evitamos depender de la vista y podemos filtrar por IDs.

      if (cedula) {
          params.push(cedula);
          joinQuery += ` AND u.numero_documento = $${params.length}`;
      }
      if (fechaInicio) {
          params.push(fechaInicio);
          joinQuery += ` AND ex.fecha_creacion >= $${params.length}`;
      }
      if (fechaFin) {
          const adjustedEndDate = new Date(fechaFin);
          adjustedEndDate.setDate(adjustedEndDate.getDate() + 1);
          params.push(adjustedEndDate);
          joinQuery += ` AND ex.fecha_creacion < $${params.length}`;
      }
      if (tipoExamenId) {
          params.push(tipoExamenId);
          joinQuery += ` AND ex.tipo_examen_id = $${params.length}`;
      }

      joinQuery += ' ORDER BY ex.fecha_creacion DESC;';

      const { rows } = await db.query(joinQuery, params);
      return res.status(200).json(rows);
    }
    // Si no hay tipoExamenId, ejecuta la consulta original
    query += ' ORDER BY vista.fecha_creacion DESC;';
    const { rows } = await db.query(query, params);
    return res.status(200).json(rows);
  } catch (error) {
    console.error('Error al buscar exámenes:', error);
    res.status(500).json({ message: 'Error interno del servidor.' });
  }
};

exports.getExamTypes = async (req, res) => {
  try {
    const { rows } = await db.query('SELECT id, nombre FROM tipo_examen WHERE activo = TRUE ORDER BY nombre');
    res.status(200).json(rows);
  } catch (error) {
    console.error('Error al obtener tipos de examen:', error);
    res.status(500).json({ message: 'Error interno del servidor.' });
  }
};