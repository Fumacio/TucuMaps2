// Antes de todas las pruebas: deja la base de pruebas vacía y aplica las migraciones.
// Nunca usa DATABASE_URL, solo TEST_DATABASE_URL.
require('dotenv').config({ quiet: true });
const path = require('node:path');
const { Client } = require('pg');
const { runner } = require('node-pg-migrate');

module.exports = async () => {
  const url = process.env.TEST_DATABASE_URL;
  if (!url) throw new Error('Falta TEST_DATABASE_URL (ver backend/.env.example).');
  if (url === process.env.DATABASE_URL) {
    throw new Error('TEST_DATABASE_URL no puede ser la misma base que DATABASE_URL.');
  }

  const cliente = new Client({ connectionString: url });
  await cliente.connect();
  await cliente.query('DROP SCHEMA IF EXISTS public CASCADE; CREATE SCHEMA public;');
  await cliente.end();

  await runner({
    databaseUrl: url,
    dir: path.join(__dirname, '..', 'migrations'),
    direction: 'up',
    migrationsTable: 'pgmigrations',
    log: () => {},
  });
};
