// RF-07, RF-09, RF-10: propuestas de eventos (POST /api/eventos).
const { app, pool, request, CSRF, limpiarBase, registrarYEntrar } = require('./helpers');

const DIA = 24 * 60 * 60 * 1000;
const enDias = (dias) => new Date(Date.now() + dias * DIA).toISOString();

const datosEvento = (extra = {}) => ({
  nombre: 'Peña en el Parque',
  categoria: 'musica',
  modalidad: 'a_la_gorra',
  descripcion: 'Peña folclórica abierta a toda la familia',
  lugar_nombre: 'Anfiteatro del Parque 9 de Julio',
  direccion: 'Av. Soldati s/n',
  barrio: 'Parque 9 de Julio',
  lat: -26.8317,
  lng: -65.1876,
  inicio: enDias(3),
  fin: enDias(3.2),
  flyer_url: 'https://ejemplo.com/flyer.jpg',
  etiquetas: ['folclore', 'familia'],
  ...extra,
});

async function entrarVerificado(extra = {}) {
  const sesion = await registrarYEntrar(extra);
  await pool.query('UPDATE usuarios SET email_verificado = true WHERE id = $1', [sesion.usuario.id]);
  return sesion;
}

const proponer = (agente, datos = datosEvento()) => agente.post('/api/eventos').set(CSRF).send(datos);

async function crearLugar({ nombre = 'Parque 9 de Julio', activo = true } = {}) {
  const { rows } = await pool.query(
    `INSERT INTO lugares (nombre, categoria, lat, lng, activo)
     VALUES ($1, 'recreativo', -26.8317, -65.1876, $2) RETURNING id`,
    [nombre, activo],
  );
  return Number(rows[0].id);
}

async function insertarPropuestas(usuarioId, cantidad, { estado = 'pendiente', haceHoras = 1 } = {}) {
  for (let i = 0; i < cantidad; i += 1) {
    await pool.query(
      `INSERT INTO eventos (nombre, categoria, modalidad, descripcion, lugar_nombre, direccion, barrio,
         lat, lng, inicio, estado, propuesto_por, creado_en)
       VALUES ('Feria', 'feria', 'gratuita', 'Feria cargada en la prueba', 'Plaza', 'Calle 1', 'Centro',
         -26.83, -65.2, now() + interval '2 days', $2, $1, now() - make_interval(hours => $3))`,
      [usuarioId, estado, haceHoras],
    );
  }
}

const contarEventos = async () => (await pool.query('SELECT count(*)::int AS n FROM eventos')).rows[0].n;

beforeEach(limpiarBase);
afterAll(() => pool.end());

describe('POST /api/eventos: caso feliz (RF-07)', () => {
  test('crea la propuesta pendiente, con su autor, y no aparece en la agenda', async () => {
    const { agente, usuario } = await entrarVerificado();
    const datos = datosEvento();
    const res = await proponer(agente, datos);
    expect(res.status).toBe(201);
    expect(res.body).toEqual({ id: expect.any(Number), estado: 'pendiente' });

    const { rows } = await pool.query('SELECT * FROM eventos WHERE id = $1', [res.body.id]);
    expect(rows[0]).toMatchObject({
      nombre: 'Peña en el Parque',
      categoria: 'musica',
      modalidad: 'a_la_gorra',
      lugar_nombre: 'Anfiteatro del Parque 9 de Julio',
      barrio: 'Parque 9 de Julio',
      lugar_id: null,
      flyer_url: 'https://ejemplo.com/flyer.jpg',
      etiquetas: ['folclore', 'familia'],
      estado: 'pendiente',
      propuesto_por: String(usuario.id),
      revisado_por: null,
    });
    expect(rows[0].inicio.toISOString()).toBe(datos.inicio);
    expect(rows[0].fin.toISOString()).toBe(datos.fin);

    const agenda = await request(app).get('/api/eventos');
    expect(agenda.body).toEqual([]);
  });

  test('fin, flyer y etiquetas son opcionales; las etiquetas repetidas se juntan', async () => {
    const { agente } = await entrarVerificado();
    const sinOpcionales = await proponer(
      agente,
      datosEvento({ fin: undefined, flyer_url: '', etiquetas: undefined }),
    );
    expect(sinOpcionales.status).toBe(201);
    const repetidas = await proponer(agente, datosEvento({ etiquetas: ['folclore', ' folclore ', 'peña'] }));
    expect(repetidas.status).toBe(201);

    const { rows } = await pool.query('SELECT fin, flyer_url, etiquetas FROM eventos ORDER BY id');
    expect(rows[0]).toEqual({ fin: null, flyer_url: null, etiquetas: [] });
    expect(rows[1].etiquetas).toEqual(['folclore', 'peña']);
  });

  test('acepta un lugar del mapa como sede (lugar_id)', async () => {
    const { agente } = await entrarVerificado();
    const parque = await crearLugar();
    const res = await proponer(agente, datosEvento({ lugar_id: parque }));
    expect(res.status).toBe(201);
    const { rows } = await pool.query('SELECT lugar_id FROM eventos');
    expect(rows[0].lugar_id).toBe(String(parque));
  });

  test('ignora los campos que no son del formulario (estado, autor, revisión)', async () => {
    const { agente, usuario } = await entrarVerificado();
    const res = await proponer(agente, datosEvento({ estado: 'aprobado', propuesto_por: 999, revisado_por: 1 }));
    expect(res.status).toBe(201);
    const { rows } = await pool.query('SELECT estado, propuesto_por, revisado_por FROM eventos');
    expect(rows[0]).toEqual({ estado: 'pendiente', propuesto_por: String(usuario.id), revisado_por: null });
  });
});

