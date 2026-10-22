// RF-08, RF-11, RF-13: acciones de moderación de reportes del panel (#46).
const { app, pool, request, CSRF, limpiarBase, registrarYEntrar } = require('./helpers');
const { haceHoras, entrarComoAdmin, crearCiudadano, crearReporte, filaReporte } = require('./admin-comun');

const ESTADOS = ['pendiente', 'aprobado', 'rechazado', 'resuelto', 'cancelado', 'retirado'];
const accion = (agente, id, nombre, cuerpo) =>
  agente.post(`/api/admin/reportes/${id}/${nombre}`).set(CSRF).send(cuerpo);
const MOTIVO = { motivo: 'No se pudo verificar la dirección' };

beforeEach(limpiarBase);
afterAll(() => pool.end());

describe('Permisos de /api/admin/reportes', () => {
  const rutas = [
    ['get', '/api/admin/reportes'],
    ['get', '/api/admin/reportes/1'],
    ['post', '/api/admin/reportes/1/aprobar'],
    ['post', '/api/admin/reportes/1/rechazar'],
    ['post', '/api/admin/reportes/1/resolver'],
    ['post', '/api/admin/reportes/1/retirar'],
  ];

  test.each(rutas)('%s %s sin sesión responde 401', async (metodo, ruta) => {
    const res = await request(app)[metodo](ruta).set(CSRF).send(MOTIVO);
    expect(res.status).toBe(401);
    expect(res.body.error.codigo).toBe('NO_AUTENTICADO');
  });

  test('con un ciudadano todas responden 403 SIN_PERMISO y no cambian nada', async () => {
    const id = await crearReporte();
    const { agente } = await registrarYEntrar({ email: 'beto@mail.com' });
    for (const [metodo, ruta] of rutas) {
      const res = await agente[metodo](ruta.replace('/1', `/${id}`)).set(CSRF).send(MOTIVO);
      expect(res.status).toBe(403);
      expect(res.body.error.codigo).toBe('SIN_PERMISO');
    }
    expect((await filaReporte(id)).estado).toBe('pendiente');
  });

  test('las acciones sin X-Requested-With responden 403 aunque sea admin', async () => {
    const id = await crearReporte();
    const { agente } = await entrarComoAdmin();
    for (const nombre of ['aprobar', 'rechazar', 'resolver', 'retirar']) {
      const res = await agente.post(`/api/admin/reportes/${id}/${nombre}`).send(MOTIVO);
      expect(res.status).toBe(403);
    }
    expect((await filaReporte(id)).estado).toBe('pendiente');
  });
});

describe('POST /api/admin/reportes/:id/aprobar (RF-08, RF-11)', () => {
  test('lo aprueba, registra quién y cuándo, y la alerta aparece en el mapa', async () => {
    const autorId = await crearCiudadano();
    const id = await crearReporte({ usuarioId: autorId });
    const { agente, usuario: admin } = await entrarComoAdmin();

    const res = await accion(agente, id, 'aprobar');
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      id,
      estado: 'aprobado',
      activa: true,
      autor: { id: autorId, nombre: 'Ana Pérez' },
      revisado_por: { id: admin.id, nombre: 'Admin Uno' },
      motivo_rechazo: null,
    });
    expect(res.body.aprobado_en).toBe(res.body.revisado_en);

    const fila = await filaReporte(id);
    expect(fila).toMatchObject({ estado: 'aprobado', revisado_por: String(admin.id) });
    expect(fila.aprobado_en).toBeInstanceOf(Date);

    const mapa = await request(app).get('/api/reportes');
    expect(mapa.body).toEqual([expect.objectContaining({ id, confirmaciones: 0 })]);
  });

  test('dos aprobaciones a la vez: una pasa y la otra responde 409', async () => {
    const id = await crearReporte();
    const { agente } = await entrarComoAdmin();
    const estados = (await Promise.all([accion(agente, id, 'aprobar'), accion(agente, id, 'aprobar')])).map(
      (r) => r.status,
    );
    expect(estados.sort()).toEqual([200, 409]);
  });

  test('un reporte cuyo autor borró su cuenta se puede moderar (autor null)', async () => {
    const id = await crearReporte({ usuarioId: null });
    const { agente } = await entrarComoAdmin();
    const res = await accion(agente, id, 'aprobar');
    expect(res.status).toBe(200);
    expect(res.body.autor).toBeNull();
  });
});

