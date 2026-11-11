// RNF-01: compresión de las respuestas y encabezados de caché de la API.
const { app, pool, request, CSRF, limpiarBase, registrarYEntrar } = require('./helpers');
const { entrarComoAdmin } = require('./admin-comun');

beforeEach(async () => {
  await limpiarBase();
  await pool.query('DELETE FROM lugares');
  // 20 lugares, como en producción: la lista pasa largo el mínimo de 1 KB para comprimir.
  await pool.query(
    `INSERT INTO lugares (nombre, categoria, descripcion, direccion, lat, lng)
     SELECT 'Lugar ' || n, 'historico', repeat('Una descripción de ejemplo. ', 8), 'Congreso 151', -26.83, -65.2
     FROM generate_series(1, 20) n`,
  );
});
afterAll(async () => {
  await pool.query('DELETE FROM lugares');
  await pool.end();
});

describe('Compresión', () => {
  test('la lista de lugares viaja comprimida si el navegador lo acepta, y el contenido es el mismo', async () => {
    const comprimida = await request(app).get('/api/lugares').set('Accept-Encoding', 'gzip');
    expect(comprimida.status).toBe(200);
    expect(comprimida.headers['content-encoding']).toBe('gzip');
    expect(comprimida.body).toHaveLength(20);

    const sinComprimir = await request(app).get('/api/lugares').set('Accept-Encoding', 'identity');
    expect(sinComprimir.headers['content-encoding']).toBeUndefined();
    expect(sinComprimir.body).toEqual(comprimida.body);
  });

  test('una respuesta chica no se comprime', async () => {
    const res = await request(app).get('/api/salud').set('Accept-Encoding', 'gzip');
    expect(res.headers['content-encoding']).toBeUndefined();
    expect(res.body).toEqual({ ok: true });
  });
});

describe('Encabezados de caché', () => {
  test.each(['/api/lugares', '/api/eventos', '/api/reportes'])(
    '%s se puede guardar pero se revalida siempre (no-cache con ETag)',
    async (ruta) => {
      const res = await request(app).get(ruta);
      expect(res.status).toBe(200);
      expect(res.headers['cache-control']).toBe('no-cache');
      expect(res.headers.etag).toBeDefined();
    },
  );

  test('si la lista no cambió responde 304 sin cuerpo; si cambió, 200 con la lista nueva', async () => {
    const primera = await request(app).get('/api/lugares');
    const igual = await request(app).get('/api/lugares').set('If-None-Match', primera.headers.etag);
    expect(igual.status).toBe(304);
    expect(igual.text).toBe('');

    await pool.query("UPDATE lugares SET activo = false WHERE nombre = 'Lugar 1'");
    const cambiada = await request(app).get('/api/lugares').set('If-None-Match', primera.headers.etag);
    expect(cambiada.status).toBe(200);
    expect(cambiada.body).toHaveLength(19);
  });

  test('los catálogos se guardan 5 minutos', async () => {
    const res = await request(app).get('/api/catalogos');
    expect(res.headers['cache-control']).toBe('public, max-age=300');
  });

  test('lo que depende de la sesión no se guarda: perfil, Mis aportes y panel', async () => {
    const { agente } = await registrarYEntrar();
    for (const ruta of ['/api/auth/me', '/api/mis-envios']) {
      const res = await agente.get(ruta);
      expect(res.status).toBe(200);
      expect(res.headers['cache-control']).toBe('no-store');
    }
    const { agente: admin } = await entrarComoAdmin();
    for (const ruta of ['/api/admin/resumen', '/api/admin/usuarios', '/api/admin/lugares']) {
      const res = await admin.get(ruta);
      expect(res.status).toBe(200);
      expect(res.headers['cache-control']).toBe('no-store');
    }
  });

  test('los errores tampoco se guardan, ni en las rutas públicas ni fuera de /api', async () => {
    const casos = [
      [await request(app).get('/api/auth/me'), 401],
      [await request(app).get('/api/lugares/999999'), 404],
      [await request(app).get('/api/lugares?categoria=inventada'), 400],
      [await request(app).get('/no-existe'), 404],
      [await request(app).post('/api/auth/login').set(CSRF).set('Content-Type', 'application/json').send('{mal'), 400],
    ];
    for (const [res, status] of casos) {
      expect(res.status).toBe(status);
      expect(res.headers['cache-control']).toBe('no-store');
    }
  });

  test('las respuestas con datos de la sesión no se comprimen', async () => {
    const { agente: admin } = await entrarComoAdmin();
    const res = await admin.get('/api/admin/lugares').set('Accept-Encoding', 'gzip');
    expect(res.status).toBe(200);
    expect(res.headers['content-encoding']).toBeUndefined();
  });
});
