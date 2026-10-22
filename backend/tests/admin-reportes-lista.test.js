// RF-15, RF-11: cola y detalle de reportes del panel (GET /api/admin/reportes, #46).
const { pool, limpiarBase } = require('./helpers');
const { haceHoras, entrarComoAdmin, crearCiudadano, crearReporte } = require('./admin-comun');

beforeEach(limpiarBase);
afterAll(() => pool.end());

const listar = (agente, query = '') => agente.get(`/api/admin/reportes${query}`);

describe('GET /api/admin/reportes', () => {
  test('lista todos los estados, del más nuevo al más viejo, con autor, confirmaciones y datos de IA', async () => {
    const autorId = await crearCiudadano();
    const viejo = await crearReporte({ usuarioId: autorId, creadoEn: haceHoras(5) });
    const nuevo = await crearReporte({ usuarioId: autorId, estado: 'aprobado' });
    const vecino = await crearCiudadano({ nombre: 'Beto', email: 'beto@mail.com' });
    await pool.query('INSERT INTO confirmaciones (reporte_id, usuario_id) VALUES ($1, $2)', [nuevo, vecino]);
    const { agente } = await entrarComoAdmin();

    const res = await listar(agente);
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ pagina: 1, por_pagina: 20, total: 2 });
    expect(res.body.datos.map((r) => r.id)).toEqual([nuevo, viejo]);
    expect(res.body.datos[0]).toEqual({
      id: nuevo,
      tipo: 'robo_asalto',
      descripcion: 'Arrebatos frecuentes en la parada',
      direccion: 'Av. Mate de Luna 2400',
      barrio: 'Barrio Norte',
      lat: -26.8235,
      lng: -65.2301,
      estado: 'aprobado',
      activa: true,
      autor: { id: autorId, nombre: 'Ana Pérez' },
      confirmaciones: 1,
      creado_en: expect.any(String),
      actualizado_en: expect.any(String),
      aprobado_en: expect.any(String),
      resuelto_en: null,
      revisado_por: null,
      revisado_en: null,
      motivo_rechazo: null,
      retirado_por: null,
      retirado_en: null,
      ia_veredicto: null,
      ia_confianza: null,
      ia_motivo: null,
      ia_analizado_en: null,
    });
  });

  test('nunca expone el email ni la contraseña del autor', async () => {
    const autorId = await crearCiudadano();
    await crearReporte({ usuarioId: autorId });
    const { agente } = await entrarComoAdmin();
    const texto = JSON.stringify((await listar(agente)).body);
    expect(texto).not.toContain('ana@mail.com');
    expect(texto).not.toContain('password');
  });

  test('una alerta aprobada hace más de 24 hs sigue en la lista, pero no activa (RF-11)', async () => {
    const id = await crearReporte({ estado: 'aprobado', aprobadoEn: haceHoras(25) });
    const { agente } = await entrarComoAdmin();
    const res = await listar(agente);
    expect(res.body.datos).toEqual([expect.objectContaining({ id, estado: 'aprobado', activa: false })]);
  });

  test('filtra por estado, tipo, veredicto de IA y fecha de envío', async () => {
    const pendiente = await crearReporte();
    const aprobado = await crearReporte({ estado: 'aprobado', tipo: 'disturbio', creadoEn: haceHoras(72) });
    await pool.query("UPDATE reportes SET ia_veredicto = 'dudoso', ia_confianza = 0.62 WHERE id = $1", [pendiente]);
    const { agente } = await entrarComoAdmin();
    const ids = async (query) => (await listar(agente, query)).body.datos.map((r) => r.id);

    expect(await ids('?estado=pendiente')).toEqual([pendiente]);
    expect(await ids('?tipo=disturbio')).toEqual([aprobado]);
    expect(await ids('?ia_veredicto=dudoso')).toEqual([pendiente]);
    const hace2Dias = haceHoras(48).toISOString();
    expect(await ids(`?desde=${encodeURIComponent(hace2Dias)}`)).toEqual([pendiente]);
    expect(await ids(`?hasta=${encodeURIComponent(hace2Dias)}`)).toEqual([aprobado]);
    expect(await ids('?estado=&tipo=')).toHaveLength(2);
    expect((await listar(agente, '?ia_veredicto=dudoso')).body.datos[0].ia_confianza).toBe(0.62);
  });

  test('pagina con total, también en una página vacía', async () => {
    for (let i = 0; i < 3; i += 1) await crearReporte({ creadoEn: haceHoras(i) });
    const { agente } = await entrarComoAdmin();

    const pagina2 = await listar(agente, '?pagina=2&por_pagina=2');
    expect(pagina2.body).toMatchObject({ pagina: 2, por_pagina: 2, total: 3 });
    expect(pagina2.body.datos).toHaveLength(1);

    const vacia = await listar(agente, '?pagina=5&por_pagina=2&estado=pendiente');
    expect(vacia.body).toEqual({ datos: [], pagina: 5, por_pagina: 2, total: 3 });
  });

  test.each([
    ['estado fuera de la lista', '?estado=borrado', 'estado'],
    ['tipo fuera del catálogo', '?tipo=otro', 'tipo'],
    ['veredicto inválido', '?ia_veredicto=seguro', 'ia_veredicto'],
    ['fecha mal formada', '?desde=ayer', 'desde'],
    ['hasta anterior a desde', '?desde=2026-11-10&hasta=2026-11-01', 'hasta'],
    ['por_pagina mayor a 100', '?por_pagina=101', 'por_pagina'],
  ])('%s responde 400', async (_, query, campo) => {
    const { agente } = await entrarComoAdmin();
    const res = await listar(agente, query);
    expect(res.status).toBe(400);
    expect(res.body.error.codigo).toBe('DATOS_INVALIDOS');
    expect(res.body.error.detalles[0].campo).toBe(campo);
  });
});

