// src/middleware/authMiddleware.js
const jwt = require('jsonwebtoken');

module.exports = function(req, res, next) {
  // 1. Obtener el token de la cabecera 'Authorization'
  const authHeader = req.header('Authorization');

  // 2. Si no hay cabecera o no empieza con "Bearer ", denegar acceso
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Acceso denegado. No se proporcionó token.' });
  }

  // 3. Extraer el token (quitando "Bearer ")
  const token = authHeader.split(' ')[1];

  // 4. Verificar el token
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    // Si el token es válido, `decoded` contiene el payload (userId, role)
    // Añadimos esta información a la petición para usarla más adelante
    req.user = decoded;
    next(); // Permite que la petición continúe hacia el controlador
  } catch (ex) {
    res.status(400).json({ message: 'Token inválido.' });
  }
};