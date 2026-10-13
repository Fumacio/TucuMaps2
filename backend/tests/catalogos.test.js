const { catalogos, valores } = require('../src/catalogos');
const { app, pool, request } = require('./helpers');

afterAll(() => pool.end());

// Valores permitidos por el CHECK de una columna, leídos de la base.
async function valoresDelCheck(tabla, columna) {
  const { rows } = await pool.query(
    `SELECT pg_get_constraintdef(c.oid) AS def
     FROM pg_constraint c
     JOIN pg_attribute a ON a.attrelid = c.conrelid AND a.attnum = ANY (c.conkey)
     WHERE c.contype = 'c' AND c.conrelid = $1::regclass AND a.attname = $2`,
    [tabla, columna],
  );
  return [...rows[0].def.matchAll(/'([a-z_]+)'/g)].map((m) => m[1]).sort();
}

describe('GET /api/catalogos (RF-10)', () => {
  test('devuelve los cuatro catálogos con valor y etiqueta', async () => {
    const res = await request(app).get('/api/catalogos');
    expect(res.status).toBe(200);
    expect(Object.keys(res.body)).toEqual([
      'tipos_reporte',
      'categorias_lugar',
      'categorias_evento',
      'modalidades_evento',
    ]);
    expect(res.body.modalidades_evento).toContainEqual({ valor: 'a_la_gorra', etiqueta: 'A la gorra' });
    expect(res.headers['cache-control']).toMatch(/max-age=3600/);
  });

  test.each([
    ['tipos_reporte', 'reportes', 'tipo'],
    ['categorias_lugar', 'lugares', 'categoria'],
    ['categorias_evento', 'eventos', 'categoria'],
    ['modalidades_evento', 'eventos', 'modalidad'],
  ])('%s coincide con el CHECK de %s.%s', async (nombre, tabla, columna) => {
    expect(valores(nombre).sort()).toEqual(await valoresDelCheck(tabla, columna));
  });

  test('ninguna etiqueta está vacía', () => {
    for (const lista of Object.values(catalogos)) {
      for (const { etiqueta } of lista) expect(etiqueta.length).toBeGreaterThan(0);
    }
  });
});