describe('GET /api/admin/reportes/:id', () => {
  test('devuelve el detalle con quién lo revisó y quién lo retiró', async () => {
    const id = await crearReporte({ estado: 'aprobado' });
    const { agente, usuario: admin } = await entrarComoAdmin();
    await pool.query(
      `UPDATE reportes SET estado = 'retirado', revisado_por = $2, revisado_en = now(),
         retirado_por = $2, retirado_en = now() WHERE id = $1`,
      [id, admin.id],
    );

    const res = await agente.get(`/api/admin/reportes/${id}`);
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      id,
      estado: 'retirado',
      activa: false,
      autor: null,
      revisado_por: { id: admin.id, nombre: 'Admin Uno' },
      retirado_por: { id: admin.id, nombre: 'Admin Uno' },
    });
  });

  test('un id inexistente responde 404 y uno inválido 400', async () => {
    const { agente } = await entrarComoAdmin();
    expect((await agente.get('/api/admin/reportes/999')).status).toBe(404);
    expect((await agente.get('/api/admin/reportes/0')).status).toBe(400);
  });
});

describe('Valores de los filtros', () => {
  test('los estados y veredictos del esquema coinciden con los tipos de la base', async () => {
    const { ESTADOS_REPORTE, ESTADOS_EVENTO, VEREDICTOS_IA } = require('../src/schemas/moderacion');
    const tipo = async (nombre) =>
      (await pool.query(`SELECT unnest(enum_range(NULL::${nombre}))::text AS v`)).rows.map((r) => r.v);
    expect(await tipo('estado_reporte')).toEqual(ESTADOS_REPORTE);
    expect(await tipo('estado_revision')).toEqual(ESTADOS_EVENTO);
    expect(await tipo('veredicto_ia')).toEqual(VEREDICTOS_IA);
  });

  test('hasta con un día incluye lo enviado en el último instante de ese día', async () => {
    const id = await crearReporte({ creadoEn: '2026-11-07T23:59:59.999800-03:00' });
    await crearReporte({ creadoEn: '2026-11-08T00:00:00-03:00' });
    const { agente } = await entrarComoAdmin();
    const res = await listar(agente, '?hasta=2026-11-07');
    expect(res.body.datos.map((r) => r.id)).toEqual([id]);
  });
});
