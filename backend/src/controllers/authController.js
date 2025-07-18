// src/controllers/authController.js
const db = require('../services/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

exports.login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Email y contraseña son requeridos.' });
  }

  try {
    const userQuery = 'SELECT id, email, password_hash, rol_id FROM usuario WHERE email = $1 AND activo = TRUE';
    const { rows } = await db.query(userQuery, [email]);

    if (rows.length === 0) {
      return res.status(401).json({ message: 'Credenciales inválidas.' });
    }
    const user = rows[0];

    // --- LÍNEA MODIFICADA ---
    // Verificamos que el rol sea el de superusuario (ID 1)
    if (user.rol_id !== 2) {
      return res.status(403).json({ message: 'Acceso denegado. Rol no autorizado.' });
    }
    // --- FIN DE LA MODIFICACIÓN ---

    const isPasswordCorrect = await bcrypt.compare(password, user.password_hash);
    if (!isPasswordCorrect) {
      return res.status(401).json({ message: 'Credenciales inválidas.' });
    }

    const token = jwt.sign(
      { userId: user.id, role: user.rol_id },
      process.env.JWT_SECRET,
      { expiresIn: '8h' }
    );

    res.status(200).json({
      message: 'Login exitoso!',
      token: token
    });

  } catch (error) {
    console.error('Error en el login:', error);
    res.status(500).json({ message: 'Error interno del servidor.' });
  }
};