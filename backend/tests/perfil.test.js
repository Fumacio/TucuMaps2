// RF-25: perfil, cambio de nombre y de email (#74).
const correo = require('../src/services/correo');
const { limiteCambioPassword } = require('../src/middlewares/limites');
const { app, pool, request, CSRF, limpiarBase, registrarYEntrar } = require('./helpers');

let enviados;
beforeEach(async () => {
  await limpiarBase();
  // Los pedidos con error de cada prueba cuentan para el límite de 5 cada 15 minutos por IP:
  // se empieza de cero en cada una.
  for (const ip of ['::ffff:127.0.0.1', '127.0.0.1', '::1']) await limiteCambioPassword.resetKey(ip);
  enviados = { verificacion: [], recuperacion: [], cambio: [], aviso: [] };
  jest.spyOn(correo, 'verificacion').mockImplementation((d) => enviados.verificacion.push(d));
  jest.spyOn(correo, 'recuperacion').mockImplementation((d) => enviados.recuperacion.push(d));
  jest.spyOn(correo, 'cambioEmail').mockImplementation((d) => enviados.cambio.push(d));
  jest.spyOn(correo, 'avisoCambioEmail').mockImplementation((d) => enviados.aviso.push(d));
});
afterEach(() => jest.restoreAllMocks());
afterAll(() => pool.end());

const pedirCambio = (agente, datos) =>
  agente.post('/api/cuenta/email').set(CSRF).send({ email_nuevo: 'nuevo@mail.com', password: 'clave1234', ...datos });
const confirmar = (token) => request(app).post('/api/cuenta/confirmar-email').set(CSRF).send({ token });
const emailDe = async (id) => (await pool.query('SELECT email FROM usuarios WHERE id = $1', [id])).rows[0].email;

describe('PATCH /api/cuenta/nombre', () => {
  test('cambia el nombre al instante y /me lo devuelve', async () => {
    const { agente } = await registrarYEntrar();
    const res = await agente.patch('/api/cuenta/nombre').set(CSRF).send({ nombre: '  Ana María Pérez  ' });
    expect(res.status).toBe(200);
    expect(res.body.usuario).toMatchObject({ nombre: 'Ana María Pérez', email: 'ana@mail.com' });
    expect((await agente.get('/api/auth/me')).body.usuario.nombre).toBe('Ana María Pérez');
  });

  test('valida igual que el registro', async () => {
    const { agente } = await registrarYEntrar();
    for (const nombre of ['A', 'x'.repeat(81), undefined, 'Ana\u0000']) {
      const res = await agente.patch('/api/cuenta/nombre').set(CSRF).send({ nombre });
      expect(res.status).toBe(400);
      expect(res.body.error.detalles[0].campo).toBe('nombre');
    }
  });

  test('sin sesión responde 401 y sin el encabezado CSRF 403', async () => {
    expect((await request(app).patch('/api/cuenta/nombre').set(CSRF).send({ nombre: 'Beto' })).status).toBe(401);
    const { agente } = await registrarYEntrar();
    expect((await agente.patch('/api/cuenta/nombre').send({ nombre: 'Beto' })).status).toBe(403);
  });

  test('un usuario bloqueado no puede cambiarlo', async () => {
    const { agente, usuario } = await registrarYEntrar();
    await pool.query('UPDATE usuarios SET bloqueado = true WHERE id = $1', [usuario.id]);
    const res = await agente.patch('/api/cuenta/nombre').set(CSRF).send({ nombre: 'Beto' });
    expect(res.status).toBe(403);
    expect(res.body.error.codigo).toBe('USUARIO_BLOQUEADO');
  });
});

