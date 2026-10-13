// RF-02: API pública de lugares.
const { app, pool, request } = require('./helpers');

async function crearLugar(datos = {}) {
  const lugar = {
    nombre: 'Casa Histórica de la Independencia',
    categoria: 'historico',
    descripcion: 'Donde se declaró la Independencia en 1816.',
    contenido_historico: 'El 9 de julio de 1816 el Congreso de Tucumán declaró la independencia.',
    fuente: 'Museo Casa Histórica',
    direccion: 'Congreso 151',
    lat: -26.8326,
    lng: -65.2038,
    activo: true,
    ...datos,
  };
  const { rows } = await pool.query(
    `INSERT INTO lugares (nombre, categoria, descripcion, contenido_historico, fuente, direccion, lat, lng, activo)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING id`,
    [lugar.nombre, lugar.categoria, lugar.descripcion, lugar.contenido_historico, lugar.fuente,
      lugar.direccion, lugar.lat, lugar.lng, lugar.activo],
  );
  return Number(rows[0].id);
}

beforeEach(() => pool.query('TRUNCATE lugares RESTART IDENTITY CASCADE'));
afterAll(() => pool.end());

describe('GET /api/lugares (RF-02)', () => {
  test('es público y devuelve solo los activos, ordenados por nombre y con coordenadas numéricas', async () => {
    await crearLugar({ nombre: 'Parque 9 de Julio', categoria: 'recreativo', lat: -26.8317, lng: -65.1876 });
    await crearLugar();
    await crearLugar({ nombre: 'Lugar oculto', activo: false });

    const res = await request(app).get('/api/lugares');
    expect(res.status).toBe(200);
    expect(res.body.map((l) => l.nombre)).toEqual(['Casa Histórica de la Independencia', 'Parque 9 de Julio']);
    const [casa] = res.body;
    expect(casa).toMatchObject({ id: 2, categoria: 'historico', lat: -26.8326, lng: -65.2038 });
    expect(casa).not.toHaveProperty('contenido_historico'); // solo en el detalle
    expect(casa).not.toHaveProperty('activo');
  });

  test('?categoria= filtra', async () => {
    await crearLugar();
    await crearLugar({ nombre: 'Parque 9 de Julio', categoria: 'recreativo' });
    const res = await request(app).get('/api/lugares?categoria=recreativo');
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].nombre).toBe('Parque 9 de Julio');
  });

  test('una categoría fuera del catálogo responde 400 con detalles', async () => {
    const res = await request(app).get('/api/lugares?categoria=gastronomia');
    expect(res.status).toBe(400);
    expect(res.body.error.codigo).toBe('DATOS_INVALIDOS');
    expect(res.body.error.detalles[0].campo).toBe('categoria');
  });

  test('sin lugares devuelve una lista vacía', async () => {
    const res = await request(app).get('/api/lugares');
    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });
});

describe('GET /api/lugares/:id (RF-02)', () => {
  test('devuelve el detalle con el contenido histórico', async () => {
    const id = await crearLugar();
    const res = await request(app).get(`/api/lugares/${id}`);
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      id,
      nombre: 'Casa Histórica de la Independencia',
      contenido_historico: expect.stringContaining('1816'),
      fuente: 'Museo Casa Histórica',
      lat: -26.8326,
    });
  });

  test('un lugar inactivo responde 404, igual que uno inexistente', async () => {
    const id = await crearLugar({ activo: false });
    const inactivo = await request(app).get(`/api/lugares/${id}`);
    const inexistente = await request(app).get('/api/lugares/999');
    expect(inactivo.status).toBe(404);
    expect(inexistente.status).toBe(404);
    expect(inactivo.body).toEqual(inexistente.body);
    expect(inactivo.body.error.codigo).toBe('NO_ENCONTRADO');
  });

  test.each(['abc', '1.5', '0', '-3', '99999999999999999999'])('un id mal formado (%s) responde 400', async (id) => {
    const res = await request(app).get(`/api/lugares/${id}`);
    expect(res.status).toBe(400);
    expect(res.body.error.codigo).toBe('DATOS_INVALIDOS');
  });
});
