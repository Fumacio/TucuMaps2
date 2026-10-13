const { catalogos, valores } = require('../src/catalogos');
const { app, pool, request, CSRF } = require('./helpers');

afterAll(() => pool.end());

// Valores permitidos por el CHECK "columna IN (...)" de una tabla, leídos de la base.
async function valoresDelCheck(tabla, columna) {
  const { rows } = await pool.query(
    `SELECT pg_get_constraintdef(c.oid) AS def
     FROM pg_constraint c
     JOIN pg_attribute a ON a.attrelid = c.conrelid AND a.attnum = ANY (c.conkey)
     WHERE c.contype = 'c' AND c.conrelid = $1::regclass AND a.attname = $2`,
    [tabla, columna],
  );
  // Si hay varios CHECK sobre la columna, el de catálogo es el que lista valores con ANY/IN.
  const def = rows.map((r) => r.def).find((d) => /ANY|IN \(/.test(d));
  if (!def) throw new Error(`No se encontró el CHECK de catálogo de ${tabla}.${columna}`);
  return [...def.matchAll(/'([^']+)'/g)].map((m) => m[1]).sort();
}

describe('GET /api/catalogos (RF-10)', () => {
  test('es público y devuelve los cuatro catálogos con valor y etiqueta', async () => {
    const res = await request(app).get('/api/catalogos');
    expect(res.status).toBe(200);
    expect(Object.keys(res.body)).toEqual([
      'tipos_reporte',
      'categorias_lugar',
      'categorias_evento',
      'modalidades_evento',
    ]);
    expect(res.body.modalidades_evento).toContainEqual({ valor: 'a_la_gorra', etiqueta: 'A la gorra' });
    expect(res.headers['cache-control']).toMatch(/max-age=300/);
  });

  test('no acepta otros métodos', async () => {
    const res = await request(app).post('/api/catalogos').set(CSRF).send({});
    expect(res.status).toBe(404);
  });

  test.each([
    ['tipos_reporte', 'reportes', 'tipo'],
    ['categorias_lugar', 'lugares', 'categoria'],
    ['categorias_evento', 'eventos', 'categoria'],
    ['modalidades_evento', 'eventos', 'modalidad'],
  ])('%s coincide con el CHECK de %s.%s', async (nombre, tabla, columna) => {
    expect(valores(nombre).sort()).toEqual(await valoresDelCheck(tabla, columna));
  });

  test('las etiquetas no están vacías y los catálogos no se pueden modificar', () => {
    for (const lista of Object.values(catalogos)) {
      for (const { etiqueta } of lista) expect(etiqueta.length).toBeGreaterThan(0);
    }
    expect(Object.isFrozen(catalogos.tipos_reporte)).toBe(true);
    expect(() => valores('no_existe')).toThrow(/no_existe/);
  });
});
