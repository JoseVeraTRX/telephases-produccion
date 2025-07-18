// src/services/db.js - VERSIÓN FINAL Y CORRECTA

const { Pool } = require('pg');
require('dotenv').config(); // <-- ¡Muy importante descomentar o añadir esta línea!

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_DATABASE,
  password: process.env.DB_PASSWORD, // Ahora sí leemos la contraseña
  port: process.env.DB_PORT,
});

module.exports = {
  query: (text, params) => pool.query(text, params),
};