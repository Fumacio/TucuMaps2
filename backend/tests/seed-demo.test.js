// #97: datos de demostración (npm run seed-demo). RF-07, RF-08, RF-11.
const { sembrarLugares } = require('../seeds');
const { sembrarDemo } = require('../seeds/demo');
const { USUARIO_DEMO, reportes, eventos } = require('../seeds/demo-datos');
const { valores } = require('../src/catalogos');
const { app, pool, request, CSRF, limpiarBase, registrarYEntrar } = require('./helpers');
const { entrarComoAdmin, crearReporte } = require('./admin-comun');

const PASSWORD = 'demo1234';

beforeEach(async () => {
  await limpiarBase();
  await pool.query('DELETE FROM lugares');
  await sembrarLugares();
});
afterAll(() => pool.end());

const contar = async (sql, params = []) => Number((await pool.query(sql, params)).rows[0].count);
const contarDemo = async () => {
  const { rows } = await pool.query(
    `SELECT (SELECT count(*) FROM reportes r JOIN usuarios u ON u.id = r.usuario_id WHERE u.email = $1)::int AS reportes,
            (SELECT count(*) FROM eventos e JOIN usuarios u ON u.id = e.propuesto_por WHERE u.email = $1)::int AS eventos`,
    [USUARIO_DEMO.email],
  );
  return rows[0];
};

describe('Datos de ejemplo', () => {
  test('8 reportes y 8 eventos, con valores del catálogo, dentro de Tucumán y marcados como ejemplo', () => {
    expect(reportes).toHaveLength(8);
    expect(eventos.length).toBeLessThanOrEqual(10); // SRS: hasta 10 eventos de demostración
    expect(new Set(reportes.map((r) => r.tipo))).toEqual(new Set(valores('tipos_reporte')));
    for (const r of reportes) {
      expect(r.descripcion.startsWith('[Ejemplo]')).toBe(true);
      expect(r.minutos).toBeLessThan(24 * 60); // RF-11: los aprobados siguen visibles
    }
    for (const e of eventos) {
      expect(e.nombre.startsWith('[Ejemplo]')).toBe(true);
      expect(e.descripcion.startsWith('[Ejemplo]')).toBe(true);
      expect(valores('categorias_evento')).toContain(e.categoria);
      expect(valores('modalidades_evento')).toContain(e.modalidad);
    }
    for (const x of [...reportes, ...eventos]) {
      expect(x.lat).toBeGreaterThanOrEqual(-26.9);
      expect(x.lat).toBeLessThanOrEqual(-26.7);
      expect(x.lng).toBeGreaterThanOrEqual(-65.4);
      expect(x.lng).toBeLessThanOrEqual(-65.1);
    }
  });
});

