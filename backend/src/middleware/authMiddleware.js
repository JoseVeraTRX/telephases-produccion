// src/middleware/authMiddleware.js - VERSIÓN DE DEPURACIÓN

const jwt = require('jsonwebtoken');

module.exports = function(req, res, next) {
  console.log('--- Auth Middleware: ¡Petición recibida! ---');

  const authHeader = req.header('Authorization');
  
  if (!authHeader) {
    console.error('ERROR en Auth Middleware: No se encontró la cabecera "Authorization".');
    return res.status(401).json({ message: 'Acceso denegado. Token no proporcionado.' });
  }
  
  console.log('Auth Middleware: Cabecera encontrada:', authHeader);

  if (!authHeader.startsWith('Bearer ')) {
    console.error('ERROR en Auth Middleware: La cabecera no empieza con "Bearer ".');
    return res.status(401).json({ message: 'Formato de token inválido.' });
  }

  const token = authHeader.split(' ')[1];
  console.log('Auth Middleware: Token extraído:', token);

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    console.log('Auth Middleware: Token decodificado con ÉXITO:', decoded);
    
    req.user = decoded;
    next(); // ¡Pasa al siguiente nivel (el controlador)!

  } catch (ex) {
    console.error('ERROR FATAL en Auth Middleware: El token es inválido o ha expirado.', ex);
    res.status(400).json({ message: 'Token inválido.' });
  }
};