describe('POST /api/cuenta/email y /api/cuenta/confirmar-email', () => {
  test('caso feliz: enlace al email nuevo, aviso al actual y cambio recién al confirmar', async () => {
    const { agente, usuario } = await registrarYEntrar();
    const res = await pedirCambio(agente);
    expect(res.status).toBe(202);
    expect(res.body).toEqual({ ok: true });

    expect(enviados.cambio).toEqual([{ nombre: 'Ana Pérez', emailNuevo: 'nuevo@mail.com', token: expect.any(String) }]);
    expect(enviados.aviso).toEqual([{ nombre: 'Ana Pérez', email: 'ana@mail.com', emailNuevo: 'nuevo@mail.com' }]);
    // Todavía no cambió.
    expect(await emailDe(usuario.id)).toBe('ana@mail.com');

    expect((await confirmar(enviados.cambio[0].token)).status).toBe(200);
    const me = (await agente.get('/api/auth/me')).body.usuario;
    expect(me).toMatchObject({ email: 'nuevo@mail.com', email_verificado: true });

    // La sesión sigue abierta y se entra con el email nuevo.
    const login = await request(app).post('/api/auth/login').set(CSRF).send({ email: 'nuevo@mail.com', password: 'clave1234' });
    expect(login.status).toBe(200);
  });

  test('el email nuevo se normaliza a minúsculas', async () => {
    const { agente, usuario } = await registrarYEntrar();
    await pedirCambio(agente, { email_nuevo: '  Nuevo@Mail.COM ' });
    await confirmar(enviados.cambio[0].token);
    expect(await emailDe(usuario.id)).toBe('nuevo@mail.com');
  });

  test('con la contraseña incorrecta responde 400 y no manda nada', async () => {
    const { agente } = await registrarYEntrar();
    const res = await pedirCambio(agente, { password: 'otra1234' });
    expect(res.status).toBe(400);
    expect(res.body.error.detalles).toEqual([{ campo: 'password', mensaje: expect.any(String) }]);
    expect(enviados.cambio).toHaveLength(0);
  });

  test('el mismo email que ya tiene responde 400', async () => {
    const { agente } = await registrarYEntrar();
    const res = await pedirCambio(agente, { email_nuevo: 'ANA@mail.com' });
    expect(res.status).toBe(400);
    expect(res.body.error.detalles[0].campo).toBe('email_nuevo');
  });

  test('un email inválido responde 400', async () => {
    const { agente } = await registrarYEntrar();
    expect((await pedirCambio(agente, { email_nuevo: 'no-es-un-email' })).status).toBe(400);
  });

  test('un email que ya usa otra cuenta responde 409 EMAIL_EN_USO', async () => {
    await registrarYEntrar({ email: 'nuevo@mail.com' });
    const { agente } = await registrarYEntrar();
    const res = await pedirCambio(agente);
    expect(res.status).toBe(409);
    expect(res.body.error.codigo).toBe('EMAIL_EN_USO');
  });

  test('si otra cuenta toma el email antes de confirmar, 409 y el token sigue sirviendo', async () => {
    const { agente, usuario } = await registrarYEntrar();
    await pedirCambio(agente);
    const { usuario: otro } = await registrarYEntrar({ email: 'nuevo@mail.com' });

    const res = await confirmar(enviados.cambio[0].token);
    expect(res.status).toBe(409);
    expect(res.body.error.codigo).toBe('EMAIL_EN_USO');
    expect(await emailDe(usuario.id)).toBe('ana@mail.com');

    // Si la otra cuenta libera el email, el mismo enlace funciona.
    await pool.query('DELETE FROM usuarios WHERE id = $1', [otro.id]);
    expect((await confirmar(enviados.cambio[0].token)).status).toBe(200);
    expect(await emailDe(usuario.id)).toBe('nuevo@mail.com');
  });

  test('el enlace sirve una sola vez y vence a las 24 horas', async () => {
    const { agente } = await registrarYEntrar();
    await pedirCambio(agente);
    const { token } = enviados.cambio[0];
    const { rows } = await pool.query(
      "SELECT extract(epoch FROM expira_en - creado_en)::int AS segundos FROM tokens_usuario WHERE tipo = 'cambiar_email'",
    );
    expect(Math.round(rows[0].segundos / 3600)).toBe(24);

    expect((await confirmar(token)).status).toBe(200);
    const otraVez = await confirmar(token);
    expect(otraVez.status).toBe(400);
    expect(otraVez.body.error.codigo).toBe('TOKEN_INVALIDO');
  });

  test('un enlace vencido no sirve', async () => {
    const { agente } = await registrarYEntrar();
    await pedirCambio(agente);
    await pool.query("UPDATE tokens_usuario SET expira_en = now() - interval '1 minute' WHERE tipo = 'cambiar_email'");
    expect((await confirmar(enviados.cambio[0].token)).status).toBe(400);
  });

  test('un pedido nuevo anula el enlace anterior', async () => {
    const { agente, usuario } = await registrarYEntrar();
    await pedirCambio(agente, { email_nuevo: 'primero@mail.com' });
    await pedirCambio(agente, { email_nuevo: 'segundo@mail.com' });
    expect((await confirmar(enviados.cambio[0].token)).status).toBe(400);
    expect((await confirmar(enviados.cambio[1].token)).status).toBe(200);
    expect(await emailDe(usuario.id)).toBe('segundo@mail.com');
  });

  test('los tokens de verificación o recuperación no sirven para confirmar el cambio', async () => {
    await registrarYEntrar();
    await request(app).post('/api/auth/recuperar').set(CSRF).send({ email: 'ana@mail.com' });
    expect((await confirmar(enviados.verificacion[0].token)).status).toBe(400);
    expect((await confirmar(enviados.recuperacion[0].token)).status).toBe(400);
  });

  test('el token de cambio no sirve para verificar el email ni restablecer la contraseña', async () => {
    const { agente } = await registrarYEntrar();
    await pedirCambio(agente);
    const { token } = enviados.cambio[0];
    expect((await request(app).post('/api/auth/verificar-email').set(CSRF).send({ token })).status).toBe(400);
    const restablecer = await request(app)
      .post('/api/auth/restablecer')
      .set(CSRF)
      .send({ token, password: 'nueva1234' });
    expect(restablecer.status).toBe(400);
  });

  test('al confirmar se anulan los enlaces mandados al email anterior', async () => {
    const { agente } = await registrarYEntrar();
    await request(app).post('/api/auth/recuperar').set(CSRF).send({ email: 'ana@mail.com' });
    await pedirCambio(agente);
    await confirmar(enviados.cambio[0].token);

    const restablecer = await request(app)
      .post('/api/auth/restablecer')
      .set(CSRF)
      .send({ token: enviados.recuperacion[0].token, password: 'nueva1234' });
    expect(restablecer.status).toBe(400);
    const verificar = await request(app)
      .post('/api/auth/verificar-email')
      .set(CSRF)
      .send({ token: enviados.verificacion[0].token });
    expect(verificar.status).toBe(400);
  });

  test('máximo 3 pedidos por hora', async () => {
    const { agente } = await registrarYEntrar();
    for (let i = 1; i <= 3; i += 1) {
      expect((await pedirCambio(agente, { email_nuevo: `n${i}@mail.com` })).status).toBe(202);
    }
    const cuarto = await pedirCambio(agente, { email_nuevo: 'n4@mail.com' });
    expect(cuarto.status).toBe(429);
    expect(cuarto.body.error.codigo).toBe('DEMASIADOS_INTENTOS');
  });

  test('las contraseñas incorrectas cuentan para el límite de 5 cada 15 minutos', async () => {
    const { agente } = await registrarYEntrar();
    for (let i = 0; i < 5; i += 1) expect((await pedirCambio(agente, { password: 'mal12345' })).status).toBe(400);
    const res = await pedirCambio(agente);
    expect(res.status).toBe(429);
  });

  test('sin sesión responde 401 y sin el encabezado CSRF 403', async () => {
    expect((await pedirCambio(request(app))).status).toBe(401);
    const { agente } = await registrarYEntrar();
    const sinCsrf = await agente.post('/api/cuenta/email').send({ email_nuevo: 'nuevo@mail.com', password: 'clave1234' });
    expect(sinCsrf.status).toBe(403);
    expect((await request(app).post('/api/cuenta/confirmar-email').send({ token: 'a'.repeat(64) })).status).toBe(403);
  });

  test('un token mal formado responde 400', async () => {
    expect((await confirmar('abc')).status).toBe(400);
  });
});