describe('POST /api/admin/reportes/:id/rechazar (RF-08)', () => {
  test('lo rechaza con el motivo, que el autor ve en sus envíos, y no sale en el mapa', async () => {
    const autorId = await crearCiudadano();
    const id = await crearReporte({ usuarioId: autorId });
    const { agente, usuario: admin } = await entrarComoAdmin();

    const res = await accion(agente, id, 'rechazar', { motivo: '  No se pudo verificar la dirección  ' });
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      estado: 'rechazado',
      activa: false,
      motivo_rechazo: 'No se pudo verificar la dirección',
      revisado_por: { id: admin.id },
      aprobado_en: null,
    });
    expect(res.body.revisado_en).not.toBeNull();
    expect((await request(app).get('/api/reportes')).body).toEqual([]);
  });

  test.each([
    ['sin motivo', {}],
    ['con motivo corto', { motivo: 'Mal' }],
    ['con motivo de más de 300', { motivo: 'x'.repeat(301) }],
    ['con motivo de solo espacios', { motivo: '         ' }],
  ])('%s responde 400 y no cambia el estado', async (_, cuerpo) => {
    const id = await crearReporte();
    const { agente } = await entrarComoAdmin();
    const res = await accion(agente, id, 'rechazar', cuerpo);
    expect(res.status).toBe(400);
    expect(res.body.error.codigo).toBe('DATOS_INVALIDOS');
    expect(res.body.error.detalles[0].campo).toBe('motivo');
    expect((await filaReporte(id)).estado).toBe('pendiente');
  });
});

describe('POST /api/admin/reportes/:id/resolver y /retirar (RF-08, RF-13)', () => {
  test('resolver: la alerta deja de verse en el mapa y registra resuelto_en', async () => {
    const id = await crearReporte({ estado: 'aprobado' });
    const { agente } = await entrarComoAdmin();
    const res = await accion(agente, id, 'resolver');
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ estado: 'resuelto', activa: false, retirado_por: null });
    expect(res.body.resuelto_en).not.toBeNull();
    expect((await request(app).get('/api/reportes')).body).toEqual([]);
  });

  test('retirar: la alerta deja de verse y registra quién la retiró y cuándo', async () => {
    const id = await crearReporte({ estado: 'aprobado' });
    const { agente, usuario: admin } = await entrarComoAdmin();
    const res = await accion(agente, id, 'retirar');
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ estado: 'retirado', activa: false, retirado_por: { id: admin.id } });
    expect(res.body.retirado_en).not.toBeNull();
    expect((await request(app).get('/api/reportes')).body).toEqual([]);
  });

  test('una alerta aprobada que ya venció (RF-11) también se puede resolver', async () => {
    const id = await crearReporte({ estado: 'aprobado', aprobadoEn: haceHoras(30) });
    const { agente } = await entrarComoAdmin();
    const res = await accion(agente, id, 'resolver');
    expect(res.status).toBe(200);
    expect(res.body.estado).toBe('resuelto');
  });
});

describe('Transiciones inválidas (RF-08)', () => {
  // De qué estado puede partir cada acción; desde cualquier otro responde 409.
  const permitidas = { aprobar: 'pendiente', rechazar: 'pendiente', resolver: 'aprobado', retirar: 'aprobado' };

  test.each(Object.entries(permitidas))('%s solo vale desde %s', async (nombre, desde) => {
    const { agente } = await entrarComoAdmin();
    for (const estado of ESTADOS.filter((e) => e !== desde)) {
      const id = await crearReporte({ estado });
      const antes = await filaReporte(id);
      const res = await accion(agente, id, nombre, MOTIVO);
      expect(res.status).toBe(409);
      expect(res.body.error.codigo).toBe('TRANSICION_INVALIDA');
      expect(res.body.error.mensaje).toContain(estado);
      expect(await filaReporte(id)).toEqual(antes);
    }
  });

  test('un reporte inexistente responde 404 y un id inválido 400', async () => {
    const { agente } = await entrarComoAdmin();
    for (const nombre of Object.keys(permitidas)) {
      const res = await accion(agente, 999, nombre, MOTIVO);
      expect(res.status).toBe(404);
      expect(res.body.error.codigo).toBe('NO_ENCONTRADO');
    }
    expect((await accion(agente, 'abc', 'aprobar')).status).toBe(400);
  });
});
