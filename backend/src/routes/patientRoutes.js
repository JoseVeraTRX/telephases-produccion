// src/routes/patientRoutes.js - VERSIÓN CORREGIDA Y FINAL

const express = require('express');
const router = express.Router();
const patientController = require('../controllers/patientController');
const authMiddleware = require('../middleware/authMiddleware');

// Ruta para que el ADMIN obtenga la lista de TODOS los pacientes
// GET /api/patients
router.get('/', authMiddleware, patientController.getAllPatients);

// Ruta para que el PACIENTE obtenga sus propios datos
// GET /api/patients/me
router.get('/me/dashboard', authMiddleware, patientController.getPatientDashboard);
router.get('/me/exams', authMiddleware, patientController.getPatientExams);

// Ruta para buscar un paciente específico por su cédula
// GET /api/patients/documento/123456
router.get('/documento/:numero_documento', authMiddleware, patientController.findPatientByDocument);

// Ruta para que el ADMIN obtenga los exámenes de CUALQUIER paciente
// GET /api/patients/:patientId/exams
router.get('/:patientId/exams', authMiddleware, patientController.getExamsByPatientId);

// Ruta para que el admin registre un nuevo paciente
// POST /api/patients
router.post('/', authMiddleware, patientController.registerPatient);
module.exports = router;