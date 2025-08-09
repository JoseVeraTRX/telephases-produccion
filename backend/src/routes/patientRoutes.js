// src/routes/patientRoutes.js
const express = require('express');
const router = express.Router();
const patientController = require('../controllers/patientController');
const authMiddleware = require('../middleware/authMiddleware'); // ¡Reutilizamos nuestro guardián!

// Ruta para obtener la lista de TODOS los pacientes
// GET /api/patients
router.get('/', authMiddleware, patientController.getAllPatients);

// Ruta para obtener los exámenes de UN paciente específico por su ID
// GET /api/patients/123e4567-e89b-12d3-a456-426614174000/exams
router.get('/:patientId/exams', authMiddleware, patientController.getExamsByPatientId);

module.exports = router;