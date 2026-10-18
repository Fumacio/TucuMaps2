// RF-13: administración de lugares (alta, edición y desactivación).
const { app, pool, request, CSRF, limpiarBase, registrarYEntrar } = require('./helpers');

const datosLugar = (extra = {}) => ({
  nombre: 'Plaza Independencia',
  categoria: 'historico',
  descripcion: 'Plaza central de la ciudad',
  direccion: '24 de Septiembre y 25 de Mayo',
  barrio: 'Centro',
  imagen_url: 'https://ejemplo.com/plaza.jpg',
  lat: -26.8303,
  lng: -65.2038,
  ...extra,
});

async function entrarComoAdmin() {
  const { agente, usuario } = await registrarYEntrar({ email: 'admin@mail.com' });
  await pool.query("UPDATE usuarios SET rol = 'admin' WHERE id = $1", [usuario.id]);
  return { agente, usuario };
}

async function crearLugar(agente, extra) {
  const res = await agente.post('/api/admin/lugares').set(CSRF).send(datosLugar(extra));
  if (res.status !== 201) throw new Error(`Alta falló: ${res.status} ${JSON.stringify(res.body)}`);
  return res.body;
}

// limpiarBase vacía usuarios en cascada, y con eso también lugares.
beforeEach(limpiarBase);
afterAll(() => pool.end());

describe('Permisos de /api/admin/lugares', () => {
  const rutas = [
    ['get', '/api/admin/lugares'],
    ['post', '/api/admin/lugares'],
    ['put', '/api/admin/lugares/1'],
    ['patch', '/api/admin/lugares/1/activo'],
  ];

  test.each(rutas)('%s %s sin sesión responde 401', async (metodo, ruta) => {
    const res = await request(app)[metodo](ruta).set(CSRF).send(datosLugar());
    expect(res.status).toBe(401);
    expect(res.body.error.codigo).toBe('NO_AUTENTICADO');
  });

  test.each(rutas)('%s %s con un ciudadano responde 403', async (metodo, ruta) => {
    const { agente } = await registrarYEntrar();
    const res = await agente[metodo](ruta).set(CSRF).send(datosLugar());
    expect(res.status).toBe(403);
    expect(res.body.error.codigo).toBe('SIN_PERMISO');
  });

  test.each(rutas.slice(1))(
    '%s %s sin X-Requested-With responde 403 aunque sea admin',
    async (metodo, ruta) => {
      const { agente } = await entrarComoAdmin();
      const res = await agente[metodo](ruta).send(datosLugar());
      expect(res.status).toBe(403);
      expect(res.body.error.codigo).toBe('SIN_PERMISO');
      const { rows } = await pool.query('SELECT count(*)::int AS n FROM lugares');
      expect(rows[0].n).toBe(0);
    },
  );
});

