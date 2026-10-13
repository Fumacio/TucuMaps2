// Migración 1760500000000: oculta los 6 lugares del interior (alcance del 13/10/2026).
const migracion = require('../migrations/1760500000000_ocultar-lugares-interior');
const { app, pool, request } = require('./helpers');

// Ejecuta el up o el down de la migración contra la base de pruebas.
async function correr(direccion) {
  const sentencias = [];
  migracion[direccion]({ sql: (s) => sentencias.push(s) });
  for (const s of sentencias) await pool.query(s);
}

beforeEach(() => pool.query('DELETE FROM lugares'));
afterAll(() => pool.end());

test('oculta los lugares del interior sin borrarlos y el down los vuelve a mostrar', async () => {
  await pool.query(
    `INSERT INTO lugares (nombre, categoria, lat, lng) VALUES
       ('Ciudad Sagrada de Quilmes', 'historico', -26.47, -66.04),
       ('Plaza Independencia', 'historico', -26.83, -65.20)`,
  );

  await correr('up');
  let res = await request(app).get('/api/lugares');
  expect(res.body.map((l) => l.nombre)).toEqual(['Plaza Independencia']);
  const { rows } = await pool.query('SELECT count(*)::int AS n FROM lugares');
  expect(rows[0].n).toBe(2); // no se borró nada

  await correr('down');
  res = await request(app).get('/api/lugares');
  expect(res.body).toHaveLength(2);
});
