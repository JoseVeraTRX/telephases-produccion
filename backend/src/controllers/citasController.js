// src/controllers/citasController.js
const db = require('../services/db');

// Obtiene todas las citas con detalles completos para el ADMIN
exports.getAllCitas = async (req, res) => {
  try {
    // Esta consulta une todas las tablas para darnos información completa y lista para usar.
    const query = `
      SELECT
          c.id AS cita_id,
          c.fecha_cita,
          c.observaciones_admin,
          ec.nombre AS estado_cita,
          u_paciente.id AS paciente_id,
          u_paciente.primer_nombre AS paciente_nombre,
          u_paciente.primer_apellido AS paciente_apellido,
          u_paciente.numero_documento AS paciente_cedula,
          u_admin.primer_nombre AS admin_nombre,
          u_admin.primer_apellido AS admin_apellido,
          STRING_AGG(te.nombre, ', ') AS examenes_previstos
      FROM citas c
      JOIN estado_cita ec ON c.estado_cita_id = ec.id
      JOIN usuario u_paciente ON c.paciente_id = u_paciente.id
      JOIN usuario u_admin ON c.creado_por_usuario_id = u_admin.id
      LEFT JOIN cita_examenes_previstos cep ON c.id = cep.cita_id
      LEFT JOIN tipo_examen te ON cep.tipo_examen_id = te.id
      GROUP BY c.id, ec.nombre, u_paciente.id, u_admin.id
      ORDER BY c.fecha_cita DESC;
    `;
    const { rows } = await db.query(query);
    res.status(200).json(rows);
  } catch (error) {
    console.error('Error al obtener las citas:', error);
    res.status(500).json({ message: 'Error interno del servidor.' });
  }
};

// Crea una nueva cita y asocia los exámenes previstos solo si se proporcionan
exports.createCita = async (req, res) => {
  const {
    paciente_id,
    fecha_cita,
    observaciones_admin,
    examenes_previstos // Esperamos un array de IDs, ej: [1, 2, 5]
  } = req.body;
  
  const adminId = req.user.userId; // Obtenemos el ID del admin desde el token

  if (!paciente_id || !fecha_cita) {
    return res.status(400).json({ message: 'Se requieren el ID del paciente y la fecha de la cita.' });
  }

  try {
    // Paso 1: Crear la cita principal
    const citaQuery = `
      INSERT INTO citas (paciente_id, creado_por_usuario_id, fecha_cita, observaciones_admin)
      VALUES ($1, $2, $3, $4)
      RETURNING id;
    `;
    const citaResult = await db.query(citaQuery, [paciente_id, adminId, fecha_cita, observaciones_admin]);
    const newCitaId = citaResult.rows[0].id;

    // Paso 2: Asociar los exámenes previstos (si se enviaron)
    if (examenes_previstos && examenes_previstos.length > 0) {
      let examenValues = '';
      const params = [];
      examenes_previstos.forEach((examenId, index) => {
        params.push(newCitaId, examenId);
        examenValues += `($${params.length - 1}, $${params.length}),`;
      });
      examenValues = examenValues.slice(0, -1); // Quitamos la última coma

      const examenesQuery = `
        INSERT INTO cita_examenes_previstos (cita_id, tipo_examen_id)
        VALUES ${examenValues};
      `;
      await db.query(examenesQuery, params);
    }
    
    res.status(201).json({ message: 'Cita creada exitosamente.', cita_id: newCitaId });

  } catch (error) {
    console.error('Error al crear la cita:', error);
    res.status(500).json({ message: 'Error interno del servidor.' });
  }
};

// Actualiza los detalles de una cita existente, incluyendo los exámenes previstos.
exports.updateCita = async (req, res) => {
  const { citaId } = req.params;
  const { fecha_cita, observaciones_admin, examenes_previstos } = req.body;

  try {
    // Actualizar los datos principales de la cita
    await db.query(
      'UPDATE citas SET fecha_cita = $1, observaciones_admin = $2, fecha_modificacion = NOW() WHERE id = $3',
      [fecha_cita, observaciones_admin, citaId]
    );

    // Actualizar los exámenes previstos (borrando los anteriores y añadiendo los nuevos)
    await db.query('DELETE FROM cita_examenes_previstos WHERE cita_id = $1', [citaId]);

    if (examenes_previstos && examenes_previstos.length > 0) {
      let examenValues = '';
      const params = [];
      examenes_previstos.forEach((examenId) => {
        params.push(citaId, examenId);
        examenValues += `($${params.length - 1}, $${params.length}),`;
      });
      examenValues = examenValues.slice(0, -1);
      const examenesQuery = `INSERT INTO cita_examenes_previstos (cita_id, tipo_examen_id) VALUES ${examenValues}`;
      await db.query(examenesQuery, params);
    }

    res.status(200).json({ message: 'Cita actualizada exitosamente.' });

  } catch (error) {
    console.error('Error al actualizar la cita:', error);
    res.status(500).json({ message: 'Error interno del servidor.' });
  }
};

