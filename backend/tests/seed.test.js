// RF-02: carga inicial de los 20 lugares (npm run seed).
const lugaresSeed = require('../seeds/lugares');
const { sembrarLugares } = require('../seeds');
const { valores } = require('../src/catalogos');
const { app, pool, request } = require('./helpers');

beforeEach(() => pool.query('DELETE FROM lugares'));
afterAll(() => pool.end());

const contar = async () => Number((await pool.query('SELECT count(*) FROM lugares')).rows[0].count);

describe('Datos del seed', () => {
  test('son 20 lugares con nombre único, categoría del catálogo y coordenadas dentro de Tucumán', () => {
    expect(lugaresSeed).toHaveLength(20);
    expect(new Set(lugaresSeed.map((l) => l.nombre)).size).toBe(20);
    for (const l of lugaresSeed) {
      expect(valores('categorias_lugar')).toContain(l.categoria);
      expect(l.lat).toBeGreaterThanOrEqual(-28);
      expect(l.lat).toBeLessThanOrEqual(-26);
      expect(l.lng).toBeGreaterThanOrEqual(-66.5);
      expect(l.lng).toBeLessThanOrEqual(-64.5);
      expect(l.descripcion.length).toBeGreaterThan(20);
      expect(l.localidad).toBeTruthy();
    }
  });
});

describe('sembrarLugares', () => {
  test('carga los 20 y quedan visibles en GET /api/lugares', async () => {
    const r = await sembrarLugares();
    expect(r).toEqual({ creados: 20, actualizados: 0, sin_cambios: 0 });
    const res = await request(app).get('/api/lugares');
    expect(res.body).toHaveLength(20);
  });

  test('es idempotente: correrlo dos veces no duplica', async () => {
    await sembrarLugares();
    const r = await sembrarLugares();
    expect(r).toEqual({ creados: 0, actualizados: 0, sin_cambios: 20 });
    expect(await contar()).toBe(20);
  });

  test('dos corridas simultáneas tampoco duplican', async () => {
    await Promise.all([sembrarLugares(), sembrarLugares()]);
    expect(await contar()).toBe(20);
  });

  test('sin --actualizar no toca los existentes; con --actualizar los corrige sin borrar textos cargados', async () => {
    await sembrarLugares();
    const nombre = lugaresSeed[0].nombre;
    await pool.query(
      `UPDATE lugares SET descripcion = 'editado', contenido_historico = 'texto del panel', lat = -26.9
       WHERE nombre = $1`,
      [nombre],
    );

    await sembrarLugares();
    let { rows } = await pool.query('SELECT descripcion FROM lugares WHERE nombre = $1', [nombre]);
    expect(rows[0].descripcion).toBe('editado');

    const r = await sembrarLugares({ actualizar: true });
    expect(r).toEqual({ creados: 0, actualizados: 1, sin_cambios: 19 }); // solo el que difería
    ({ rows } = await pool.query(
      'SELECT descripcion, contenido_historico, lat FROM lugares WHERE nombre = $1',
      [nombre],
    ));
    expect(rows[0].descripcion).toBe(lugaresSeed[0].descripcion);
    expect(Number(rows[0].lat)).toBe(lugaresSeed[0].lat);
    expect(rows[0].contenido_historico).toBe('texto del panel'); // null en el seed: no se pisa

    const otra = await sembrarLugares({ actualizar: true });
    expect(otra).toEqual({ creados: 0, actualizados: 0, sin_cambios: 20 });
  });

  test('la base no acepta dos lugares con el mismo nombre', async () => {
    await sembrarLugares();
    await expect(
      pool.query('INSERT INTO lugares (nombre, lat, lng) VALUES ($1, -26.8, -65.2)', [lugaresSeed[0].nombre]),
    ).rejects.toMatchObject({ code: '23505' });
  });
});
