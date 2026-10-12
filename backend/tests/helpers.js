const request = require('supertest');
const app = require('../src/app');
const pool = require('../src/db/pool');

const CSRF = { 'X-Requested-With': 'TucuMaps' };

const datosRegistro = (extra = {}) => ({
  nombre: 'Ana Pérez',
  email: 'ana@mail.com',
  password: 'clave1234',
  acepta_terminos: true,
  mayor_de_edad: true,
  ...extra,
});

async function limpiarBase() {
  await pool.query('TRUNCATE usuarios RESTART IDENTITY CASCADE');
}

// Registra un usuario y devuelve un agente de supertest que conserva la cookie.
async function registrarYEntrar(extra = {}) {
  const agente = request.agent(app);
  const res = await agente.post('/api/auth/registro').set(CSRF).send(datosRegistro(extra));
  if (res.status !== 201) throw new Error(`Registro falló: ${res.status} ${JSON.stringify(res.body)}`);
  return { agente, usuario: res.body.usuario };
}

module.exports = { app, pool, request, CSRF, datosRegistro, limpiarBase, registrarYEntrar };