// Cambia el estado de una cita a "Cancelada"
exports.cancelCita = async (req, res) => {
  const { citaId } = req.params;

  try {
    await db.query('UPDATE citas SET estado_cita_id = 4 WHERE id = $1', [citaId]);
    res.status(200).json({ message: 'Cita cancelada exitosamente.' });
  } catch (error) {
    console.error('Error al cancelar la cita:', error);
    res.status(500).json({ message: 'Error interno del servidor.' });
  }
};

exports.getCitaById = async (req, res) => {
  const { citaId } = req.params;
  try {
    const citaQuery = 'SELECT * FROM citas WHERE id = $1';
    const examenesQuery = 'SELECT tipo_examen_id FROM cita_examenes_previstos WHERE cita_id = $1';
    
    const citaResult = await db.query(citaQuery, [citaId]);
    if (citaResult.rows.length === 0) {
      return res.status(404).json({ message: 'Cita no encontrada.' });
    }
    
    const examenesResult = await db.query(examenesQuery, [citaId]);
    const examenesIds = examenesResult.rows.map(r => r.tipo_examen_id);
    
    const citaData = citaResult.rows[0];
    citaData.examenes_previstos = examenesIds;
    
    res.status(200).json(citaData);
  } catch (error) {
    console.error('Error al obtener la cita:', error);
    res.status(500).json({ message: 'Error interno del servidor.' });
  }
};

exports.getMyCitas = async (req, res) => {
  const patientId = req.user.userId; // Obtenemos el ID desde el token

  try {
    const query = `
      SELECT
          c.id AS cita_id,
          c.fecha_cita,
          c.observaciones_admin,
          ec.nombre AS estado_cita,
          STRING_AGG(te.nombre, ', ') AS examenes_previstos
      FROM citas c
      JOIN estado_cita ec ON c.estado_cita_id = ec.id
      LEFT JOIN cita_examenes_previstos cep ON c.id = cep.cita_id
      LEFT JOIN tipo_examen te ON cep.tipo_examen_id = te.id
      WHERE c.paciente_id = $1
      GROUP BY c.id, ec.nombre
      ORDER BY c.fecha_cita DESC;
    `;
    const { rows } = await db.query(query, [patientId]);
    res.status(200).json(rows);
  } catch (error) {
    console.error('Error al obtener las citas del paciente:', error);
    res.status(500).json({ message: 'Error interno del servidor.' });
  }
};

exports.cancelMyCita = async (req, res) => {
  const { citaId } = req.params; // El ID de la cita a cancelar
  const patientId = req.user.userId; // El ID del paciente desde el token

  try {
    // Esta consulta es muy segura: actualiza la cita SOLO SI el ID de la cita
    // y el ID del paciente coinciden. Un paciente nunca podrá cancelar la cita de otro gracias a esto, solo el admin.
    const updateQuery = `
      UPDATE citas 
      SET estado_cita_id = 3, fecha_modificacion = NOW() 
      WHERE id = $1 AND paciente_id = $2
      RETURNING id;
    `;
    
    const result = await db.query(updateQuery, [citaId, patientId]);

    // Si la consulta no actualizó ninguna fila, significa que la cita no existe o no le pertenece.
    if (result.rowCount === 0) {
      return res.status(404).json({ message: 'No se encontró la cita o no tienes permiso para cancelarla.' });
    }
    
    res.status(200).json({ message: 'Tu cita ha sido cancelada exitosamente.' });

  } catch (error) {
    console.error('Error al cancelar la cita por el paciente:', error);
    res.status(500).json({ message: 'Error interno del servidor.' });
  }
};

// Cambia el estado de una cita a "Confirmada" por admin desde el portal de administración
exports.confirmCita = async (req, res) => {
  const { citaId } = req.params;

  try {
    // Buscamos la cita para asegurarnos de que existe y está en estado 'Programada'
    const citaActual = await db.query('SELECT estado_cita_id FROM citas WHERE id = $1', [citaId]);

    if (citaActual.rows.length === 0) {
      return res.status(404).json({ message: 'La cita no existe.' });
    }
    if (citaActual.rows[0].estado_cita_id !== 1) {
      return res.status(409).json({ message: 'La cita no se puede confirmar porque no está en estado "Programada".' });
    }

    // Actualizamos el estado a 2 (Confirmada)
    await db.query('UPDATE citas SET estado_cita_id = 2 WHERE id = $1', [citaId]);
    res.status(200).json({ message: 'Cita confirmada exitosamente.' });
  } catch (error) {
    console.error('Error al confirmar la cita:', error);
    res.status(500).json({ message: 'Error interno del servidor.' });
  }
};