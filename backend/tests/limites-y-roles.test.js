const express = require('express');
const cookieParser = require('cookie-parser');
const { requerirSesion, requerirVerificado, requerirRol } = require('../src/middlewares/auth');
const { manejarErrores } = require('../src/middlewares/errores');
const { reiniciarLimitesPassword } = require('../src/middlewares/limites');
const cuentaRoutes = require('../src/routes/cuenta');
const { setearSesion } = require('../src/sesion');
const { app, pool, request, CSRF, datosRegistro, limpiarBase, registrarYEntrar } = require('./helpers');

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

// El límite por cuenta no depende de la IP: se prueba con una app mínima que monta las rutas
// reales de /cuenta detrás de un proxy, como si cada intento llegara desde una IP distinta.
describe('Límite por cuenta de las rutas que piden la contraseña', () => {
  const mini = express();
  mini.set('trust proxy', 1);
  mini.use(express.json());
  mini.use(cookieParser());
  mini.use('/cuenta', cuentaRoutes);
  mini.use(manejarErrores);

  beforeEach(reiniciarLimitesPassword);

  const entrar = async (email) => {
    const registro = await request(app).post('/api/auth/registro').set(CSRF).send(datosRegistro({ email }));
    return registro.headers['set-cookie'][0].split(';')[0];
  };
  const cambiar = (ip, cookie, cuerpo) =>
    request(mini).patch('/cuenta/password').set('X-Forwarded-For', ip).set('Cookie', cookie).send(cuerpo);
  const mal = { password_actual: 'mal12345', password_nueva: 'nueva5678' };

  test('frena la sexta contraseña incorrecta de la misma cuenta aunque cambie de IP', async () => {
    const cookie = await entrar('cuenta1@mail.com');
    for (let i = 0; i < 5; i++) expect((await cambiar(`10.1.0.${i + 1}`, cookie, mal)).status).toBe(400);
    const res = await cambiar('10.1.0.99', cookie, mal);
    expect(res.status).toBe(429);
    expect(res.body.error.codigo).toBe('DEMASIADOS_INTENTOS');
    // También frena las otras rutas que piden la contraseña.
    const baja = await request(mini).delete('/cuenta').set('X-Forwarded-For', '10.1.0.98').set('Cookie', cookie).send({ password: 'clave1234' });
    expect(baja.status).toBe(429);

    // Otra cuenta no se ve afectada.
    const otra = await entrar('cuenta2@mail.com');
    expect((await cambiar('10.1.0.100', otra, mal)).status).toBe(400);
  });

  test('solo cuentan las contraseñas incorrectas, no los otros errores', async () => {
    const cookie = await entrar('cuenta1@mail.com');
    // Contraseña nueva inválida: 400 de validación, no gasta el cupo de la cuenta.
    for (let i = 0; i < 7; i++) {
      const res = await cambiar(`10.2.0.${i + 1}`, cookie, { password_actual: 'clave1234', password_nueva: 'corta' });
      expect(res.status).toBe(400);
    }
    expect((await cambiar('10.2.0.50', cookie, { password_actual: 'clave1234', password_nueva: 'nueva5678' })).status).toBe(200);
  });

  test('una sesión revocada no gasta el cupo de la cuenta', async () => {
    const vieja = await entrar('cuenta1@mail.com');
    await pool.query('UPDATE usuarios SET token_version = token_version + 1');
    for (let i = 0; i < 7; i++) expect((await cambiar(`10.3.0.${i + 1}`, vieja, mal)).status).toBe(401);
    // Sesión nueva de la misma cuenta (sin pasar por el login, que tiene su propio límite por IP).
    const { rows } = await pool.query('SELECT id, rol, token_version FROM usuarios');
    let nueva;
    setearSesion({ cookie: (nombre, token) => { nueva = `${nombre}=${token}`; } }, rows[0]);
    expect((await cambiar('10.3.0.50', nueva, mal)).status).toBe(400);
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
