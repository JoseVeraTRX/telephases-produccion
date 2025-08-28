// index.js

require('dotenv').config();
const express = require('express');
const cors = require('cors');

// Importar las rutas
const authRoutes = require('./src/routes/authRoutes');
const resultsRoutes = require('./src/routes/resultsRoutes');
const citasRoutes = require('./src/routes/citasRoutes');
const patientRoutes = require('./src/routes/patientRoutes');
const adminRoutes = require('./src/routes/adminRoutes');

const app = express();

// Middleware 
app.use(cors());
app.use(express.json());

// Rutas
app.use('/api/auth', authRoutes);
app.use('/api/results', resultsRoutes);
app.use('/api/patients', patientRoutes);
app.use('/api/citas', citasRoutes);
app.use('/api/admin', adminRoutes);



// Ruta de bienvenida 
app.get('/', (req, res) => {
  res.send('API de Telephases funcionando correctamente!');
});

const PORT = process.env.API_PORT || 3001;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en el puerto ${PORT}`);
});