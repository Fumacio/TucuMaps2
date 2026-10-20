// RF-07, RF-08, RF-09: editar y cancelar propuestas de eventos pendientes (#44).
const {
  pool,
  CSRF,
  limpiarBase,
  enDias,
  datosEvento,
  CLASES,
  entrarVerificado,
  crear,
  fila,
  probarEdicion,
} = require('./envios-comun');

beforeEach(limpiarBase);
afterAll(() => pool.end());

probarEdicion(CLASES[1]);

describe('PUT /api/eventos/:id: lugar del mapa', () => {
  test('un lugar_id inexistente o inactivo responde 400 con campo lugar_id', async () => {
    const { agente } = await entrarVerificado();
    const id = await crear(agente, { ruta: '/api/eventos', datos: datosEvento });
    const { rows } = await pool.query(
      `INSERT INTO lugares (nombre, categoria, lat, lng, activo)
       VALUES ('Lugar oculto', 'recreativo', -26.83, -65.18, false) RETURNING id`,
    );
    for (const lugarId of [999, Number(rows[0].id)]) {
      const res = await agente.put(`/api/eventos/${id}`).set(CSRF).send(datosEvento({ lugar_id: lugarId }));
      expect(res.status).toBe(400);
      expect(res.body.error.detalles).toEqual([{ campo: 'lugar_id', mensaje: expect.any(String) }]);
    }
  });

  test('acepta un lugar activo y permite volver a sacarlo (null)', async () => {
    const { agente } = await entrarVerificado();
    const id = await crear(agente, { ruta: '/api/eventos', datos: datosEvento });
    const { rows } = await pool.query(
      `INSERT INTO lugares (nombre, categoria, lat, lng) VALUES ('Parque', 'recreativo', -26.83, -65.18) RETURNING id`,
    );
    const lugarId = Number(rows[0].id);
    expect((await agente.put(`/api/eventos/${id}`).set(CSRF).send(datosEvento({ lugar_id: lugarId }))).status).toBe(200);
    expect((await fila('eventos', id)).lugar_id).toBe(String(lugarId));
    expect((await agente.put(`/api/eventos/${id}`).set(CSRF).send(datosEvento({ lugar_id: null }))).status).toBe(200);
    expect((await fila('eventos', id)).lugar_id).toBeNull();
  });

  test('las reglas de fechas del alta también valen al editar', async () => {
    const { agente } = await entrarVerificado();
    const id = await crear(agente, { ruta: '/api/eventos', datos: datosEvento });
    const res = await agente.put(`/api/eventos/${id}`).set(CSRF).send(datosEvento({ inicio: enDias(-1), fin: null }));
    expect(res.status).toBe(400);
    expect(res.body.error.detalles[0].campo).toBe('inicio');
  });
});
