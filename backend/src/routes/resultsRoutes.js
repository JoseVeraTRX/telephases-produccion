// src/routes/resultsRoutes.js
const express = require('express');
const router = express.Router();
const resultsController = require('../controllers/resultsController');
const authMiddleware = require('../middleware/authMiddleware');

// Definimos la ruta para buscar exámenes por número de documento.
// GET /api/results/search?cedula=...
// Esta ruta espera un parámetro de consulta llamado `cedula`
// Ponemos `authMiddleware` como el segundo argumento. Express lo ejecutará
// automáticamente después de recibir la petición y antes de pasarla
// a `resultsController.searchExamsByDocument`.
router.get('/search', authMiddleware, resultsController.searchExamsByDocument);

module.exports = router;