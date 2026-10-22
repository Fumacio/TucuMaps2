// RF-16, RF-15: gestión y bloqueo de usuarios, y resumen del panel (#48).
const { app, pool, request, CSRF, limpiarBase, registrarYEntrar } = require('./helpers');
const { datosReporte, datosEvento } = require('./envios-comun');
const { haceHoras, entrarComoAdmin, crearCiudadano, crearReporte, crearEvento } = require('./admin-comun');

const bloquear = (agente, id) => agente.post(`/api/admin/usuarios/${id}/bloquear`).set(CSRF);
const desbloquear = (agente, id) => agente.post(`/api/admin/usuarios/${id}/desbloquear`).set(CSRF);
const estados = async (tabla, columna, id) =>
  (await pool.query(`SELECT estado, motivo_rechazo, revisado_por FROM ${tabla} WHERE ${columna} = $1 ORDER BY id`, [id]))
    .rows;

async function entrarVerificado(extra) {
  const sesion = await registrarYEntrar(extra);
  await pool.query('UPDATE usuarios SET email_verificado = true WHERE id = $1', [sesion.usuario.id]);
  return sesion;
}

beforeEach(limpiarBase);
afterAll(() => pool.end());

describe('Permisos', () => {
  const rutas = [
    ['get', '/api/admin/usuarios'],
    ['post', '/api/admin/usuarios/1/bloquear'],
    ['post', '/api/admin/usuarios/1/desbloquear'],
    ['get', '/api/admin/resumen'],
  ];

  test('sin sesión responden 401 y con un ciudadano 403', async () => {
    const { agente } = await registrarYEntrar({ email: 'beto@mail.com' });
    for (const [metodo, ruta] of rutas) {
      expect((await request(app)[metodo](ruta).set(CSRF)).status).toBe(401);
      const res = await agente[metodo](ruta).set(CSRF);
      expect(res.status).toBe(403);
      expect(res.body.error.codigo).toBe('SIN_PERMISO');
    }
  });

  test('bloquear sin X-Requested-With responde 403 aunque sea admin', async () => {
    const id = await crearCiudadano();
    const { agente } = await entrarComoAdmin();
    expect((await agente.post(`/api/admin/usuarios/${id}/bloquear`)).status).toBe(403);
    expect((await pool.query('SELECT bloqueado FROM usuarios WHERE id = $1', [id])).rows[0].bloqueado).toBe(false);
  });
});

describe('GET /api/admin/usuarios (RF-16)', () => {
  test('lista con envíos y rechazos, sin password_hash ni token_version', async () => {
    const anaId = await crearCiudadano();
    await crearReporte({ usuarioId: anaId, estado: 'rechazado' });
    await crearReporte({ usuarioId: anaId });
    await crearEvento({ usuarioId: anaId, estado: 'rechazado' });
    const { agente, usuario: admin } = await entrarComoAdmin();

    const res = await agente.get('/api/admin/usuarios');
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ pagina: 1, por_pagina: 20, total: 2 });
    expect(res.body.datos.map((u) => u.id)).toEqual([admin.id, anaId]);
    expect(res.body.datos[1]).toEqual({
      id: anaId,
      nombre: 'Ana Pérez',
      email: 'ana@mail.com',
      rol: 'ciudadano',
      email_verificado: true,
      bloqueado: false,
      creado_en: expect.any(String),
      envios: 3,
      rechazos: 2,
    });
    const texto = JSON.stringify(res.body);
    expect(texto).not.toContain('password');
    expect(texto).not.toContain('token_version');
  });

  test('filtra por bloqueado y busca en nombre o email; los comodines se buscan como texto', async () => {
    const ana = await crearCiudadano();
    const beto = await crearCiudadano({ nombre: 'Beto 100%', email: 'beto_x@mail.com' });
    await pool.query('UPDATE usuarios SET bloqueado = true WHERE id = $1', [beto]);
    const { agente } = await entrarComoAdmin();
    const ids = async (query) => (await agente.get(`/api/admin/usuarios${query}`)).body.datos.map((u) => u.id);

    expect(await ids('?bloqueado=true')).toEqual([beto]);
    expect(await ids('?bloqueado=false&q=PÉREZ')).toEqual([ana]);
    expect(await ids('?q=BETO_X@')).toEqual([beto]);
    expect(await ids(`?q=${encodeURIComponent('100%')}`)).toEqual([beto]);
    expect(await ids('?q=_')).toEqual([beto]);
    expect(await ids('?q=%25')).toEqual([beto]);
    expect(await ids('?q=&bloqueado=')).toHaveLength(3);
  });

  test('datos inválidos en los filtros responden 400', async () => {
    const { agente } = await entrarComoAdmin();
    expect((await agente.get('/api/admin/usuarios?bloqueado=si')).status).toBe(400);
    expect((await agente.get(`/api/admin/usuarios?q=${'x'.repeat(101)}`)).status).toBe(400);
  });
});

