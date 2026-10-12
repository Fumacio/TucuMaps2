const { app, pool, request, CSRF, datosRegistro, limpiarBase, registrarYEntrar } = require('./helpers');

beforeEach(limpiarBase);
afterAll(() => pool.end());

describe('GET /api/salud', () => {
  test('responde ok', async () => {
    const res = await request(app).get('/api/salud');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ ok: true });
  });
});

describe('POST /api/auth/registro (RF-01, RF-04)', () => {
  test('crea un ciudadano, setea la cookie y guarda el email en minúsculas', async () => {
    const res = await request(app)
      .post('/api/auth/registro')
      .set(CSRF)
      .send(datosRegistro({ email: '  Ana@Mail.COM ', rol: 'admin' }));

    expect(res.status).toBe(201);
    expect(res.body.usuario).toEqual({
      id: 1,
      nombre: 'Ana Pérez',
      email: 'ana@mail.com',
      rol: 'ciudadano', // el campo "rol" enviado se descarta
      email_verificado: false,
    });
    const cookie = res.headers['set-cookie'].join(';');
    expect(cookie).toMatch(/tm_sesion=/);
    expect(cookie).toMatch(/HttpOnly/i);
    expect(cookie).toMatch(/SameSite=Lax/i);

    const { rows } = await pool.query('SELECT password_hash, terminos_version FROM usuarios');
    expect(rows[0].password_hash).toMatch(/^\$2b\$/);
    expect(rows[0].terminos_version).toBe('1.0');
  });

  test('rechaza contraseñas débiles y términos no aceptados con detalles por campo', async () => {
    const res = await request(app)
      .post('/api/auth/registro')
      .set(CSRF)
      .send(datosRegistro({ password: 'solotexto', acepta_terminos: false, email: 'no-es-email' }));

    expect(res.status).toBe(400);
    expect(res.body.error.codigo).toBe('DATOS_INVALIDOS');
    const campos = res.body.error.detalles.map((d) => d.campo);
    expect(campos).toEqual(expect.arrayContaining(['password', 'acepta_terminos', 'email']));
  });

  test('rechaza contraseñas de más de 72 bytes (bcrypt las truncaría)', async () => {
    const res = await request(app)
      .post('/api/auth/registro')
      .set(CSRF)
      .send(datosRegistro({ password: `a1${'x'.repeat(80)}` }));
    expect(res.status).toBe(400);
  });

  test('devuelve 409 EMAIL_EN_USO si el email ya existe', async () => {
    await registrarYEntrar();
    const res = await request(app)
      .post('/api/auth/registro')
      .set(CSRF)
      .send(datosRegistro({ email: 'ANA@mail.com' }));
    expect(res.status).toBe(409);
    expect(res.body.error.codigo).toBe('EMAIL_EN_USO');
  });

  test('sin el encabezado anti-CSRF responde 403', async () => {
    const res = await request(app).post('/api/auth/registro').send(datosRegistro());
    expect(res.status).toBe(403);
    expect(res.body.error.codigo).toBe('SIN_PERMISO');
  });

  test('JSON mal formado responde 400 con el formato de error', async () => {
    const res = await request(app)
      .post('/api/auth/registro')
      .set(CSRF)
      .set('Content-Type', 'application/json')
      .send('{malo');
    expect(res.status).toBe(400);
    expect(res.body.error.codigo).toBe('DATOS_INVALIDOS');
  });
});

describe('POST /api/auth/login (RF-01)', () => {
  test('con credenciales correctas inicia sesión', async () => {
    await registrarYEntrar();
    const agente = request.agent(app);
    const res = await agente.post('/api/auth/login').set(CSRF).send({ email: 'ANA@mail.com', password: 'clave1234' });
    expect(res.status).toBe(200);
    expect(res.body.usuario.email).toBe('ana@mail.com');

    const me = await agente.get('/api/auth/me');
    expect(me.status).toBe(200);
    expect(me.body.usuario.nombre).toBe('Ana Pérez');
  });

  test('mismo error para contraseña incorrecta y email inexistente', async () => {
    await registrarYEntrar();
    const mala = await request(app).post('/api/auth/login').set(CSRF).send({ email: 'ana@mail.com', password: 'otra1234' });
    const inexistente = await request(app).post('/api/auth/login').set(CSRF).send({ email: 'x@mail.com', password: 'clave1234' });
    expect(mala.status).toBe(401);
    expect(inexistente.status).toBe(401);
    expect(mala.body).toEqual(inexistente.body);
    expect(mala.body.error.codigo).toBe('CREDENCIALES_INVALIDAS');
  });

  test('un usuario bloqueado no puede entrar', async () => {
    await registrarYEntrar();
    await pool.query('UPDATE usuarios SET bloqueado = TRUE');
    const res = await request(app).post('/api/auth/login').set(CSRF).send({ email: 'ana@mail.com', password: 'clave1234' });
    expect(res.status).toBe(403);
    expect(res.body.error.codigo).toBe('USUARIO_BLOQUEADO');
  });
});

