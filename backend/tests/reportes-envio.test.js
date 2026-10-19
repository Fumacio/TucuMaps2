// RF-07, RF-09, RF-10: envío de reportes de seguridad (POST /api/reportes).
const { app, pool, request, CSRF, limpiarBase, registrarYEntrar } = require('./helpers');

const datosReporte = (extra = {}) => ({
  tipo: 'riesgo_comunitario',
  descripcion: 'Cuadra entera sin luz desde hace una semana',
  direccion: 'San Martín 1500',
  barrio: 'Centro',
  lat: -26.8301,
  lng: -65.215,
  ...extra,
});

// Ciudadano con sesión y el email verificado.
async function entrarVerificado(extra = {}) {
  const sesion = await registrarYEntrar(extra);
  await pool.query('UPDATE usuarios SET email_verificado = true WHERE id = $1', [sesion.usuario.id]);
  return sesion;
}

const enviar = (agente, datos = datosReporte()) => agente.post('/api/reportes').set(CSRF).send(datos);

// Inserta reportes del usuario con una fecha de alta dada, sin pasar por la API.
async function insertarReportes(usuarioId, cantidad, { estado = 'pendiente', haceHoras = 1 } = {}) {
  for (let i = 0; i < cantidad; i += 1) {
    await pool.query(
      `INSERT INTO reportes (usuario_id, tipo, descripcion, lat, lng, estado, creado_en)
       VALUES ($1, 'robo_asalto', 'Reporte cargado en la prueba', -26.83, -65.2, $2,
               now() - make_interval(hours => $3))`,
      [usuarioId, estado, haceHoras],
    );
  }
}

beforeEach(limpiarBase);
afterAll(() => pool.end());

describe('POST /api/reportes: caso feliz (RF-07)', () => {
  test('crea el reporte pendiente, con su autor, y no aparece en el mapa', async () => {
    const { agente, usuario } = await entrarVerificado();
    const res = await enviar(agente);
    expect(res.status).toBe(201);
    expect(res.body).toEqual({ id: expect.any(Number), estado: 'pendiente' });

    const { rows } = await pool.query('SELECT * FROM reportes WHERE id = $1', [res.body.id]);
    expect(rows[0]).toMatchObject({
      usuario_id: String(usuario.id),
      tipo: 'riesgo_comunitario',
      descripcion: 'Cuadra entera sin luz desde hace una semana',
      direccion: 'San Martín 1500',
      barrio: 'Centro',
      estado: 'pendiente',
      aprobado_en: null,
    });

    const mapa = await request(app).get('/api/reportes');
    expect(mapa.body).toEqual([]);
  });

  test('recorta espacios y guarda como null la dirección y el barrio vacíos o ausentes', async () => {
    const { agente } = await entrarVerificado();
    const res = await enviar(
      agente,
      datosReporte({ descripcion: '   Pozo enorme en la esquina   ', direccion: '  ', barrio: undefined }),
    );
    expect(res.status).toBe(201);
    const { rows } = await pool.query('SELECT descripcion, direccion, barrio FROM reportes');
    expect(rows[0]).toEqual({ descripcion: 'Pozo enorme en la esquina', direccion: null, barrio: null });
  });

  test('ignora los campos que no son del formulario (estado, autor)', async () => {
    const { agente, usuario } = await entrarVerificado();
    const res = await enviar(agente, datosReporte({ estado: 'aprobado', usuario_id: 999, aprobado_en: new Date() }));
    expect(res.status).toBe(201);
    const { rows } = await pool.query('SELECT estado, usuario_id, aprobado_en FROM reportes');
    expect(rows[0]).toEqual({ estado: 'pendiente', usuario_id: String(usuario.id), aprobado_en: null });
  });
});