describe('POST /api/admin/usuarios/:id/bloquear (RF-16)', () => {
  test('bloquea, rechaza sus pendientes con el motivo y no toca lo ya revisado', async () => {
    const anaId = await crearCiudadano();
    await crearReporte({ usuarioId: anaId });
    await crearReporte({ usuarioId: anaId, estado: 'aprobado' });
    await crearEvento({ usuarioId: anaId });
    const otro = await crearCiudadano({ email: 'otro@mail.com' });
    await crearReporte({ usuarioId: otro });
    const { agente, usuario: admin } = await entrarComoAdmin();

    const res = await bloquear(agente, anaId);
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ id: anaId, bloqueado: true, envios: 3, rechazos: 2 });

    const rechazado = { estado: 'rechazado', motivo_rechazo: 'Usuario bloqueado', revisado_por: String(admin.id) };
    expect(await estados('reportes', 'usuario_id', anaId)).toEqual([
      rechazado,
      { estado: 'aprobado', motivo_rechazo: null, revisado_por: null },
    ]);
    expect(await estados('eventos', 'propuesto_por', anaId)).toEqual([rechazado]);
    expect((await estados('reportes', 'usuario_id', otro))[0].estado).toBe('pendiente');
  });

  test('el bloqueado pierde la sesión en su siguiente solicitud y no puede entrar ni enviar', async () => {
    const { agente: ana, usuario } = await entrarVerificado();
    const { agente } = await entrarComoAdmin();
    expect((await bloquear(agente, usuario.id)).status).toBe(200);

    const me = await ana.get('/api/auth/me');
    expect(me.status).toBe(403);
    expect(me.body.error.codigo).toBe('USUARIO_BLOQUEADO');
    expect((await ana.post('/api/reportes').set(CSRF).send(datosReporte())).status).toBe(401);

    const login = await request(app).post('/api/auth/login').set(CSRF).send({ email: 'ana@mail.com', password: 'clave1234' });
    expect(login.status).toBe(403);
    expect(login.body.error.codigo).toBe('USUARIO_BLOQUEADO');
  });

  test('al desbloquear recupera el acceso y lo rechazado no se reabre', async () => {
    const { usuario } = await entrarVerificado();
    const id = await crearReporte({ usuarioId: usuario.id });
    const { agente } = await entrarComoAdmin();
    await bloquear(agente, usuario.id);

    const res = await desbloquear(agente, usuario.id);
    expect(res.status).toBe(200);
    expect(res.body.bloqueado).toBe(false);
    expect((await pool.query('SELECT estado FROM reportes WHERE id = $1', [id])).rows[0].estado).toBe('rechazado');

    const ana = request.agent(app);
    expect((await ana.post('/api/auth/login').set(CSRF).send({ email: 'ana@mail.com', password: 'clave1234' })).status).toBe(200);
    expect((await ana.post('/api/eventos').set(CSRF).send(datosEvento())).status).toBe(201);
  });

  test('un envío que llega a la vez que el bloqueo no queda pendiente', async () => {
    const { agente: ana, usuario } = await entrarVerificado();
    const { agente } = await entrarComoAdmin();
    await Promise.all([ana.post('/api/reportes').set(CSRF).send(datosReporte()), bloquear(agente, usuario.id)]);
    const { rows } = await pool.query("SELECT count(*)::int AS n FROM reportes WHERE estado = 'pendiente'");
    expect(rows[0].n).toBe(0);
  });

  test('repetir bloquear o desbloquear no es un error', async () => {
    const id = await crearCiudadano();
    const { agente } = await entrarComoAdmin();
    expect((await bloquear(agente, id)).status).toBe(200);
    expect((await bloquear(agente, id)).body.bloqueado).toBe(true);
    expect((await desbloquear(agente, id)).status).toBe(200);
    expect((await desbloquear(agente, id)).body.bloqueado).toBe(false);
  });

  test('un admin no puede bloquearse a sí mismo ni a otro admin: 409', async () => {
    const otroAdmin = await crearCiudadano({ email: 'dos@mail.com' });
    await pool.query("UPDATE usuarios SET rol = 'admin' WHERE id = $1", [otroAdmin]);
    const { agente, usuario: admin } = await entrarComoAdmin();

    const propio = await bloquear(agente, admin.id);
    expect(propio.status).toBe(409);
    expect(propio.body.error.mensaje).toBe('No podés bloquear tu propia cuenta.');
    const otro = await bloquear(agente, otroAdmin);
    expect(otro.status).toBe(409);
    expect(otro.body.error.mensaje).toMatch(/administrador/);
    const { rows } = await pool.query('SELECT count(*)::int AS n FROM usuarios WHERE bloqueado');
    expect(rows[0].n).toBe(0);
  });

  test('un usuario inexistente responde 404 y un id inválido 400', async () => {
    const { agente } = await entrarComoAdmin();
    expect((await bloquear(agente, 999)).status).toBe(404);
    expect((await desbloquear(agente, 999)).status).toBe(404);
    expect((await bloquear(agente, 'abc')).status).toBe(400);
  });
});

describe('GET /api/admin/resumen (RF-15)', () => {
  test('cuenta pendientes, alertas activas y usuarios bloqueados', async () => {
    const ana = await crearCiudadano();
    await crearReporte({ usuarioId: ana });
    await crearReporte({ estado: 'aprobado' });
    await crearReporte({ estado: 'aprobado', aprobadoEn: haceHoras(25) });
    await crearEvento();
    await crearEvento();
    await crearEvento({ estado: 'aprobado' });
    await pool.query('UPDATE usuarios SET bloqueado = true WHERE id = $1', [await crearCiudadano({ email: 'b@mail.com' })]);
    const { agente } = await entrarComoAdmin();

    const res = await agente.get('/api/admin/resumen');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      reportes_pendientes: 1,
      eventos_pendientes: 2,
      alertas_activas: 1,
      usuarios_bloqueados: 1,
    });
  });
});