describe('sembrarDemo', () => {
  test('crea el usuario verificado y sus reportes y eventos; se ven en el mapa, la agenda y Mis aportes', async () => {
    const r = await sembrarDemo({ password: PASSWORD });
    expect(r).toEqual({ usuario: 'creado', ya_cargados: false, reportes: 8, eventos: 8 });

    const { rows: estados } = await pool.query(
      'SELECT estado, count(*)::int AS n FROM reportes GROUP BY estado ORDER BY estado',
    );
    expect(estados).toEqual([
      { estado: 'pendiente', n: 4 }, { estado: 'aprobado', n: 3 }, { estado: 'rechazado', n: 1 },
    ]);
    const rechazado = (await pool.query("SELECT motivo_rechazo FROM reportes WHERE estado = 'rechazado'")).rows[0];
    expect(rechazado.motivo_rechazo).toMatch(/^\[Ejemplo\]/);

    // RF-11: las 3 alertas aprobadas están en el mapa.
    const alertas = await request(app).get('/api/reportes');
    expect(alertas.body).toHaveLength(3);

    // RF-08: los 4 eventos aprobados están en la agenda, con su sede cuando la tienen.
    const agenda = await request(app).get('/api/eventos');
    expect(agenda.body).toHaveLength(4);
    expect(agenda.body.filter((e) => e.lugar_id !== null)).toHaveLength(4);
    for (const e of agenda.body) expect(new Date(e.inicio).getTime()).toBeGreaterThan(Date.now());

    // Se puede entrar con la contraseña de DEMO_PASSWORD y ver los 16 envíos.
    const agente = request.agent(app);
    const login = await agente.post('/api/auth/login').set(CSRF).send({ email: USUARIO_DEMO.email, password: PASSWORD });
    expect(login.status).toBe(200);
    expect(login.body.usuario).toMatchObject({ email_verificado: true, rol: 'ciudadano' });
    const aportes = await agente.get('/api/mis-envios?por_pagina=50');
    expect(aportes.status).toBe(200);
    expect(aportes.body.total).toBe(16);
  });

  test('el panel muestra los pendientes para moderar y el admin puede aprobarlos', async () => {
    await sembrarDemo({ password: PASSWORD });
    const { agente } = await entrarComoAdmin();
    const resumen = await agente.get('/api/admin/resumen');
    expect(resumen.body).toMatchObject({ reportes_pendientes: 4, eventos_pendientes: 4 });

    const pendientes = await agente.get('/api/admin/reportes?estado=pendiente');
    const id = pendientes.body.datos[0].id;
    const aprobar = await agente.post(`/api/admin/reportes/${id}/aprobar`).set(CSRF);
    expect(aprobar.status).toBe(200);
  });

  test('los aprobados y el rechazado quedan revisados por el primer admin, si existe', async () => {
    const { usuario: admin } = await entrarComoAdmin();
    await sembrarDemo({ password: PASSWORD });
    const { rows } = await pool.query(
      "SELECT DISTINCT revisado_por FROM reportes WHERE estado <> 'pendiente'",
    );
    expect(rows).toEqual([{ revisado_por: String(admin.id) }]);
  });

  test('correrlo dos veces, o dos a la vez, no duplica', async () => {
    await sembrarDemo({ password: PASSWORD });
    const otra = await sembrarDemo({ password: PASSWORD });
    expect(otra).toEqual({ usuario: 'existia', ya_cargados: true, reportes: 0, eventos: 0 });
    expect(await contarDemo()).toEqual({ reportes: 8, eventos: 8 });

    await sembrarDemo({ accion: 'borrar' });
    await Promise.all([sembrarDemo({ password: PASSWORD }), sembrarDemo({ password: PASSWORD })]);
    expect(await contarDemo()).toEqual({ reportes: 8, eventos: 8 });
    expect(await contar('SELECT count(*) FROM usuarios WHERE email = $1', [USUARIO_DEMO.email])).toBe(1);
  });

  test('una vez creado el usuario, no hace falta DEMO_PASSWORD y no se cambia la contraseña', async () => {
    await sembrarDemo({ password: PASSWORD });
    const r = await sembrarDemo({ accion: 'reiniciar' });
    expect(r).toMatchObject({ usuario: 'existia', reportes: 8, eventos: 8 });
    const login = await request(app).post('/api/auth/login').set(CSRF)
      .send({ email: USUARIO_DEMO.email, password: PASSWORD });
    expect(login.status).toBe(200);
  });

  test('--reiniciar borra los de ejemplo y los crea de nuevo, con las 24 hs de las alertas desde ahora', async () => {
    await sembrarDemo({ password: PASSWORD });
    await pool.query("UPDATE reportes SET aprobado_en = now() - interval '30 hours' WHERE estado = 'aprobado'");
    expect((await request(app).get('/api/reportes')).body).toHaveLength(0);

    await sembrarDemo({ accion: 'reiniciar', password: PASSWORD });
    expect(await contarDemo()).toEqual({ reportes: 8, eventos: 8 });
    expect((await request(app).get('/api/reportes')).body).toHaveLength(3);
  });

  test('--borrar deja la base como estaba: no toca lugares, usuarios ni envíos reales', async () => {
    const { usuario: real } = await registrarYEntrar();
    const reporteReal = await crearReporte({ usuarioId: real.id, estado: 'aprobado' });
    const antes = {
      lugares: await contar('SELECT count(*) FROM lugares'),
      usuarios: await contar('SELECT count(*) FROM usuarios'),
    };

    await sembrarDemo({ password: PASSWORD });
    // Un vecino real confirma una alerta de ejemplo: la confirmación se va con la alerta.
    const alerta = (await pool.query("SELECT id FROM reportes WHERE estado = 'aprobado' AND usuario_id <> $1 LIMIT 1", [real.id])).rows[0];
    await pool.query('INSERT INTO confirmaciones (reporte_id, usuario_id) VALUES ($1, $2)', [alerta.id, real.id]);

    const r = await sembrarDemo({ accion: 'borrar' });
    expect(r).toEqual({ usuario: 'borrado', reportes: 8, eventos: 8 });
    expect(await contar('SELECT count(*) FROM lugares')).toBe(antes.lugares);
    expect(await contar('SELECT count(*) FROM usuarios')).toBe(antes.usuarios);
    expect(await contar('SELECT count(*) FROM reportes')).toBe(1);
    expect(await contar('SELECT count(*) FROM reportes WHERE id = $1', [reporteReal])).toBe(1);
    expect(await contar('SELECT count(*) FROM eventos')).toBe(0);
    expect(await contar('SELECT count(*) FROM confirmaciones')).toBe(0);

    // Sin datos de ejemplo, --borrar no hace nada.
    expect(await sembrarDemo({ accion: 'borrar' })).toEqual({ usuario: 'no_existia', reportes: 0, eventos: 0 });
  });

  test('sin DEMO_PASSWORD, o con una que no cumple la política, no crea nada', async () => {
    await expect(sembrarDemo()).rejects.toThrow(/DEMO_PASSWORD/);
    await expect(sembrarDemo({ password: 'corta1' })).rejects.toThrow(/DEMO_PASSWORD no sirve/);
    await expect(sembrarDemo({ password: 'sinnumeros' })).rejects.toThrow(/DEMO_PASSWORD no sirve/);
    expect(await contar('SELECT count(*) FROM usuarios')).toBe(0);
    expect(await contar('SELECT count(*) FROM reportes')).toBe(0);
  });

  test('si ese email es de otra cuenta (sin verificar o admin), no la usa ni la borra', async () => {
    // Alguien registró el email: queda sin verificar porque .invalid no recibe correo.
    await registrarYEntrar({ nombre: USUARIO_DEMO.nombre, email: USUARIO_DEMO.email });
    await expect(sembrarDemo({ password: PASSWORD })).rejects.toThrow(/no es la de demostración/);
    await expect(sembrarDemo({ accion: 'borrar' })).rejects.toThrow(/no es la de demostración/);
    expect(await contar('SELECT count(*) FROM usuarios WHERE email = $1', [USUARIO_DEMO.email])).toBe(1);
    expect(await contar('SELECT count(*) FROM reportes')).toBe(0);

    // Y si alguien la hace admin, tampoco.
    await pool.query("UPDATE usuarios SET email_verificado = true, rol = 'admin' WHERE email = $1", [USUARIO_DEMO.email]);
    await expect(sembrarDemo({ accion: 'borrar' })).rejects.toThrow(/no es la de demostración/);
    expect(await contar('SELECT count(*) FROM usuarios')).toBe(1);
  });
});
