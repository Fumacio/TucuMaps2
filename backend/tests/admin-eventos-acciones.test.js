// RF-08, RF-12, RF-13: moderación de propuestas de eventos en el panel (#47).
const { app, pool, request, CSRF, limpiarBase, registrarYEntrar } = require('./helpers');
const { HORA, entrarComoAdmin, crearCiudadano, crearEvento, filaEvento } = require('./admin-comun');
const eventosService = require('../src/services/eventos');

const ESTADOS = ['pendiente', 'aprobado', 'rechazado', 'cancelado', 'retirado'];
const accion = (agente, id, nombre, cuerpo) =>
  agente.post(`/api/admin/eventos/${id}/${nombre}`).set(CSRF).send(cuerpo);
const MOTIVO = { motivo: 'Falta la fecha confirmada' };

beforeEach(limpiarBase);
afterAll(() => pool.end());

describe('Permisos de /api/admin/eventos', () => {
  const rutas = [
    ['get', '/api/admin/eventos'],
    ['get', '/api/admin/eventos/1'],
    ['post', '/api/admin/eventos'],
    ['put', '/api/admin/eventos/1'],
    ['post', '/api/admin/eventos/1/aprobar'],
    ['post', '/api/admin/eventos/1/rechazar'],
    ['post', '/api/admin/eventos/1/retirar'],
  ];

  test.each(rutas)('%s %s sin sesión responde 401', async (metodo, ruta) => {
    const res = await request(app)[metodo](ruta).set(CSRF).send(MOTIVO);
    expect(res.status).toBe(401);
    expect(res.body.error.codigo).toBe('NO_AUTENTICADO');
  });

  test('con un ciudadano todas responden 403 SIN_PERMISO y no cambian nada', async () => {
    const id = await crearEvento();
    const { agente } = await registrarYEntrar({ email: 'beto@mail.com' });
    for (const [metodo, ruta] of rutas) {
      const res = await agente[metodo](ruta.replace('/1', `/${id}`)).set(CSRF).send(MOTIVO);
      expect(res.status).toBe(403);
      expect(res.body.error.codigo).toBe('SIN_PERMISO');
    }
    expect((await filaEvento(id)).estado).toBe('pendiente');
  });

  test('las acciones sin X-Requested-With responden 403 aunque sea admin', async () => {
    const id = await crearEvento();
    const { agente } = await entrarComoAdmin();
    for (const nombre of ['aprobar', 'rechazar', 'retirar']) {
      expect((await agente.post(`/api/admin/eventos/${id}/${nombre}`).send(MOTIVO)).status).toBe(403);
    }
    expect((await filaEvento(id)).estado).toBe('pendiente');
  });
});

describe('POST /api/admin/eventos/:id/aprobar y /rechazar (RF-08)', () => {
  test('aprobar registra quién y cuándo, y el evento aparece en la agenda', async () => {
    const autorId = await crearCiudadano();
    const id = await crearEvento({ usuarioId: autorId });
    const { agente, usuario: admin } = await entrarComoAdmin();

    const res = await accion(agente, id, 'aprobar');
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      id,
      estado: 'aprobado',
      vigente: true,
      archivado: false,
      autor: { id: autorId, nombre: 'Ana Pérez' },
      revisado_por: { id: admin.id, nombre: 'Admin Uno' },
    });
    expect(res.body.revisado_en).not.toBeNull();
    expect((await request(app).get('/api/eventos')).body).toEqual([expect.objectContaining({ id })]);
  });

  test('rechazar guarda el motivo y el evento no sale en la agenda', async () => {
    const id = await crearEvento({ usuarioId: await crearCiudadano() });
    const { agente, usuario: admin } = await entrarComoAdmin();
    const res = await accion(agente, id, 'rechazar', MOTIVO);
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      estado: 'rechazado',
      vigente: false,
      motivo_rechazo: 'Falta la fecha confirmada',
      revisado_por: { id: admin.id },
    });
    expect((await request(app).get('/api/eventos')).body).toEqual([]);
  });

  test('rechazar sin motivo o con uno corto responde 400', async () => {
    const id = await crearEvento();
    const { agente } = await entrarComoAdmin();
    for (const cuerpo of [{}, { motivo: 'no' }]) {
      const res = await accion(agente, id, 'rechazar', cuerpo);
      expect(res.status).toBe(400);
      expect(res.body.error.detalles[0].campo).toBe('motivo');
    }
    expect((await filaEvento(id)).estado).toBe('pendiente');
  });
});

describe('POST /api/admin/eventos/:id/retirar (RF-13)', () => {
  test('el evento sale de la agenda y registra quién lo retiró y cuándo', async () => {
    const id = await crearEvento({ estado: 'aprobado' });
    const { agente, usuario: admin } = await entrarComoAdmin();
    expect((await request(app).get('/api/eventos')).body).toHaveLength(1);

    const res = await accion(agente, id, 'retirar');
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ estado: 'retirado', vigente: false, retirado_por: { id: admin.id } });
    expect(res.body.retirado_en).not.toBeNull();
    expect((await request(app).get('/api/eventos')).body).toEqual([]);
  });

  test('un evento aprobado ya archivado (RF-12) también se puede retirar', async () => {
    const id = await crearEvento({ estado: 'aprobado', inicio: new Date(Date.now() - 50 * HORA) });
    const { agente } = await entrarComoAdmin();
    const res = await accion(agente, id, 'retirar');
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ estado: 'retirado', archivado: true });
  });
});

describe('Transiciones inválidas (RF-08)', () => {
  // Los eventos no tienen `resuelto`: /resolver no existe.
  const permitidas = { aprobar: 'pendiente', rechazar: 'pendiente', retirar: 'aprobado' };

  test.each(Object.entries(permitidas))('%s solo vale desde %s', async (nombre, desde) => {
    const { agente } = await entrarComoAdmin();
    for (const estado of ESTADOS.filter((e) => e !== desde)) {
      const id = await crearEvento({ estado });
      const antes = await filaEvento(id);
      const res = await accion(agente, id, nombre, MOTIVO);
      expect(res.status).toBe(409);
      expect(res.body.error.codigo).toBe('TRANSICION_INVALIDA');
      expect(res.body.error.mensaje).toContain(estado);
      expect(await filaEvento(id)).toEqual(antes);
    }
  });

  test('un evento inexistente responde 404 y /resolver no existe', async () => {
    const { agente } = await entrarComoAdmin();
    for (const nombre of Object.keys(permitidas)) {
      expect((await accion(agente, 999, nombre, MOTIVO)).status).toBe(404);
    }
    const id = await crearEvento({ estado: 'aprobado' });
    expect((await accion(agente, id, 'resolver')).status).toBe(404);
    expect((await filaEvento(id)).estado).toBe('aprobado');
  });

  test('dos aprobaciones a la vez: una pasa y la otra responde 409', async () => {
    const id = await crearEvento();
    const { agente } = await entrarComoAdmin();
    const estados = (await Promise.all([accion(agente, id, 'aprobar'), accion(agente, id, 'aprobar')])).map(
      (r) => r.status,
    );
    expect(estados.sort()).toEqual([200, 409]);
  });

  test('si al admin le sacaron el rol mientras esperaba, no modera (RF-16)', async () => {
    const adminId = await crearCiudadano({ nombre: 'Ex admin', email: 'ex@mail.com' });
    const id = await crearEvento();
    await expect(eventosService.aprobar(id, { id: adminId })).rejects.toMatchObject({ codigo: 'SIN_PERMISO' });
    expect((await filaEvento(id)).estado).toBe('pendiente');
  });
});
