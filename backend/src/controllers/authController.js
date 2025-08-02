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

    // Si el email no se encuentra, se devuelve un error genérico para no dar pistas.
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