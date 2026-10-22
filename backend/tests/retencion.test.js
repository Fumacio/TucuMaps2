// RF-24, RNF-07: retención de datos de 1 año (jobs/retencion.js, #49). Las fechas se simulan
// cargando creado_en en el pasado.
const { pool, limpiarBase } = require('./helpers');
const { crearCiudadano, crearReporte, crearEvento, filaReporte, filaEvento } = require('./admin-comun');
const retencion = require('../src/jobs/retencion');

const DIA = 24 * 60 * 60 * 1000;
const haceDias = (dias) => new Date(Date.now() - dias * DIA);

beforeEach(limpiarBase);
afterAll(() => pool.end());

async function crearToken(usuarioId, expiraEn) {
  await pool.query(
    `INSERT INTO tokens_usuario (usuario_id, tipo, token_hash, expira_en)
     VALUES ($1, 'verificar_email', md5(random()::text), $2)`,
    [usuarioId, expiraEn],
  );
}

describe('jobs/retencion.js', () => {
  test('borra los reportes de más de 1 año, desvincula los eventos y limpia los tokens vencidos', async () => {
    const ana = await crearCiudadano();
    const beto = await crearCiudadano({ email: 'beto@mail.com' });
    const reporteViejo = await crearReporte({ usuarioId: ana, estado: 'aprobado', creadoEn: haceDias(366) });
    const reporteNuevo = await crearReporte({ usuarioId: ana, creadoEn: haceDias(364) });
    await pool.query('INSERT INTO confirmaciones (reporte_id, usuario_id) VALUES ($1, $2)', [reporteViejo, beto]);
    const eventoViejo = await crearEvento({ usuarioId: ana, estado: 'aprobado', creadoEn: haceDias(400) });
    const eventoNuevo = await crearEvento({ usuarioId: ana, creadoEn: haceDias(10) });
    await crearToken(ana, haceDias(8));
    await crearToken(ana, haceDias(6));
    await crearToken(ana, new Date(Date.now() + DIA));

    const resultado = await retencion.ejecutar();
    expect(resultado).toEqual({ reportes_borrados: 1, eventos_desvinculados: 1, tokens_borrados: 1 });

    expect(await filaReporte(reporteViejo)).toBeUndefined();
    expect((await filaReporte(reporteNuevo)).usuario_id).toBe(String(ana));
    expect((await pool.query('SELECT count(*)::int AS n FROM confirmaciones')).rows[0].n).toBe(0);
    const viejo = await filaEvento(eventoViejo);
    expect(viejo.propuesto_por).toBeNull();
    expect(viejo.estado).toBe('aprobado');
    expect((await filaEvento(eventoNuevo)).propuesto_por).toBe(String(ana));
    expect((await pool.query('SELECT count(*)::int AS n FROM tokens_usuario')).rows[0].n).toBe(2);
  });

  test('correrla dos veces no cambia nada la segunda', async () => {
    await crearReporte({ creadoEn: haceDias(500) });
    await retencion.ejecutar();
    expect(await retencion.ejecutar()).toEqual({ reportes_borrados: 0, eventos_desvinculados: 0, tokens_borrados: 0 });
  });

  test('programar la corre enseguida y deja un temporizador que no frena el proceso', async () => {
    await crearReporte({ creadoEn: haceDias(500) });
    const log = jest.spyOn(console, 'log').mockImplementation(() => {});
    const temporizador = retencion.programar({ cadaMs: 60 * 60 * 1000 });
    try {
      expect(temporizador.hasRef()).toBe(false);
      await new Promise((r) => { setTimeout(r, 300); });
      expect(log).toHaveBeenCalledWith('Retención de datos (RF-24):', expect.stringContaining('"reportes_borrados":1'));
    } finally {
      clearInterval(temporizador);
      log.mockRestore();
    }
  });

  test('las pruebas no la corren solas: app.js no la programa', () => {
    const fuente = require('node:fs').readFileSync(require.resolve('../src/app.js'), 'utf8');
    expect(fuente).not.toContain('retencion');
  });
});