describe('POST /api/admin/lugares', () => {
  test('crea el lugar, registra quién lo creó y aparece en el mapa', async () => {
    const { agente, usuario } = await entrarComoAdmin();
    const res = await agente
      .post('/api/admin/lugares')
      .set(CSRF)
      .send(datosLugar({
        nombre: '  Plaza Independencia  ', horarios: '', precio_entrada: ' Gratuita ', campo_raro: 'x',
      }));
    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({
      nombre: 'Plaza Independencia',
      categoria: 'historico',
      localidad: 'San Miguel de Tucumán',
      horarios: null,
      precio_entrada: 'Gratuita',
      contenido_historico: null,
      lat: -26.8303,
      lng: -65.2038,
      activo: true,
    });
    expect(typeof res.body.id).toBe('number');
    expect(res.body).not.toHaveProperty('campo_raro');
    expect(res.body).not.toHaveProperty('creado_por');

    const { rows } = await pool.query('SELECT creado_por FROM lugares WHERE id = $1', [
      res.body.id,
    ]);
    expect(Number(rows[0].creado_por)).toBe(usuario.id);

    const publico = await request(app).get(`/api/lugares/${res.body.id}`);
    expect(publico.status).toBe(200);
    expect(publico.body.nombre).toBe('Plaza Independencia');
  });

  test('valida cada campo y devuelve los errores en detalles', async () => {
    const { agente } = await entrarComoAdmin();
    const res = await agente
      .post('/api/admin/lugares')
      .set(CSRF)
      .send({
        nombre: 'P',
        categoria: 'shopping',
        imagen_url: 'javascript:alert(1)',
        lat: -30,
        lng: 'oeste',
        barrio: 'x'.repeat(81),
        precio_entrada: 'x'.repeat(201),
      });
    expect(res.status).toBe(400);
    expect(res.body.error.codigo).toBe('DATOS_INVALIDOS');
    const campos = res.body.error.detalles.map((d) => d.campo).sort();
    expect(campos).toEqual(['barrio', 'categoria', 'imagen_url', 'lat', 'lng', 'nombre', 'precio_entrada']);
    const lat = res.body.error.detalles.find((d) => d.campo === 'lat');
    expect(lat.mensaje).toBe('La ubicación debe estar dentro de Tucumán');
  });

  test('un carácter NUL responde 400 y no 500', async () => {
    const { agente } = await entrarComoAdmin();
    const res = await agente
      .post('/api/admin/lugares')
      .set(CSRF)
      .send(datosLugar({ nombre: 'Plaza\u0000', contenido_historico: 'a\u0000b' }));
    expect(res.status).toBe(400);
    expect(res.body.error.detalles.map((d) => d.campo)).toEqual(['nombre', 'contenido_historico']);
  });

  test.each(['ftp://ejemplo.com/a.jpg', 'data:image/png;base64,AAAA', 'ejemplo.com/a.jpg'])(
    'rechaza la imagen %s (solo http/https)',
    async (imagen_url) => {
      const { agente } = await entrarComoAdmin();
      const res = await agente
        .post('/api/admin/lugares')
        .set(CSRF)
        .send(datosLugar({ imagen_url }));
      expect(res.status).toBe(400);
      expect(res.body.error.detalles).toEqual([
        { campo: 'imagen_url', mensaje: expect.stringContaining('http') },
      ]);
    },
  );

  test('un nombre repetido responde 400 con el campo nombre', async () => {
    const { agente } = await entrarComoAdmin();
    await crearLugar(agente);
    const res = await agente.post('/api/admin/lugares').set(CSRF).send(datosLugar());
    expect(res.status).toBe(400);
    expect(res.body.error.detalles).toEqual([
      { campo: 'nombre', mensaje: 'Ya existe un lugar con ese nombre' },
    ]);
  });
});

describe('GET /api/admin/lugares', () => {
  test('lista paginada por nombre, incluidos los inactivos', async () => {
    const { agente } = await entrarComoAdmin();
    const b = await crearLugar(agente, { nombre: 'Bosque' });
    await crearLugar(agente, { nombre: 'Catedral' });
    await crearLugar(agente, { nombre: 'Anfiteatro' });
    await agente.patch(`/api/admin/lugares/${b.id}/activo`).set(CSRF).send({ activo: false });

    const primera = await agente.get('/api/admin/lugares?por_pagina=2');
    expect(primera.status).toBe(200);
    expect(primera.body).toMatchObject({ pagina: 1, por_pagina: 2, total: 3 });
    expect(primera.body.datos.map((l) => [l.nombre, l.activo])).toEqual([
      ['Anfiteatro', true],
      ['Bosque', false],
    ]);
    expect(primera.body.datos[0]).toHaveProperty('contenido_historico');

    const segunda = await agente.get('/api/admin/lugares?pagina=2&por_pagina=2');
    expect(segunda.body.datos.map((l) => l.nombre)).toEqual(['Catedral']);

    const vacia = await agente.get('/api/admin/lugares?pagina=5');
    expect(vacia.body).toMatchObject({ datos: [], pagina: 5, por_pagina: 20, total: 3 });
  });

  test.each(['pagina=0', 'pagina=abc', 'por_pagina=101', 'por_pagina=1e2'])(
    '?%s responde 400',
    async (query) => {
      const { agente } = await entrarComoAdmin();
      const res = await agente.get(`/api/admin/lugares?${query}`);
      expect(res.status).toBe(400);
      expect(res.body.error.codigo).toBe('DATOS_INVALIDOS');
    },
  );
});

