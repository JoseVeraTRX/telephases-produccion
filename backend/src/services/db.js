// // src/services/db.js 
// const { Pool } = require('pg');
// require('dotenv').config(); 

// const pool = new Pool({
//   user: process.env.DB_USER,
//   host: process.env.DB_HOST,
//   database: process.env.DB_DATABASE,
//   password: process.env.DB_PASSWORD, 
//   port: process.env.DB_PORT,
// });

// module.exports = {
//   query: (text, params) => pool.query(text, params),
// };

// src/services/db.js - VERSIÓN DE DEPURACIÓN

const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_DATABASE,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

// Envolvemos el método de consulta para añadir nuestro "espía"
module.exports = {
  query: (text, params) => {
    
    // --- ESTE ES NUESTRO ESPÍA ---
    const start = Date.now();
    console.log('--- DB Query Start ---');
    console.log('QUERY:', text); // Nos muestra la consulta SQL exacta
    console.log('PARAMS:', params); // Nos muestra los valores que se van a usar

    return pool.query(text, params)
      .then(res => {
        const duration = Date.now() - start;
        console.log('--- DB Query End ---');
        console.log(`Executed in: ${duration}ms, Rows returned: ${res.rowCount}`);
        return res;
      })
      .catch(err => {
        console.error('--- DB QUERY ERROR ---', err);
        throw err; // Es importante relanzar el error para que el catch del controlador lo reciba
      });
  },
};