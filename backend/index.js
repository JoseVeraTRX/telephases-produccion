// index.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');

// Importamos AMBOS archivos de rutas
const authRoutes = require('./src/routes/authRoutes');
const resultsRoutes = require('./src/routes/resultsRoutes'); 
const patientRoutes = require('./src/routes/patientRoutes');
const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Rutas
app.use('/api/auth', authRoutes);
app.use('/api/results', resultsRoutes); 
app.use('/api/patients', patientRoutes);

// Ruta de bienvenida para probar que el servidor funciona
app.get('/', (req, res) => {
  res.send('API de Telephases funcionando correctamente!');
});

const PORT = process.env.API_PORT || 3001;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en el puerto ${PORT}`);
});