describe('POST /api/reportes: permisos', () => {
  test('sin sesión responde 401', async () => {
    const res = await request(app).post('/api/reportes').set(CSRF).send(datosReporte());
    expect(res.status).toBe(401);
    expect(res.body.error.codigo).toBe('NO_AUTENTICADO');
  });

  test('sin el encabezado X-Requested-With responde 403 y no guarda nada', async () => {
    const { agente } = await entrarVerificado();
    const res = await agente.post('/api/reportes').send(datosReporte());
    expect(res.status).toBe(403);
    expect(res.body.error.codigo).toBe('SIN_PERMISO');
    const { rows } = await pool.query('SELECT count(*)::int AS n FROM reportes');
    expect(rows[0].n).toBe(0);
  });

  test('RF-03: con el email sin verificar responde 403 EMAIL_NO_VERIFICADO', async () => {
    const { agente } = await registrarYEntrar();
    const res = await enviar(agente);
    expect(res.status).toBe(403);
    expect(res.body.error.codigo).toBe('EMAIL_NO_VERIFICADO');
  });

  test('un administrador no envía reportes: 403 SIN_PERMISO', async () => {
    const { agente, usuario } = await entrarVerificado();
    await pool.query("UPDATE usuarios SET rol = 'admin' WHERE id = $1", [usuario.id]);
    const res = await enviar(agente);
    expect(res.status).toBe(403);
    expect(res.body.error.codigo).toBe('SIN_PERMISO');
  });

  test('RF-16: un usuario bloqueado no puede enviar', async () => {
    const { agente, usuario } = await entrarVerificado();
    await pool.query('UPDATE usuarios SET bloqueado = true WHERE id = $1', [usuario.id]);
    const res = await enviar(agente);
    expect(res.status).toBe(403);
    expect(res.body.error.codigo).toBe('USUARIO_BLOQUEADO');
  });
});

describe('POST /api/reportes: validación (RF-10)', () => {
  test.each([
    ['tipo fuera del catálogo', { tipo: 'otro' }, 'tipo'],
    ['tipo viejo', { tipo: 'arrebato_motochorro' }, 'tipo'],
    ['sin tipo', { tipo: undefined }, 'tipo'],
    ['sin descripción', { descripcion: undefined }, 'descripcion'],
    ['descripción corta', { descripcion: 'Robo' }, 'descripcion'],
    ['descripción solo con espacios', { descripcion: '            ' }, 'descripcion'],
    ['descripción larga', { descripcion: 'a'.repeat(501) }, 'descripcion'],
    ['dirección larga', { direccion: 'a'.repeat(201) }, 'direccion'],
    ['barrio largo', { barrio: 'a'.repeat(81) }, 'barrio'],
    ['latitud fuera de Tucumán', { lat: -34.6 }, 'lat'],
    ['longitud fuera de Tucumán', { lng: -58.4 }, 'lng'],
    ['latitud como texto', { lat: '-26.83' }, 'lat'],
    ['sin ubicación', { lat: undefined, lng: undefined }, 'lat'],
  ])('%s → 400 DATOS_INVALIDOS', async (_caso, cambios, campo) => {
    const { agente } = await entrarVerificado();
    const res = await enviar(agente, datosReporte(cambios));
    expect(res.status).toBe(400);
    expect(res.body.error.codigo).toBe('DATOS_INVALIDOS');
    expect(res.body.error.detalles.map((d) => d.campo)).toContain(campo);
  });

  test('acepta los cuatro tipos del catálogo', async () => {
    const { agente } = await entrarVerificado();
    for (const tipo of ['riesgo_comunitario', 'robo_asalto', 'disturbio', 'accidente_transito']) {
      const res = await enviar(agente, datosReporte({ tipo }));
      expect(res.status).toBe(201);
    }
  });
});