describe('Sesión (middleware de seguridad)', () => {
  test('GET /api/auth/me sin sesión responde 401', async () => {
    const res = await request(app).get('/api/auth/me');
    expect(res.status).toBe(401);
    expect(res.body.error.codigo).toBe('NO_AUTENTICADO');
  });

  test('un token falsificado no sirve', async () => {
    const res = await request(app).get('/api/auth/me').set('Cookie', 'tm_sesion=abc.def.ghi');
    expect(res.status).toBe(401);
  });

  test('cada solicitud autenticada renueva la cookie', async () => {
    const { agente } = await registrarYEntrar();
    const res = await agente.get('/api/auth/me');
    expect(res.headers['set-cookie'].join(';')).toMatch(/tm_sesion=/);
  });

  test('bloquear a un usuario corta su sesión al instante', async () => {
    const { agente } = await registrarYEntrar();
    await pool.query('UPDATE usuarios SET bloqueado = TRUE');
    const res = await agente.get('/api/auth/me');
    expect(res.status).toBe(403);
    expect(res.body.error.codigo).toBe('USUARIO_BLOQUEADO');
  });

  test('logout borra la cookie', async () => {
    const { agente } = await registrarYEntrar();
    const res = await agente.post('/api/auth/logout').set(CSRF);
    expect(res.status).toBe(204);
    expect((await agente.get('/api/auth/me')).status).toBe(401);
  });

  test('logout-todos invalida las sesiones de otros dispositivos', async () => {
    const { agente: celular } = await registrarYEntrar();
    const compu = request.agent(app);
    await compu.post('/api/auth/login').set(CSRF).send({ email: 'ana@mail.com', password: 'clave1234' });

    const res = await compu.post('/api/auth/logout-todos').set(CSRF);
    expect(res.status).toBe(204);
    expect((await celular.get('/api/auth/me')).status).toBe(401);
    expect((await compu.get('/api/auth/me')).status).toBe(401);
  });
});

describe('PATCH /api/cuenta/password (RF-01)', () => {
  test('cambia la contraseña, mantiene esta sesión y cierra las demás', async () => {
    const { agente } = await registrarYEntrar();
    const otro = request.agent(app);
    await otro.post('/api/auth/login').set(CSRF).send({ email: 'ana@mail.com', password: 'clave1234' });

    const res = await agente
      .patch('/api/cuenta/password')
      .set(CSRF)
      .send({ password_actual: 'clave1234', password_nueva: 'nueva5678' });
    expect(res.status).toBe(200);
    expect((await agente.get('/api/auth/me')).status).toBe(200);
    expect((await otro.get('/api/auth/me')).status).toBe(401);

    const login = await request(app).post('/api/auth/login').set(CSRF).send({ email: 'ana@mail.com', password: 'nueva5678' });
    expect(login.status).toBe(200);
  });

  test('con la contraseña actual incorrecta responde 401', async () => {
    const { agente } = await registrarYEntrar();
    const res = await agente
      .patch('/api/cuenta/password')
      .set(CSRF)
      .send({ password_actual: 'mal12345', password_nueva: 'nueva5678' });
    expect(res.status).toBe(401);
  });

  test('sin sesión responde 401', async () => {
    const res = await request(app)
      .patch('/api/cuenta/password')
      .set(CSRF)
      .send({ password_actual: 'clave1234', password_nueva: 'nueva5678' });
    expect(res.status).toBe(401);
  });
});

describe('Rutas inexistentes', () => {
  test('responden 404 con el formato de error', async () => {
    const res = await request(app).get('/api/no-existe');
    expect(res.status).toBe(404);
    expect(res.body.error.codigo).toBe('NO_ENCONTRADO');
  });
});
