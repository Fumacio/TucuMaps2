// RF-02, RF-12: API pública de eventos.
const { app, pool, request, limpiarBase, registrarYEntrar } = require('./helpers');

const HORA = 60 * 60 * 1000;
const enHoras = (horas) => new Date(Date.now() + horas * HORA);

async function crearEvento(datos = {}) {
  const evento = {
    nombre: 'Peña en el Parque',
    categoria: 'musica',
    estado: 'aprobado',
    inicio: enHoras(48),
    fin: null,
    propuesto_por: null,
    ...datos,
  };
  const { rows } = await pool.query(
    `INSERT INTO eventos (nombre, categoria, modalidad, descripcion, lugar_nombre, direccion, barrio,
       lat, lng, inicio, fin, etiquetas, estado, propuesto_por)
     VALUES ($1, $2, 'a_la_gorra', 'Peña folclórica abierta', 'Anfiteatro del Parque 9 de Julio',
       'Av. Soldati s/n', 'Parque 9 de Julio', -26.8317, -65.1876, $3, $4, '{folclore,familia}', $5, $6)
     RETURNING id`,
    [evento.nombre, evento.categoria, evento.inicio, evento.fin, evento.estado, evento.propuesto_por],
  );
  return Number(rows[0].id);
}

// limpiarBase vacía usuarios en cascada, y con eso también eventos.
beforeEach(limpiarBase);
afterAll(() => pool.end());

