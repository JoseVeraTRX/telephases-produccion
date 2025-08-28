// src/controllers/authController.js 
const bcrypt = require('bcryptjs');
const db = require('../services/db');  
const jwt = require('jsonwebtoken');

exports.login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Email y contraseña son requeridos.' });
  }

  try {
    // La consulta es genérica y busca la contraseña encriptada.
    const userQuery = 'SELECT id, email, password_hash, rol_id FROM usuario WHERE email = $1 AND activo = TRUE';
    const { rows } = await db.query(userQuery, [email]);

    // Si el email no se encuentra, se devuelve un error genérico para no dar pistas y caer en faltas de seguridad.
    if (rows.length === 0) {
      return res.status(401).json({ message: 'Credenciales inválidas.' });
    }

    const user = rows[0];

    // Verifica que el rol del usuario que intenta loguearse sea de Administrador (rol_id = 1).
    if (user.rol_id !== 1) {
      return res.status(403).json({ message: 'Acceso denegado. Se requiere rol de administrador.' });
    }
    
    // Verifica que la columna password_hash no esté vacía antes de comparar.
    if (!user.password_hash) {
      return res.status(401).json({ message: 'Credenciales inválidas. Contacte al administrador del sistema.' });
    }

    // Compara la contraseña que envió el usuario con el hash guardado en la base de datos.
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);

    // Si la comparación falla, las contraseñas no coinciden.
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Credenciales inválidas.' });
    }

    // Si todo es correcto, genera el token de seguridad.
    const token = jwt.sign(
      { userId: user.id, role: user.rol_id },
      process.env.JWT_SECRET,
      { expiresIn: '8h' }
    );

    res.status(200).json({
      message: '¡Login de administrador exitoso!',
      token: token
    });

  } catch (error) {
    console.error('Error en el login:', error);
    res.status(500).json({ message: 'Error interno del servidor.' });
  }
};

// el login de PACIENTES
exports.patientLogin = async (req, res) => {
  const { numero_documento, fecha_nacimiento } = req.body;

  if (!numero_documento || !fecha_nacimiento) {
    return res.status(400).json({ message: 'Se requieren el número de documento y la fecha de nacimiento.' });
  }

  try {
    // 1. Buscamos al paciente por su número de documento.
    const userQuery = 'SELECT id, numero_documento, fecha_nacimiento, rol_id FROM usuario WHERE numero_documento = $1 AND activo = TRUE';
    const { rows } = await db.query(userQuery, [numero_documento]);

    if (rows.length === 0) {
      return res.status(404).json({ message: 'Paciente no encontrado.' });
    }

    const patient = rows[0];

    // 2. Nos aseguramos de que el usuario sea un paciente (rol_id = 2).
    if (patient.rol_id !== 2) {
      return res.status(403).json({ message: 'Acceso denegado.' });
    }

    // 3. Comparamos las fechas de nacimiento.
    // La BD devuelve un objeto de fecha. Lo convertimos a 'YYYY-MM-DD' para una comparación segura.
    const dobFromDB = new Date(patient.fecha_nacimiento).toISOString().split('T')[0];
    if (dobFromDB !== fecha_nacimiento) {
      return res.status(401).json({ message: 'Los datos no coinciden.' });
    }

    // 4. Si todo es correcto, generamos el token JWT.
    const token = jwt.sign(
      { userId: patient.id, role: patient.rol_id },
      process.env.JWT_SECRET,
      { expiresIn: '8h' }
    );

    res.status(200).json({
      message: 'Login de paciente exitoso!',
      token: token
    });

  } catch (error) {
    console.error('Error en el login de paciente:', error);
    res.status(500).json({ message: 'Error interno del servidor.' });
  }
};