// RF-14, RF-11: confirmaciones comunitarias de alertas (POST /api/reportes/:id/confirmar, #45).
const { app, pool, request, CSRF, limpiarBase, registrarYEntrar } = require('./helpers');

const HORA = 60 * 60 * 1000;
const haceHoras = (horas) => new Date(Date.now() - horas * HORA);

async function entrarVerificado(extra = {}) {
  const sesion = await registrarYEntrar(extra);
  await pool.query('UPDATE usuarios SET email_verificado = true WHERE id = $1', [sesion.usuario.id]);
  return sesion;
}

// Alerta cargada directo en la base; por defecto aprobada hace una hora (activa) y sin autor.
async function crearReporte({ estado = 'aprobado', aprobadoEn = haceHoras(1), usuarioId = null } = {}) {
  const { rows } = await pool.query(
    `INSERT INTO reportes (usuario_id, tipo, descripcion, lat, lng, estado, aprobado_en)
     VALUES ($1, 'robo_asalto', 'Arrebatos frecuentes en la parada', -26.8235, -65.2301, $2, $3)
     RETURNING id`,
    [usuarioId, estado, estado === 'pendiente' ? null : aprobadoEn],
  );
  return Number(rows[0].id);
}

const confirmar = (agente, id) => agente.post(`/api/reportes/${id}/confirmar`).set(CSRF);
const contarConfirmaciones = async () =>
  (await pool.query('SELECT count(*)::int AS n FROM confirmaciones')).rows[0].n;

beforeEach(limpiarBase);
afterAll(() => pool.end());

describe('POST /api/reportes/:id/confirmar: caso feliz (RF-14)', () => {
  test('responde 201 con el total y GET /api/reportes lo refleja', async () => {
    const id = await crearReporte();
    const { agente: ana } = await entrarVerificado();
    const { agente: beto } = await entrarVerificado({ email: 'beto@mail.com' });

    const primera = await confirmar(ana, id);
    expect(primera.status).toBe(201);
    expect(primera.body).toEqual({ confirmaciones: 1 });

    const segunda = await confirmar(beto, id);
    expect(segunda.status).toBe(201);
    expect(segunda.body).toEqual({ confirmaciones: 2 });

    const mapa = await request(app).get('/api/reportes');
    expect(mapa.body).toEqual([expect.objectContaining({ id, confirmaciones: 2 })]);
  });

  test('no cambia el estado de moderación del reporte', async () => {
    const id = await crearReporte();
    const antes = (await pool.query('SELECT * FROM reportes WHERE id = $1', [id])).rows[0];
    const { agente } = await entrarVerificado();
    expect((await confirmar(agente, id)).status).toBe(201);
    const despues = (await pool.query('SELECT * FROM reportes WHERE id = $1', [id])).rows[0];
    expect(despues).toEqual(antes);
  });

  test('se puede confirmar una alerta cuyo autor borró su cuenta', async () => {
    const id = await crearReporte({ usuarioId: null });
    const { agente } = await entrarVerificado();
    expect((await confirmar(agente, id)).status).toBe(201);
  });
});

describe('POST /api/reportes/:id/confirmar: duplicados', () => {
  test('el segundo intento del mismo usuario responde 409 YA_CONFIRMADO', async () => {
    const id = await crearReporte();
    const { agente } = await entrarVerificado();
    await confirmar(agente, id);
    const res = await confirmar(agente, id);
    expect(res.status).toBe(409);
    expect(res.body.error.codigo).toBe('YA_CONFIRMADO');
    expect(await contarConfirmaciones()).toBe(1);
  });

  test('dos solicitudes a la vez: una 201 y la otra 409', async () => {
    const id = await crearReporte();
    const { agente } = await entrarVerificado();
    const respuestas = await Promise.all([confirmar(agente, id), confirmar(agente, id)]);
    expect(respuestas.map((r) => r.status).sort()).toEqual([201, 409]);
    expect(await contarConfirmaciones()).toBe(1);
  });
});

describe('POST /api/reportes/:id/confirmar: alertas no activas (RF-11)', () => {
  test.each([
    ['pendiente', { estado: 'pendiente' }],
    ['rechazada', { estado: 'rechazado' }],
    ['resuelta', { estado: 'resuelto' }],
    ['retirada', { estado: 'retirado' }],
    ['aprobada hace más de 24 horas', { aprobadoEn: haceHoras(25) }],
  ])('una alerta %s responde 404', async (_, datos) => {
    const id = await crearReporte(datos);
    const { agente } = await entrarVerificado();
    const res = await confirmar(agente, id);
    expect(res.status).toBe(404);
    expect(res.body.error.codigo).toBe('NO_ENCONTRADO');
    expect(await contarConfirmaciones()).toBe(0);
  });

  test('un reporte inexistente responde 404 y un id inválido 400', async () => {
    const { agente } = await entrarVerificado();
    expect((await confirmar(agente, 999)).status).toBe(404);
    expect((await confirmar(agente, 'abc')).status).toBe(400);
  });
});

describe('POST /api/reportes/:id/confirmar: permisos', () => {
  test('el autor no puede confirmar su propio reporte: 403 SIN_PERMISO', async () => {
    const { agente, usuario } = await entrarVerificado();
    const id = await crearReporte({ usuarioId: usuario.id });
    const res = await confirmar(agente, id);
    expect(res.status).toBe(403);
    expect(res.body.error.codigo).toBe('SIN_PERMISO');
    expect(await contarConfirmaciones()).toBe(0);
  });

  test('RF-03: con el email sin verificar responde 403 EMAIL_NO_VERIFICADO', async () => {
    const id = await crearReporte();
    const { agente } = await registrarYEntrar();
    const res = await confirmar(agente, id);
    expect(res.status).toBe(403);
    expect(res.body.error.codigo).toBe('EMAIL_NO_VERIFICADO');
  });

  test('un administrador no confirma alertas: 403 SIN_PERMISO', async () => {
    const id = await crearReporte();
    const { agente, usuario } = await entrarVerificado();
    await pool.query("UPDATE usuarios SET rol = 'admin' WHERE id = $1", [usuario.id]);
    const res = await confirmar(agente, id);
    expect(res.status).toBe(403);
    expect(res.body.error.codigo).toBe('SIN_PERMISO');
    expect(await contarConfirmaciones()).toBe(0);
  });

  test('RF-16: un usuario bloqueado recibe 403 USUARIO_BLOQUEADO', async () => {
    const id = await crearReporte();
    const { agente, usuario } = await entrarVerificado();
    await pool.query('UPDATE usuarios SET bloqueado = true WHERE id = $1', [usuario.id]);
    const res = await confirmar(agente, id);
    expect(res.status).toBe(403);
    expect(res.body.error.codigo).toBe('USUARIO_BLOQUEADO');
  });

  test('sin sesión responde 401', async () => {
    const id = await crearReporte();
    const res = await request(app).post(`/api/reportes/${id}/confirmar`).set(CSRF);
    expect(res.status).toBe(401);
    expect(res.body.error.codigo).toBe('NO_AUTENTICADO');
  });

  test('sin el encabezado X-Requested-With responde 403 y no guarda nada', async () => {
    const id = await crearReporte();
    const { agente } = await entrarVerificado();
    const res = await agente.post(`/api/reportes/${id}/confirmar`);
    expect(res.status).toBe(403);
    expect(await contarConfirmaciones()).toBe(0);
  });
});
