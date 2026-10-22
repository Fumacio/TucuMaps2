// RF-13, RF-15, RF-12: alta, edición, lista y detalle de eventos en el panel (#47).
const { app, pool, request, CSRF, limpiarBase } = require('./helpers');
const { datosEvento, enDias } = require('./envios-comun');
const { HORA, haceHoras, entrarComoAdmin, crearCiudadano, crearEvento, filaEvento } = require('./admin-comun');

beforeEach(limpiarBase);
afterAll(() => pool.end());

const crearLugar = async (activo = true) =>
  Number(
    (
      await pool.query(
        `INSERT INTO lugares (nombre, categoria, lat, lng, activo)
         VALUES ('Parque 9 de Julio', 'recreativo', -26.83, -65.19, $1) RETURNING id`,
        [activo],
      )
    ).rows[0].id,
  );

describe('POST /api/admin/eventos (RF-13)', () => {
  test('crea el evento ya aprobado, con el admin como autor, y aparece en la agenda', async () => {
    const { agente, usuario: admin } = await entrarComoAdmin();
    const lugarId = await crearLugar();
    const res = await agente.post('/api/admin/eventos').set(CSRF).send(datosEvento({ lugar_id: lugarId, estado: 'pendiente' }));
    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({
      nombre: 'Peña en el Parque',
      lugar_id: lugarId,
      etiquetas: ['folclore', 'familia'],
      estado: 'aprobado',
      vigente: true,
      autor: { id: admin.id, nombre: 'Admin Uno' },
      revisado_por: { id: admin.id },
    });
    expect((await request(app).get('/api/eventos')).body).toEqual([expect.objectContaining({ id: res.body.id })]);
  });

  test('no cuenta para el límite diario de propuestas (RF-09)', async () => {
    const { agente } = await entrarComoAdmin();
    for (let i = 0; i < 4; i += 1) {
      expect((await agente.post('/api/admin/eventos').set(CSRF).send(datosEvento())).status).toBe(201);
    }
  });

  test('valida igual que una propuesta: datos inválidos o un lugar inactivo responden 400', async () => {
    const { agente } = await entrarComoAdmin();
    const pasado = await agente.post('/api/admin/eventos').set(CSRF).send(datosEvento({ inicio: enDias(-1), fin: null }));
    expect(pasado.status).toBe(400);
    expect(pasado.body.error.detalles.map((d) => d.campo)).toContain('inicio');

    const lugarId = await crearLugar(false);
    const inactivo = await agente.post('/api/admin/eventos').set(CSRF).send(datosEvento({ lugar_id: lugarId }));
    expect(inactivo.status).toBe(400);
    expect(inactivo.body.error.detalles).toEqual([expect.objectContaining({ campo: 'lugar_id' })]);
    expect((await pool.query('SELECT count(*)::int AS n FROM eventos')).rows[0].n).toBe(0);
  });

  test('sin X-Requested-With responde 403 y no crea nada', async () => {
    const { agente } = await entrarComoAdmin();
    expect((await agente.post('/api/admin/eventos').send(datosEvento())).status).toBe(403);
    expect((await pool.query('SELECT count(*)::int AS n FROM eventos')).rows[0].n).toBe(0);
  });
});

describe('PUT /api/admin/eventos/:id (RF-13)', () => {
  const editar = (agente, id, extra) => agente.put(`/api/admin/eventos/${id}`).set(CSRF).send(datosEvento(extra));

  test.each(['pendiente', 'aprobado'])('edita un evento %s sin cambiar su estado ni su autor', async (estado) => {
    const autorId = await crearCiudadano();
    const id = await crearEvento({ estado, usuarioId: autorId });
    await pool.query("UPDATE eventos SET ia_veredicto = 'dudoso' WHERE id = $1", [id]);
    const { agente } = await entrarComoAdmin();

    const res = await editar(agente, id, { nombre: 'Peña de primavera', estado: 'rechazado' });
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ nombre: 'Peña de primavera', estado, autor: { id: autorId }, ia_veredicto: null });
    expect((await filaEvento(id)).propuesto_por).toBe(String(autorId));
  });

  test('un evento aprobado que ya empezó se puede editar con su mismo inicio en el pasado', async () => {
    const inicio = haceHoras(2);
    const id = await crearEvento({ estado: 'aprobado', inicio, fin: new Date(Date.now() + 5 * HORA) });
    const { agente } = await entrarComoAdmin();
    const res = await editar(agente, id, {
      inicio: inicio.toISOString(), fin: enDias(0.5), descripcion: 'Feria con nuevos puestos',
    });
    expect(res.status).toBe(200);
    expect(res.body.descripcion).toBe('Feria con nuevos puestos');
    expect((await request(app).get('/api/eventos')).body).toEqual([expect.objectContaining({ id })]);
  });

  test('mover el inicio al pasado, o ponerlo en el pasado en un pendiente, responde 400', async () => {
    const inicio = haceHoras(2);
    const aprobado = await crearEvento({ estado: 'aprobado', inicio, fin: new Date(Date.now() + 5 * HORA) });
    const pendiente = await crearEvento();
    const { agente } = await entrarComoAdmin();
    for (const [id, nuevoInicio] of [[aprobado, haceHoras(3)], [pendiente, haceHoras(1)]]) {
      const res = await editar(agente, id, { inicio: nuevoInicio.toISOString(), fin: enDias(0.5) });
      expect(res.status).toBe(400);
      expect(res.body.error.detalles).toEqual([expect.objectContaining({ campo: 'inicio' })]);
    }
    expect((await filaEvento(aprobado)).inicio).toEqual(inicio);
  });

  test('un evento archivado (RF-12) ya no se edita: 409, así no vuelve a la agenda', async () => {
    const inicio = haceHoras(50);
    const id = await crearEvento({ estado: 'aprobado', inicio });
    const antes = await filaEvento(id);
    const { agente } = await entrarComoAdmin();
    const res = await editar(agente, id, { inicio: inicio.toISOString(), fin: enDias(0.5) });
    expect(res.status).toBe(409);
    expect(res.body.error.mensaje).toMatch(/archivado/);
    expect(await filaEvento(id)).toEqual(antes);
  });

  test.each(['rechazado', 'cancelado', 'retirado'])('un evento %s responde 409 y no cambia', async (estado) => {
    const id = await crearEvento({ estado });
    const antes = await filaEvento(id);
    const { agente } = await entrarComoAdmin();
    const res = await editar(agente, id, { nombre: 'Otro nombre' });
    expect(res.status).toBe(409);
    expect(res.body.error.codigo).toBe('TRANSICION_INVALIDA');
    expect(await filaEvento(id)).toEqual(antes);
  });

  test('datos inválidos responden 400, un evento inexistente 404 y un lugar inactivo 400', async () => {
    const id = await crearEvento();
    const { agente } = await entrarComoAdmin();
    expect((await editar(agente, id, { lat: -30 })).status).toBe(400);
    expect((await editar(agente, 999)).status).toBe(404);
    const lugarId = await crearLugar(false);
    const res = await editar(agente, id, { lugar_id: lugarId });
    expect(res.status).toBe(400);
    expect(res.body.error.detalles[0].campo).toBe('lugar_id');
  });
});

