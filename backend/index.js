// index.js

require('dotenv').config();
const express = require('express');
const cors = require('cors');

// Importamos nuestras rutas existentes
const authRoutes = require('./src/routes/authRoutes');
const resultsRoutes = require('./src/routes/resultsRoutes');

// Importamos las nuevas rutas de pacientes
const patientRoutes = require('./src/routes/patientRoutes');

const app = express();

// Middleware (sin cambios)
app.use(cors());
app.use(express.json());

// Rutas
app.use('/api/auth', authRoutes);
app.use('/api/results', resultsRoutes);


// Le decimos a la app que use las nuevas rutas bajo el prefijo /api/patients
app.use('/api/patients', patientRoutes);

// Ruta de bienvenida (sin cambios)
app.get('/', (req, res) => {
  res.send('API de Telephases funcionando correctamente!');
});

const PORT = process.env.API_PORT || 3001;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en el puerto ${PORT}`);
});