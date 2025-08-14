// src/routes/authRoutes.js
const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// ruta para el login de administradores
// POST /api/auth/login
router.post('/login', authController.login);
// ruta para el login de pacientes
// POST /api/auth/patient-login
router.post('/patient-login', authController.patientLogin);

module.exports = router;