describe('GET /api/admin/eventos (RF-15, RF-12)', () => {
  const listar = (agente, query = '') => agente.get(`/api/admin/eventos${query}`);

  test('lista todos, del más nuevo al más viejo, con autor; un archivado sigue en la lista', async () => {
    const autorId = await crearCiudadano();
    const archivado = await crearEvento({ estado: 'aprobado', inicio: haceHoras(50), creadoEn: haceHoras(60) });
    const pendiente = await crearEvento({ usuarioId: autorId });
    const { agente } = await entrarComoAdmin();

    const res = await listar(agente);
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ pagina: 1, por_pagina: 20, total: 2 });
    expect(res.body.datos.map((e) => e.id)).toEqual([pendiente, archivado]);
    expect(res.body.datos[0]).toMatchObject({ estado: 'pendiente', vigente: false, archivado: false, autor: { id: autorId } });
    expect(res.body.datos[1]).toMatchObject({ estado: 'aprobado', vigente: false, archivado: true, autor: null });
    expect(JSON.stringify(res.body)).not.toContain('ana@mail.com');
    expect((await request(app).get('/api/eventos')).body).toEqual([]);
  });

  test('filtra por estado, categoría, archivado y veredicto de IA', async () => {
    const pendiente = await crearEvento({ categoria: 'teatro' });
    const archivado = await crearEvento({ estado: 'aprobado', inicio: haceHoras(50) });
    await pool.query("UPDATE eventos SET ia_veredicto = 'probable_real' WHERE id = $1", [pendiente]);
    const { agente } = await entrarComoAdmin();
    const ids = async (query) => (await listar(agente, query)).body.datos.map((e) => e.id);

    expect(await ids('?estado=aprobado')).toEqual([archivado]);
    expect(await ids('?categoria=teatro')).toEqual([pendiente]);
    expect(await ids('?archivado=true')).toEqual([archivado]);
    expect(await ids('?archivado=false')).toEqual([pendiente]);
    expect(await ids('?ia_veredicto=probable_real')).toEqual([pendiente]);
    expect(await ids('?archivado=&estado=')).toHaveLength(2);
  });

  test('pagina con total, también en una página vacía', async () => {
    for (let i = 0; i < 3; i += 1) await crearEvento({ creadoEn: haceHoras(i) });
    const { agente } = await entrarComoAdmin();
    expect((await listar(agente, '?por_pagina=2&pagina=2')).body).toMatchObject({ total: 3, datos: [expect.any(Object)] });
    expect((await listar(agente, '?por_pagina=2&pagina=9')).body).toEqual({ datos: [], pagina: 9, por_pagina: 2, total: 3 });
  });

  test.each([
    ['?estado=resuelto', 'estado'],
    ['?categoria=cine', 'categoria'],
    ['?archivado=si', 'archivado'],
    ['?ia_veredicto=x', 'ia_veredicto'],
  ])('%s responde 400', async (query, campo) => {
    const { agente } = await entrarComoAdmin();
    const res = await listar(agente, query);
    expect(res.status).toBe(400);
    expect(res.body.error.detalles[0].campo).toBe(campo);
  });

  test('GET /:id devuelve el detalle de un evento en cualquier estado; inexistente 404', async () => {
    const id = await crearEvento({ estado: 'cancelado' });
    const { agente } = await entrarComoAdmin();
    const res = await agente.get(`/api/admin/eventos/${id}`);
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ id, estado: 'cancelado', lat: -26.8317, lugar_id: null });
    expect((await agente.get('/api/admin/eventos/999')).status).toBe(404);
  });
});