describe('GET /api/eventos (RF-02, RF-12)', () => {
  test('es público y devuelve los vigentes ordenados por inicio, sin el autor', async () => {
    const { usuario } = await registrarYEntrar();
    await crearEvento({ nombre: 'Feria del sábado', categoria: 'feria', inicio: enHoras(72) });
    const penaId = await crearEvento({ propuesto_por: usuario.id });

    const res = await request(app).get('/api/eventos');
    expect(res.status).toBe(200);
    expect(res.body.map((e) => e.nombre)).toEqual(['Peña en el Parque', 'Feria del sábado']);
    const [pena] = res.body;
    expect(pena).toMatchObject({
      id: penaId,
      categoria: 'musica',
      modalidad: 'a_la_gorra',
      lat: -26.8317,
      lng: -65.1876,
      fin: null,
      etiquetas: ['folclore', 'familia'],
    });
    expect(new Date(pena.inicio).toISOString()).toBe(pena.inicio);
    expect(pena).not.toHaveProperty('propuesto_por');
    expect(pena).not.toHaveProperty('estado');
    expect(pena).not.toHaveProperty('ia_veredicto');
  });

  test.each(['pendiente', 'rechazado', 'cancelado', 'retirado'])(
    'un evento %s nunca aparece (RF-08)',
    async (estado) => {
      await crearEvento({ estado });
      const res = await request(app).get('/api/eventos');
      expect(res.body).toEqual([]);
    },
  );

  test('RF-12: deja de aparecer 24 hs después de su fin', async () => {
    await crearEvento({ nombre: 'Terminó hace 23 hs', inicio: enHoras(-26), fin: enHoras(-23) });
    await crearEvento({ nombre: 'Terminó hace 25 hs', inicio: enHoras(-28), fin: enHoras(-25) });
    const res = await request(app).get('/api/eventos');
    expect(res.body.map((e) => e.nombre)).toEqual(['Terminó hace 23 hs']);
  });

  test('RF-12: sin fin, deja de aparecer 24 hs después de su inicio', async () => {
    await crearEvento({ nombre: 'Empezó hace 23 hs', inicio: enHoras(-23) });
    await crearEvento({ nombre: 'Empezó hace 25 hs', inicio: enHoras(-25) });
    const res = await request(app).get('/api/eventos');
    expect(res.body.map((e) => e.nombre)).toEqual(['Empezó hace 23 hs']);
  });

  test('?categoria= filtra y vacío equivale a sin filtro', async () => {
    await crearEvento();
    await crearEvento({ nombre: 'Feria del sábado', categoria: 'feria' });
    const filtrado = await request(app).get('/api/eventos?categoria=feria');
    expect(filtrado.body.map((e) => e.nombre)).toEqual(['Feria del sábado']);
    const vacio = await request(app).get('/api/eventos?categoria=');
    expect(vacio.body).toHaveLength(2);
  });

  describe('filtro por fechas', () => {
    // Alrededor del sábado 7/11/2030, en hora de Tucumán.
    beforeEach(async () => {
      await crearEvento({ nombre: 'Viernes', inicio: new Date('2030-11-06T21:00:00-03:00') });
      await crearEvento({
        nombre: 'Peña del sábado',
        inicio: new Date('2030-11-07T20:00:00-03:00'),
        fin: new Date('2030-11-07T23:30:00-03:00'),
      });
      await crearEvento({
        nombre: 'Feria de tres días',
        inicio: new Date('2030-11-06T10:00:00-03:00'),
        fin: new Date('2030-11-08T20:00:00-03:00'),
      });
      await crearEvento({ nombre: 'Domingo', inicio: new Date('2030-11-08T00:00:00-03:00') });
    });

    const nombres = (res) => res.body.map((e) => e.nombre);

    test('un día suelto abarca ese día entero en hora de Tucumán, con lo que lo atraviesa', async () => {
      const res = await request(app).get('/api/eventos?desde=2030-11-07&hasta=2030-11-07');
      expect(res.status).toBe(200);
      expect(nombres(res)).toEqual(['Feria de tres días', 'Peña del sábado']);
    });

    test('acepta fecha y hora con zona', async () => {
      const res = await request(app)
        .get('/api/eventos')
        .query({ desde: '2030-11-07T22:00:00-03:00', hasta: '2030-11-08T02:59:00Z' });
      expect(res.status).toBe(200);
      expect(nombres(res)).toEqual(['Feria de tres días', 'Peña del sábado']);
    });

    test('solo desde, o solo hasta', async () => {
      const desde = await request(app).get('/api/eventos?desde=2030-11-08');
      expect(nombres(desde)).toEqual(['Feria de tres días', 'Domingo']);
      const hasta = await request(app).get('/api/eventos?hasta=2030-11-06');
      expect(nombres(hasta)).toEqual(['Feria de tres días', 'Viernes']);
    });

    test('?desde= y ?hasta= vacíos equivalen a sin filtro', async () => {
      const res = await request(app).get('/api/eventos?desde=&hasta=');
      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(4);
    });
  });

  test.each([
    ['categoria=deportes', 'categoria'],
    ['desde=manana', 'desde'],
    ['desde=2030-13-01', 'desde'],
    ['hasta=2030-11-07T20:00:00', 'hasta'], // sin zona horaria
    ['desde=2030-11-08&hasta=2030-11-07', 'hasta'],
  ])('?%s responde 400 con detalles', async (query, campo) => {
    const res = await request(app).get(`/api/eventos?${query}`);
    expect(res.status).toBe(400);
    expect(res.body.error.codigo).toBe('DATOS_INVALIDOS');
    expect(res.body.error.detalles[0].campo).toBe(campo);
  });

  test('sin eventos devuelve una lista vacía', async () => {
    const res = await request(app).get('/api/eventos');
    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });
});

describe('GET /api/eventos/:id (RF-02)', () => {
  test('devuelve el detalle de un evento vigente, sin el autor', async () => {
    const { usuario } = await registrarYEntrar();
    const id = await crearEvento({ propuesto_por: usuario.id });
    const res = await request(app).get(`/api/eventos/${id}`);
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ id, nombre: 'Peña en el Parque', descripcion: 'Peña folclórica abierta' });
    expect(res.body).not.toHaveProperty('propuesto_por');
  });

  test('uno no aprobado, archivado o inexistente responde el mismo 404', async () => {
    const pendiente = await crearEvento({ estado: 'pendiente' });
    const archivado = await crearEvento({ inicio: enHoras(-25) });
    const respuestas = await Promise.all(
      [pendiente, archivado, 999].map((id) => request(app).get(`/api/eventos/${id}`)),
    );
    for (const res of respuestas) {
      expect(res.status).toBe(404);
      expect(res.body).toEqual(respuestas[2].body);
    }
    expect(respuestas[2].body.error.codigo).toBe('NO_ENCONTRADO');
  });

  test.each(['abc', '0', '007', '99999999999999999999'])('un id mal formado (%s) responde 400', async (id) => {
    const res = await request(app).get(`/api/eventos/${id}`);
    expect(res.status).toBe(400);
    expect(res.body.error.codigo).toBe('DATOS_INVALIDOS');
  });
});
