// Migración 1760900000000: tipos de alerta definitivos (decisión de Nacho, 18/10/2026).
const migracion = require('../migrations/1760900000000_nuevos-tipos-reporte');
const { valores } = require('../src/catalogos');
const { pool, limpiarBase } = require('./helpers');

async function correr(direccion) {
  const sentencias = [];
  migracion[direccion]({ sql: (s) => sentencias.push(s) });
  for (const s of sentencias) await pool.query(s);
}

const insertar = (tipo) =>
  pool.query(
    `INSERT INTO reportes (tipo, descripcion, lat, lng) VALUES ($1, 'Descripción de prueba', -26.83, -65.2)`,
    [tipo],
  );

beforeEach(limpiarBase);
afterAll(() => pool.end());

test('pasa los reportes con tipos viejos al tipo nuevo más cercano', async () => {
  await correr('down'); // la base de pruebas ya tiene la migración aplicada
  for (const tipo of ['robo_hurto', 'arrebato_motochorro', 'zona_sin_iluminacion', 'accidente_transito', 'otro']) {
    await insertar(tipo);
  }

  await correr('up');
  const { rows } = await pool.query('SELECT tipo FROM reportes ORDER BY id');
  expect(rows.map((r) => r.tipo)).toEqual([
    'robo_asalto', 'robo_asalto', 'riesgo_comunitario', 'accidente_transito', 'riesgo_comunitario',
  ]);
});

test('la base acepta los cuatro tipos del catálogo y rechaza los viejos', async () => {
  expect(valores('tipos_reporte')).toEqual(['riesgo_comunitario', 'robo_asalto', 'disturbio', 'accidente_transito']);
  for (const tipo of valores('tipos_reporte')) await insertar(tipo);
  await expect(insertar('zona_peligrosa')).rejects.toMatchObject({ code: '23514' });
});
