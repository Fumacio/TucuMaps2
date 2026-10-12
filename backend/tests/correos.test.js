// RF-03: verificación de email y recuperación de contraseña.
const correo = require('../src/services/correo');
const { app, pool, request, CSRF, limpiarBase, registrarYEntrar } = require('./helpers');

let enviados;
beforeEach(async () => {
  await limpiarBase();
  enviados = { verificacion: [], recuperacion: [] };
  jest.spyOn(correo, 'verificacion').mockImplementation((d) => enviados.verificacion.push(d));
  jest.spyOn(correo, 'recuperacion').mockImplementation((d) => enviados.recuperacion.push(d));
});
afterEach(() => jest.restoreAllMocks());
afterAll(() => pool.end());

describe('Verificación de email', () => {
  test('el registro envía un enlace y el token verifica el email una sola vez', async () => {
    const { agente } = await registrarYEntrar();
    expect(enviados.verificacion).toHaveLength(1);
    const { token } = enviados.verificacion[0];

    const { rows } = await pool.query('SELECT token_hash FROM tokens_usuario');
    expect(rows[0].token_hash).not.toBe(token); // en la base solo queda el hash

    const res = await request(app).post('/api/auth/verificar-email').set(CSRF).send({ token });
    expect(res.status).toBe(200);
    expect((await agente.get('/api/auth/me')).body.usuario.email_verificado).toBe(true);

    const otraVez = await request(app).post('/api/auth/verificar-email').set(CSRF).send({ token });
    expect(otraVez.status).toBe(400);
    expect(otraVez.body.error.codigo).toBe('TOKEN_INVALIDO');
  });

  test('un token vencido no sirve', async () => {
    await registrarYEntrar();
    await pool.query("UPDATE tokens_usuario SET expira_en = now() - interval '1 minute'");
    const res = await request(app)
      .post('/api/auth/verificar-email')
      .set(CSRF)
      .send({ token: enviados.verificacion[0].token });
    expect(res.status).toBe(400);
    expect(res.body.error.codigo).toBe('TOKEN_INVALIDO');
  });

  test('un token de recuperación no sirve para verificar el email', async () => {
    await registrarYEntrar();
    await request(app).post('/api/auth/recuperar').set(CSRF).send({ email: 'ana@mail.com' });
    const res = await request(app)
      .post('/api/auth/verificar-email')
      .set(CSRF)
      .send({ token: enviados.recuperacion[0].token });
    expect(res.status).toBe(400);
  });

  test('reenviar-verificacion permite hasta 3 enlaces por hora', async () => {
    const { agente } = await registrarYEntrar(); // 1 enlace
    expect((await agente.post('/api/auth/reenviar-verificacion').set(CSRF)).status).toBe(200); // 2
    expect((await agente.post('/api/auth/reenviar-verificacion').set(CSRF)).status).toBe(200); // 3
    const cuarto = await agente.post('/api/auth/reenviar-verificacion').set(CSRF);
    expect(cuarto.status).toBe(429);
    expect(cuarto.body.error.codigo).toBe('DEMASIADOS_INTENTOS');
    expect(cuarto.headers['retry-after']).toBe('3600');
    expect(enviados.verificacion).toHaveLength(3);
  });

  test('pedidos simultáneos de reenvío no superan el límite de 3', async () => {
    const { agente } = await registrarYEntrar();
    await Promise.all(
      Array.from({ length: 6 }, () => agente.post('/api/auth/reenviar-verificacion').set(CSRF)),
    );
    const { rows } = await pool.query("SELECT count(*)::int AS n FROM tokens_usuario WHERE tipo = 'verificar_email'");
    expect(rows[0].n).toBe(3);
  });

  test('reenviar-verificacion exige sesión', async () => {
    const res = await request(app).post('/api/auth/reenviar-verificacion').set(CSRF);
    expect(res.status).toBe(401);
  });
});

describe('Recuperación de contraseña', () => {
  test('responde igual exista o no el email', async () => {
    await registrarYEntrar();
    const existe = await request(app).post('/api/auth/recuperar').set(CSRF).send({ email: 'ana@mail.com' });
    const noExiste = await request(app).post('/api/auth/recuperar').set(CSRF).send({ email: 'nadie@mail.com' });
    expect(existe.status).toBe(200);
    expect(noExiste.status).toBe(200);
    expect(existe.body).toEqual(noExiste.body);
    expect(enviados.recuperacion).toHaveLength(1);
  });

  test('restablecer cambia la contraseña, cierra las sesiones y el enlace no se reutiliza', async () => {
    const { agente } = await registrarYEntrar();
    await request(app).post('/api/auth/recuperar').set(CSRF).send({ email: 'ana@mail.com' });
    const { token } = enviados.recuperacion[0];

    const res = await request(app).post('/api/auth/restablecer').set(CSRF).send({ token, password: 'nueva5678' });
    expect(res.status).toBe(200);
    expect((await agente.get('/api/auth/me')).status).toBe(401);

    const login = await request(app).post('/api/auth/login').set(CSRF).send({ email: 'ana@mail.com', password: 'nueva5678' });
    expect(login.status).toBe(200);

    const reuso = await request(app).post('/api/auth/restablecer').set(CSRF).send({ token, password: 'otra56789' });
    expect(reuso.status).toBe(400);
  });

  test('al restablecer se invalidan los otros enlaces pendientes', async () => {
    await registrarYEntrar();
    await request(app).post('/api/auth/recuperar').set(CSRF).send({ email: 'ana@mail.com' });
    await request(app).post('/api/auth/recuperar').set(CSRF).send({ email: 'ana@mail.com' });
    const [primero, segundo] = enviados.recuperacion.map((e) => e.token);

    await request(app).post('/api/auth/restablecer').set(CSRF).send({ token: segundo, password: 'nueva5678' });
    const res = await request(app).post('/api/auth/restablecer').set(CSRF).send({ token: primero, password: 'otra56789' });
    expect(res.status).toBe(400);
  });

  test('restablecer valida la política de contraseñas', async () => {
    await registrarYEntrar();
    await request(app).post('/api/auth/recuperar').set(CSRF).send({ email: 'ana@mail.com' });
    const res = await request(app)
      .post('/api/auth/restablecer')
      .set(CSRF)
      .send({ token: enviados.recuperacion[0].token, password: 'corta1' });
    expect(res.status).toBe(400);
    expect(res.body.error.codigo).toBe('DATOS_INVALIDOS');
  });
});
