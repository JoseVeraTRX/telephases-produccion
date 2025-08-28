// src/routes/citasRoutes.js 

const express = require('express');
const router = express.Router();
const citasController = require('../controllers/citasController');
const authMiddleware = require('../middleware/authMiddleware');

// Ruta para que el PACIENTE obtenga su historial de citas
router.get('/mis-citas', authMiddleware, citasController.getMyCitas);

// Ruta para que el ADMIN obtenga la lista de TODAS las citas
router.get('/', authMiddleware, citasController.getAllCitas);

// Ruta para que el ADMIN obtenga los datos de UNA cita específica para editar
router.get('/:citaId', authMiddleware, citasController.getCitaById);

// Rutas POST, PUT, DELETE para que el ADMIN gestione las citas
router.post('/', authMiddleware, citasController.createCita);
router.put('/:citaId', authMiddleware, citasController.updateCita);
router.delete('/:citaId', authMiddleware, citasController.cancelCita);

// Ruta para que el PACIENTE cancele una de sus citas
// PUT /api/citas/mis-citas/:citaId/cancel
router.put('/mis-citas/:citaId/cancel', authMiddleware, citasController.cancelMyCita);

// Ruta para que el ADMIN confirme una cita pendiente
// PUT /api/citas/:citaId/confirm
router.put('/:citaId/confirm', authMiddleware, citasController.confirmCita);


module.exports = router;