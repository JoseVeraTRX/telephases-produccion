// src/routes/authRoutes.js
const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// Definimos la ruta para el login
// POST /api/auth/login
router.post('/login', authController.login);

module.exports = router;