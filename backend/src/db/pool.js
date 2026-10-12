const { Pool } = require('pg');
const env = require('../config/env');

// Neon exige SSL; la cadena de conexión ya trae sslmode=require.
const pool = new Pool({ connectionString: env.DATABASE_URL, max: 10 });

module.exports = pool;