describe('POST /api/eventos: permisos', () => {
  test('sin sesión responde 401', async () => {
    const res = await request(app).post('/api/eventos').set(CSRF).send(datosEvento());
    expect(res.status).toBe(401);
  });

  test('sin el encabezado X-Requested-With responde 403', async () => {
    const { agente } = await entrarVerificado();
    const res = await agente.post('/api/eventos').send(datosEvento());
    expect(res.status).toBe(403);
    expect(await contarEventos()).toBe(0);
  });

  test('RF-03: con el email sin verificar responde 403 EMAIL_NO_VERIFICADO', async () => {
    const { agente } = await registrarYEntrar();
    const res = await proponer(agente);
    expect(res.status).toBe(403);
    expect(res.body.error.codigo).toBe('EMAIL_NO_VERIFICADO');
  });

  test('un administrador no propone eventos: 403 SIN_PERMISO', async () => {
    const { agente, usuario } = await entrarVerificado();
    await pool.query("UPDATE usuarios SET rol = 'admin' WHERE id = $1", [usuario.id]);
    const res = await proponer(agente);
    expect(res.status).toBe(403);
    expect(res.body.error.codigo).toBe('SIN_PERMISO');
  });

  test('RF-16: un usuario bloqueado no puede proponer', async () => {
    const { agente, usuario } = await entrarVerificado();
    await pool.query('UPDATE usuarios SET bloqueado = true WHERE id = $1', [usuario.id]);
    const res = await proponer(agente);
    expect(res.status).toBe(403);
    expect(res.body.error.codigo).toBe('USUARIO_BLOQUEADO');
  });
});

