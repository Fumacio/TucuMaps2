// RF-07, RF-08: "Mis envíos" (GET /api/mis-envios, #44).
const {
  app,
  pool,
  request,
  limpiarBase,
  registrarYEntrar,
  datosReporte,
  datosEvento,
  CLASES,
  entrarVerificado,
  crear,
} = require('./envios-comun');

beforeEach(limpiarBase);
afterAll(() => pool.end());

describe('GET /api/mis-envios (RF-07, RF-08)', () => {
  const misEnvios = (agente, query = '') => agente.get(`/api/mis-envios${query}`);

  test('devuelve reportes y eventos propios, del más nuevo al más viejo, con su contenido', async () => {
    const { agente } = await entrarVerificado();
    const idReporte = await crear(agente, CLASES[0]);
    const idEvento = await crear(agente, CLASES[1]);
    // El reporte queda como el más viejo.
    await pool.query("UPDATE reportes SET creado_en = now() - interval '1 hour' WHERE id = $1", [idReporte]);

    const res = await misEnvios(agente);
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ pagina: 1, por_pagina: 20, total: 2 });
    expect(res.body.datos).toEqual([
      {
        tipo: 'evento',
        id: idEvento,
        estado: 'pendiente',
        motivo_rechazo: null,
        creado_en: expect.any(String),
        actualizado_en: expect.any(String),
        contenido: {
          ...datosEvento(),
          inicio: expect.any(String),
          fin: expect.any(String),
          lugar_id: null,
        },
      },
      {
        tipo: 'reporte',
        id: idReporte,
        estado: 'pendiente',
        motivo_rechazo: null,
        creado_en: expect.any(String),
        actualizado_en: expect.any(String),
        contenido: datosReporte(),
      },
    ]);
    // Las fechas salen en ISO 8601, igual que el resto de la API.
    expect(res.body.datos[0].contenido.inicio).toMatch(/^\d{4}-\d{2}-\d{2}T.*Z$/);
  });

  test('incluye el estado y el motivo de rechazo', async () => {
    const { agente } = await entrarVerificado();
    const id = await crear(agente, CLASES[0]);
    await pool.query(
      "UPDATE reportes SET estado = 'rechazado', motivo_rechazo = 'Falta la dirección' WHERE id = $1",
      [id],
    );
    const res = await misEnvios(agente);
    expect(res.body.datos[0]).toMatchObject({ estado: 'rechazado', motivo_rechazo: 'Falta la dirección' });
  });

  test('solo muestra lo propio', async () => {
    const { agente: ana } = await entrarVerificado();
    await crear(ana, CLASES[0]);
    await crear(ana, CLASES[1]);
    const { agente: beto } = await entrarVerificado({ email: 'beto@mail.com' });
    const idBeto = await crear(beto, CLASES[0]);

    const res = await misEnvios(beto);
    expect(res.body.total).toBe(1);
    expect(res.body.datos.map((e) => e.id)).toEqual([idBeto]);
  });

  test('filtra por tipo y pagina', async () => {
    const { agente } = await entrarVerificado();
    for (let i = 0; i < 3; i += 1) await crear(agente, CLASES[0]);
    await crear(agente, CLASES[1]);

    const reportes = await misEnvios(agente, '?tipo=reporte&por_pagina=2&pagina=2');
    expect(reportes.status).toBe(200);
    expect(reportes.body).toMatchObject({ pagina: 2, por_pagina: 2, total: 3 });
    expect(reportes.body.datos).toHaveLength(1);
    expect(reportes.body.datos[0].tipo).toBe('reporte');

    const eventos = await misEnvios(agente, '?tipo=evento');
    expect(eventos.body.total).toBe(1);
    expect(eventos.body.datos.map((e) => e.tipo)).toEqual(['evento']);

    // Un tipo vacío equivale a no filtrar.
    expect((await misEnvios(agente, '?tipo=')).body.total).toBe(4);
  });

  test('un usuario sin envíos recibe una lista vacía', async () => {
    const { agente } = await registrarYEntrar();
    const res = await misEnvios(agente);
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ datos: [], pagina: 1, por_pagina: 20, total: 0 });
  });

  test('un tipo o una paginación inválidos responden 400', async () => {
    const { agente } = await registrarYEntrar();
    expect((await misEnvios(agente, '?tipo=lugar')).status).toBe(400);
    expect((await misEnvios(agente, '?por_pagina=500')).status).toBe(400);
  });

  test('es nivel Sesión: sin sesión 401; con el email sin verificar se puede consultar', async () => {
    expect((await request(app).get('/api/mis-envios')).status).toBe(401);
    const { agente } = await registrarYEntrar();
    expect((await misEnvios(agente)).status).toBe(200);
  });

  test('RF-16: un usuario bloqueado recibe 403', async () => {
    const { agente, usuario } = await entrarVerificado();
    await pool.query('UPDATE usuarios SET bloqueado = true WHERE id = $1', [usuario.id]);
    const res = await misEnvios(agente);
    expect(res.status).toBe(403);
    expect(res.body.error.codigo).toBe('USUARIO_BLOQUEADO');
  });
});
