// src/routes/adminRoutes.js
const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const authMiddleware = require('../middleware/authMiddleware');

// La única ruta que necesitamos por ahora para el dashboard
// GET /api/admin/dashboard
router.get('/dashboard', authMiddleware, adminController.getDashboardData);

module.exports = router;