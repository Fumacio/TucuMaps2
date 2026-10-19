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

describe('Límite de intentos de login por email (RF-01)', () => {
  // Cada intento llega desde otra IP: el límite por IP no lo frenaría.
  let ip = 0;
  const intentar = (email, password = 'mal12345') =>
    request(app)
      .post('/api/auth/login')
      .set(CSRF)
      .set('X-Forwarded-For', `203.0.113.${++ip}`)
      .send({ email, password });

  beforeAll(() => app.set('trust proxy', 1));
  afterAll(() => app.set('trust proxy', 0));

  test('frena el sexto intento fallido contra la misma cuenta, sin importar mayúsculas ni espacios', async () => {
    await registrarYEntrar({ email: 'victima@mail.com' });
    for (let i = 0; i < 5; i++) expect((await intentar('victima@mail.com')).status).toBe(401);
    const bloqueado = await intentar('  Victima@Mail.com ', 'clave1234');
    expect(bloqueado.status).toBe(429);
    expect(bloqueado.body.error.codigo).toBe('DEMASIADOS_INTENTOS');
    expect(bloqueado.headers['retry-after']).toBeDefined();
  });

  test('cada cuenta tiene su propio contador y los datos inválidos no cuentan', async () => {
    for (let i = 0; i < 5; i++) await intentar('una@mail.com');
    expect((await intentar('otra@mail.com')).status).toBe(401);
    for (let i = 0; i < 6; i++) expect((await intentar('tercera@mail.com', '')).status).toBe(400);
    expect((await intentar('tercera@mail.com')).status).toBe(401);
  });
});

describe('Límite de intentos al cambiar la contraseña', () => {
  test('después de 5 contraseñas actuales incorrectas responde 429', async () => {
    const { agente } = await registrarYEntrar();
    const intento = () =>
      agente.patch('/api/cuenta/password').set(CSRF).send({ password_actual: 'mal12345', password_nueva: 'nueva5678' });
    for (let i = 0; i < 5; i++) expect((await intento()).status).toBe(400);
    const res = await intento();
    expect(res.status).toBe(429);
    expect(res.headers['retry-after']).toBeDefined();
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
