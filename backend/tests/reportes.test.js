// RF-02, RF-11, RF-04: API pública de alertas.
const { app, pool, request, limpiarBase, registrarYEntrar } = require('./helpers');

const HORA = 60 * 60 * 1000;
const haceHoras = (horas) => new Date(Date.now() - horas * HORA);

// Los reportes todavía no se pueden enviar por la API (Fase 3): se insertan directo.
async function crearReporte(datos = {}) {
  const reporte = {
    tipo: 'arrebato_motochorro',
    descripcion: 'Arrebatos frecuentes en la parada',
    estado: 'aprobado',
    aprobado_en: haceHoras(1),
    usuario_id: null,
    ...datos,
  };
  const { rows } = await pool.query(
    `INSERT INTO reportes (usuario_id, tipo, descripcion, direccion, barrio, lat, lng, estado,
       aprobado_en, ia_veredicto, ia_motivo)
     VALUES ($1, $2, $3, 'Av. Mate de Luna 2400', 'Barrio Norte', -26.8235, -65.2301, $4, $5,
       'dudoso', 'Texto coherente')
     RETURNING id`,
    [reporte.usuario_id, reporte.tipo, reporte.descripcion, reporte.estado, reporte.aprobado_en],
  );
  return Number(rows[0].id);
}

// limpiarBase vacía usuarios en cascada, y con eso también reportes y confirmaciones.
beforeEach(limpiarBase);
afterAll(() => pool.end());

describe('GET /api/reportes (RF-02, RF-11)', () => {
  test('es público y devuelve las alertas activas, la más reciente primero', async () => {
    const viejaId = await crearReporte({
      tipo: 'robo_hurto',
      aprobado_en: haceHoras(5),
    });
    const nuevaId = await crearReporte();

    const res = await request(app).get('/api/reportes');
    expect(res.status).toBe(200);
    expect(res.body.map((r) => r.id)).toEqual([nuevaId, viejaId]);
    expect(res.body[0]).toEqual({
      id: nuevaId,
      tipo: 'arrebato_motochorro',
      descripcion: 'Arrebatos frecuentes en la parada',
      direccion: 'Av. Mate de Luna 2400',
      barrio: 'Barrio Norte',
      lat: -26.8235,
      lng: -65.2301,
      aprobado_en: expect.any(String),
      confirmaciones: 0,
    });
    expect(new Date(res.body[0].aprobado_en).toISOString()).toBe(res.body[0].aprobado_en);
  });

  test('sin alertas devuelve una lista vacía', async () => {
    const res = await request(app).get('/api/reportes');
    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });

  test('RF-11: deja de aparecer 24 hs después de aprobada', async () => {
    await crearReporte({
      descripcion: 'Aprobada hace 23 hs',
      aprobado_en: haceHoras(23),
    });
    await crearReporte({
      descripcion: 'Aprobada hace 25 hs',
      aprobado_en: haceHoras(25),
    });
    const res = await request(app).get('/api/reportes');
    expect(res.body.map((r) => r.descripcion)).toEqual(['Aprobada hace 23 hs']);
  });

  test.each(['pendiente', 'rechazado', 'cancelado', 'resuelto', 'retirado'])(
    'un reporte %s nunca aparece (RF-08)',
    async (estado) => {
      await crearReporte({ estado });
      const res = await request(app).get('/api/reportes');
      expect(res.body).toEqual([]);
    },
  );

  test('cuenta las confirmaciones de cada alerta (RF-14)', async () => {
    const conDosId = await crearReporte({ aprobado_en: haceHoras(2) });
    const sinNingunaId = await crearReporte();
    for (const email of ['a@mail.com', 'b@mail.com']) {
      const { usuario } = await registrarYEntrar({ email });
      await pool.query('INSERT INTO confirmaciones (reporte_id, usuario_id) VALUES ($1, $2)', [
        conDosId,
        usuario.id,
      ]);
    }
    const res = await request(app).get('/api/reportes');
    const porId = Object.fromEntries(res.body.map((r) => [r.id, r.confirmaciones]));
    expect(porId).toEqual({ [conDosId]: 2, [sinNingunaId]: 0 });
  });

  test('RF-04: nunca incluye al autor, al moderador ni datos internos', async () => {
    const { usuario } = await registrarYEntrar();
    await crearReporte({ usuario_id: usuario.id });

    const res = await request(app).get('/api/reportes');
    expect(res.body).toHaveLength(1);
    const [alerta] = res.body;
    for (const campo of [
      'usuario_id',
      'revisado_por',
      'retirado_por',
      'estado',
      'ia_veredicto',
      'ia_motivo',
      'creado_en',
    ]) {
      expect(alerta).not.toHaveProperty(campo);
    }
    const texto = JSON.stringify(res.body);
    expect(texto).not.toContain(usuario.email);
    expect(texto).not.toContain(usuario.nombre);
  });
});