describe('POST /api/reportes: límite diario (RF-09)', () => {
  test('el sexto reporte en 24 horas responde 429 LIMITE_DIARIO con Retry-After', async () => {
    const { agente } = await entrarVerificado();
    for (let i = 0; i < 5; i += 1) {
      const res = await enviar(agente);
      expect(res.status).toBe(201);
    }
    const res = await enviar(agente);
    expect(res.status).toBe(429);
    expect(res.body.error).toEqual({
      codigo: 'LIMITE_DIARIO',
      mensaje: 'Alcanzaste el máximo de 5 reportes en 24 horas. Probá de nuevo más tarde.',
    });
    // El más viejo se envió recién: el cupo se libera en casi 24 horas.
    expect(Number(res.headers['retry-after'])).toBeGreaterThan(23 * 60 * 60);
    const { rows } = await pool.query('SELECT count(*)::int AS n FROM reportes');
    expect(rows[0].n).toBe(5);
  });

  test('los cancelados y los ya revisados también cuentan', async () => {
    const { agente, usuario } = await entrarVerificado();
    await insertarReportes(usuario.id, 3, { estado: 'cancelado' });
    await insertarReportes(usuario.id, 2, { estado: 'rechazado' });
    const res = await enviar(agente);
    expect(res.status).toBe(429);
  });

  test('los de hace más de 24 horas no cuentan, y Retry-After apunta al más viejo de la ventana', async () => {
    const { agente, usuario } = await entrarVerificado();
    await insertarReportes(usuario.id, 5, { haceHoras: 25 });
    expect((await enviar(agente)).status).toBe(201);

    await insertarReportes(usuario.id, 4, { haceHoras: 20 });
    const res = await enviar(agente);
    expect(res.status).toBe(429);
    const retry = Number(res.headers['retry-after']);
    expect(retry).toBeGreaterThan(4 * 60 * 60 - 60);
    expect(retry).toBeLessThanOrEqual(4 * 60 * 60);
  });

  test('con más envíos que el límite, Retry-After espera a que vuelva a haber cupo', async () => {
    // Pasa si se bajó LIMITE_REPORTES_DIA: con 7 en la ventana y límite 5 tienen que vencer
    // los 3 más viejos, así que el cupo se libera cuando cumple 24 horas el tercero.
    const { agente, usuario } = await entrarVerificado();
    await insertarReportes(usuario.id, 1, { haceHoras: 22 });
    await insertarReportes(usuario.id, 1, { haceHoras: 21 });
    await insertarReportes(usuario.id, 1, { haceHoras: 20 });
    await insertarReportes(usuario.id, 4, { haceHoras: 1 });
    const res = await enviar(agente);
    expect(res.status).toBe(429);
    const retry = Number(res.headers['retry-after']);
    expect(retry).toBeGreaterThan(4 * 60 * 60 - 60);
    expect(retry).toBeLessThanOrEqual(4 * 60 * 60);
  });

  test('si lo bloquean mientras su envío espera turno, no se guarda', async () => {
    const { agente, usuario } = await entrarVerificado();
    // Otra transacción tiene tomada la fila del usuario y lo bloquea antes de soltarla.
    const cliente = await pool.connect();
    await cliente.query('BEGIN');
    await cliente.query('SELECT id FROM usuarios WHERE id = $1 FOR UPDATE', [usuario.id]);
    const envio = enviar(agente);
    await new Promise((r) => setTimeout(r, 300));
    await cliente.query('UPDATE usuarios SET bloqueado = true WHERE id = $1', [usuario.id]);
    await cliente.query('COMMIT');
    cliente.release();

    const res = await envio;
    expect(res.status).toBe(403);
    expect(res.body.error.codigo).toBe('USUARIO_BLOQUEADO');
    const { rows } = await pool.query('SELECT count(*)::int AS n FROM reportes');
    expect(rows[0].n).toBe(0);
  });

  test('el límite es de cada usuario', async () => {
    const otro = await entrarVerificado({ email: 'otro@mail.com' });
    await insertarReportes(otro.usuario.id, 5);
    const { agente } = await entrarVerificado();
    expect((await enviar(agente)).status).toBe(201);
  });

  test('envíos simultáneos no pasan el límite', async () => {
    const { agente } = await entrarVerificado();
    const respuestas = await Promise.all(Array.from({ length: 8 }, () => enviar(agente)));
    const estados = respuestas.map((r) => r.status).sort();
    expect(estados).toEqual([201, 201, 201, 201, 201, 429, 429, 429]);
    const { rows } = await pool.query('SELECT count(*)::int AS n FROM reportes');
    expect(rows[0].n).toBe(5);
  });
});