describe('POST /api/eventos: validación (RF-10)', () => {
  test.each([
    ['nombre corto', { nombre: 'Pe' }, 'nombre'],
    ['nombre largo', { nombre: 'a'.repeat(151) }, 'nombre'],
    ['sin nombre', { nombre: undefined }, 'nombre'],
    ['categoría fuera del catálogo', { categoria: 'cine' }, 'categoria'],
    ['modalidad fuera del catálogo', { modalidad: 'paga' }, 'modalidad'],
    ['descripción corta', { descripcion: 'Peña' }, 'descripcion'],
    ['descripción larga', { descripcion: 'a'.repeat(2001) }, 'descripcion'],
    ['sin nombre del lugar', { lugar_nombre: undefined }, 'lugar_nombre'],
    ['sin dirección', { direccion: '   ' }, 'direccion'],
    ['sin barrio', { barrio: undefined }, 'barrio'],
    ['ubicación fuera de Tucumán', { lat: -34.6 }, 'lat'],
    ['inicio sin zona horaria', { inicio: '2030-11-07T20:00:00' }, 'inicio'],
    ['inicio que no es fecha', { inicio: 'el sábado' }, 'inicio'],
    ['sin inicio', { inicio: undefined }, 'inicio'],
    ['inicio en el pasado', { inicio: enDias(-1), fin: undefined }, 'inicio'],
    ['fin antes del inicio', { fin: enDias(2) }, 'fin'],
    ['fin igual al inicio', { inicio: enDias(3), fin: enDias(3) }, 'fin'],
    ['flyer que no es http', { flyer_url: 'javascript:alert(1)' }, 'flyer_url'],
    ['flyer que no es URL', { flyer_url: 'flyer.jpg' }, 'flyer_url'],
    ['más de 5 etiquetas', { etiquetas: ['a1', 'b2', 'c3', 'd4', 'e5', 'f6'] }, 'etiquetas'],
    ['etiqueta corta', { etiquetas: ['a'] }, 'etiquetas.0'],
    ['etiqueta larga', { etiquetas: ['a'.repeat(31)] }, 'etiquetas.0'],
    ['etiquetas que no son lista', { etiquetas: 'folclore' }, 'etiquetas'],
    ['lugar_id no entero', { lugar_id: 1.5 }, 'lugar_id'],
    ['lugar_id como texto', { lugar_id: '1' }, 'lugar_id'],
  ])('%s → 400 DATOS_INVALIDOS', async (_caso, cambios, campo) => {
    const { agente } = await entrarVerificado();
    const res = await proponer(agente, datosEvento(cambios));
    expect(res.status).toBe(400);
    expect(res.body.error.codigo).toBe('DATOS_INVALIDOS');
    expect(res.body.error.detalles.map((d) => d.campo)).toContain(campo);
    expect(await contarEventos()).toBe(0);
  });

  test.each([
    ['inexistente', async () => 999],
    ['inactivo', async () => crearLugar({ nombre: 'Lugar oculto', activo: false })],
  ])('un lugar_id %s responde 400 y no guarda nada', async (_caso, lugarId) => {
    const { agente } = await entrarVerificado();
    const res = await proponer(agente, datosEvento({ lugar_id: await lugarId() }));
    expect(res.status).toBe(400);
    expect(res.body.error.detalles).toEqual([
      { campo: 'lugar_id', mensaje: 'El lugar no existe o no está en el mapa' },
    ]);
    expect(await contarEventos()).toBe(0);
  });
});

describe('POST /api/eventos: límite diario (RF-09)', () => {
  test('la cuarta propuesta en 24 horas responde 429 LIMITE_DIARIO', async () => {
    const { agente } = await entrarVerificado();
    for (let i = 0; i < 3; i += 1) expect((await proponer(agente)).status).toBe(201);
    const res = await proponer(agente);
    expect(res.status).toBe(429);
    expect(res.body.error).toEqual({
      codigo: 'LIMITE_DIARIO',
      mensaje: 'Alcanzaste el máximo de 3 propuestas de eventos en 24 horas. Probá de nuevo más tarde.',
    });
    expect(Number(res.headers['retry-after'])).toBeGreaterThan(23 * 60 * 60);
    expect(await contarEventos()).toBe(3);
  });

  test('las canceladas cuentan y las de hace más de 24 horas no', async () => {
    const { agente, usuario } = await entrarVerificado();
    await insertarPropuestas(usuario.id, 3, { haceHoras: 25 });
    await insertarPropuestas(usuario.id, 2, { estado: 'cancelado' });
    expect((await proponer(agente)).status).toBe(201);
    expect((await proponer(agente)).status).toBe(429);
  });

  test('los reportes y las propuestas tienen límites separados', async () => {
    const { agente, usuario } = await entrarVerificado();
    for (let i = 0; i < 5; i += 1) {
      await pool.query(
        `INSERT INTO reportes (usuario_id, tipo, descripcion, lat, lng)
         VALUES ($1, 'robo_asalto', 'Reporte cargado en la prueba', -26.83, -65.2)`,
        [usuario.id],
      );
    }
    expect((await proponer(agente)).status).toBe(201);
  });

  test('propuestas simultáneas no pasan el límite', async () => {
    const { agente } = await entrarVerificado();
    const respuestas = await Promise.all(Array.from({ length: 6 }, () => proponer(agente)));
    expect(respuestas.map((r) => r.status).sort()).toEqual([201, 201, 201, 429, 429, 429]);
    expect(await contarEventos()).toBe(3);
  });
});
