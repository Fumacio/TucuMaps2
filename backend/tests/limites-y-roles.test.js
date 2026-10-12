const express = require('express');
const cookieParser = require('cookie-parser');
const { requerirSesion, requerirVerificado, requerirRol } = require('../src/middlewares/auth');
const { manejarErrores } = require('../src/middlewares/errores');
const { app, pool, request, CSRF, limpiarBase, registrarYEntrar } = require('./helpers');

beforeEach(limpiarBase);
afterAll(() => pool.end());

describe('Límite de intentos de login (RF-01)', () => {
  test('después de 5 fallidos en 15 minutos responde 429 con Retry-After', async () => {
    await registrarYEntrar();
    for (let i = 0; i < 5; i++) {
      const res = await request(app).post('/api/auth/login').set(CSRF).send({ email: 'ana@mail.com', password: 'mal12345' });
      expect(res.status).toBe(401);
    }
    const bloqueado = await request(app).post('/api/auth/login').set(CSRF).send({ email: 'ana@mail.com', password: 'clave1234' });
    expect(bloqueado.status).toBe(429);
    expect(bloqueado.body.error.codigo).toBe('DEMASIADOS_INTENTOS');
    expect(bloqueado.headers['retry-after']).toBeDefined();
  });
});

describe('Niveles de acceso: Verificado y Admin', () => {
  // App mínima de prueba con rutas protegidas, igual que las usarán los próximos sprints.
  const appPrueba = express();
  appPrueba.use(cookieParser());
  appPrueba.get('/verificado', requerirSesion, requerirVerificado, (req, res) => res.json({ ok: true }));
  appPrueba.get('/admin', requerirSesion, requerirRol('admin'), (req, res) => res.json({ ok: true }));
  appPrueba.use(manejarErrores);

  const cookieDe = async (agente) => {
    const res = await agente.get('/api/auth/me');
    return res.headers['set-cookie'];
  };

  test('sin email verificado responde 403 EMAIL_NO_VERIFICADO; verificado pasa', async () => {
    const { agente } = await registrarYEntrar();
    const cookie = await cookieDe(agente);
    const antes = await request(appPrueba).get('/verificado').set('Cookie', cookie);
    expect(antes.status).toBe(403);
    expect(antes.body.error.codigo).toBe('EMAIL_NO_VERIFICADO');

    await pool.query('UPDATE usuarios SET email_verificado = TRUE');
    const despues = await request(appPrueba).get('/verificado').set('Cookie', cookie);
    expect(despues.status).toBe(200);
  });

  test('un ciudadano no entra a rutas de admin; un admin sí', async () => {
    const { agente } = await registrarYEntrar();
    const cookie = await cookieDe(agente);
    const ciudadano = await request(appPrueba).get('/admin').set('Cookie', cookie);
    expect(ciudadano.status).toBe(403);
    expect(ciudadano.body.error.codigo).toBe('SIN_PERMISO');

    await pool.query("UPDATE usuarios SET rol = 'admin'");
    const admin = await request(appPrueba).get('/admin').set('Cookie', cookie);
    expect(admin.status).toBe(200);
  });
});