describe('PUT /api/admin/lugares/:id', () => {
  test('reemplaza los datos; un opcional que no se manda queda vacío', async () => {
    const { agente } = await entrarComoAdmin();
    const lugar = await crearLugar(agente);
    await pool.query("UPDATE lugares SET actualizado_en = now() - interval '1 day'");
    const { imagen_url, barrio, ...sinOpcionales } = datosLugar(); // eslint-disable-line no-unused-vars
    const res = await agente
      .put(`/api/admin/lugares/${lugar.id}`)
      .set(CSRF)
      .send({ ...sinOpcionales, nombre: 'Plaza Independencia (centro)', categoria: 'recreativo' });
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      id: lugar.id,
      nombre: 'Plaza Independencia (centro)',
      categoria: 'recreativo',
      imagen_url: null,
      barrio: null,
      activo: true,
    });
    expect(Date.now() - new Date(res.body.actualizado_en)).toBeLessThan(60 * 1000);

    const publico = await request(app).get(`/api/lugares/${lugar.id}`);
    expect(publico.body.categoria).toBe('recreativo');
  });

  test('valida igual que el alta', async () => {
    const { agente } = await entrarComoAdmin();
    const lugar = await crearLugar(agente);
    const res = await agente
      .put(`/api/admin/lugares/${lugar.id}`)
      .set(CSRF)
      .send(datosLugar({ lng: -70 }));
    expect(res.status).toBe(400);
    expect(res.body.error.detalles.map((d) => d.campo)).toEqual(['lng']);
  });

  test('no permite tomar el nombre de otro lugar', async () => {
    const { agente } = await entrarComoAdmin();
    await crearLugar(agente);
    const otro = await crearLugar(agente, { nombre: 'Catedral' });
    const res = await agente.put(`/api/admin/lugares/${otro.id}`).set(CSRF).send(datosLugar());
    expect(res.status).toBe(400);
    expect(res.body.error.detalles[0].campo).toBe('nombre');
  });

  test('id inexistente responde 404 e id inválido 400', async () => {
    const { agente } = await entrarComoAdmin();
    const inexistente = await agente.put('/api/admin/lugares/999').set(CSRF).send(datosLugar());
    expect(inexistente.status).toBe(404);
    expect(inexistente.body.error.codigo).toBe('NO_ENCONTRADO');
    const invalido = await agente.put('/api/admin/lugares/abc').set(CSRF).send(datosLugar());
    expect(invalido.status).toBe(400);
  });
});

describe('PATCH /api/admin/lugares/:id/activo', () => {
  test('desactivado deja de salir en el mapa y vuelve al reactivarlo', async () => {
    const { agente } = await entrarComoAdmin();
    const lugar = await crearLugar(agente);

    const off = await agente
      .patch(`/api/admin/lugares/${lugar.id}/activo`)
      .set(CSRF)
      .send({ activo: false });
    expect(off.status).toBe(200);
    expect(off.body.activo).toBe(false);
    expect((await request(app).get('/api/lugares')).body).toEqual([]);
    expect((await request(app).get(`/api/lugares/${lugar.id}`)).status).toBe(404);

    const on = await agente
      .patch(`/api/admin/lugares/${lugar.id}/activo`)
      .set(CSRF)
      .send({ activo: true });
    expect(on.body.activo).toBe(true);
    const lista = await request(app).get('/api/lugares');
    expect(lista.body.map((l) => l.id)).toEqual([lugar.id]);
  });

  test.each([{}, { activo: 'false' }, { activo: 0 }])('cuerpo %j responde 400', async (cuerpo) => {
    const { agente } = await entrarComoAdmin();
    const lugar = await crearLugar(agente);
    const res = await agente.patch(`/api/admin/lugares/${lugar.id}/activo`).set(CSRF).send(cuerpo);
    expect(res.status).toBe(400);
    expect(res.body.error.detalles[0].campo).toBe('activo');
  });

  test('id inexistente responde 404', async () => {
    const { agente } = await entrarComoAdmin();
    const res = await agente
      .patch('/api/admin/lugares/999/activo')
      .set(CSRF)
      .send({ activo: false });
    expect(res.status).toBe(404);
  });
});
