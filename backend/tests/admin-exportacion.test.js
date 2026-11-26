// RF-26: exportación del panel a Excel (GET /api/admin/exportacion).
const ExcelJS = require('exceljs');
const { pool, request, app, limpiarBase, registrarYEntrar } = require('./helpers');
const { reiniciarLimiteExportacion } = require('../src/middlewares/limites');
const { entrarComoAdmin, crearCiudadano, crearReporte, crearEvento } = require('./admin-comun');

beforeEach(limpiarBase);
beforeEach(reiniciarLimiteExportacion);
afterAll(() => pool.end());

const TIPO_XLSX = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

// supertest junta el cuerpo binario en un Buffer.
const comoBinario = (res, callback) => {
  const partes = [];
  res.on('data', (parte) => partes.push(parte));
  res.on('end', () => callback(null, Buffer.concat(partes)));
};

const exportar = (agente, query = '') =>
  agente.get(`/api/admin/exportacion${query}`).buffer(true).parse(comoBinario);

async function leerLibro(res) {
  const libro = new ExcelJS.Workbook();
  await libro.xlsx.load(res.body);
  return libro;
}

// Filas de datos de una hoja como objetos { encabezado: valor }.
function filas(hoja) {
  const titulos = hoja.getRow(1).values.slice(1);
  const resultado = [];
  hoja.eachRow((fila, numero) => {
    if (numero === 1) return;
    const valores = fila.values.slice(1);
    resultado.push(Object.fromEntries(titulos.map((t, i) => [t, valores[i] ?? null])));
  });
  return resultado;
}

// Fila del Resumen por su primera columna.
const filaResumen = (hoja, titulo) => {
  let encontrada = null;
  hoja.eachRow((fila) => {
    if (fila.getCell(1).value === titulo) encontrada = fila.getCell(2).value;
  });
  return encontrada;
};

async function crearLugar({ nombre = 'Casa Histórica', activo = true } = {}) {
  const { rows } = await pool.query(
    `INSERT INTO lugares (nombre, categoria, descripcion, barrio, lat, lng, activo)
     VALUES ($1, 'historico', 'Donde se declaró la Independencia', 'Centro', -26.8303, -65.2038, $2)
     RETURNING id`,
    [nombre, activo],
  );
  return Number(rows[0].id);
}

describe('GET /api/admin/exportacion', () => {
  test('descarga un .xlsx con Resumen, Lugares, Reportes de seguridad y Eventos', async () => {
    await crearLugar();
    await crearLugar({ nombre: 'Parque 9 de Julio', activo: false });
    const autorId = await crearCiudadano();
    await crearReporte({ usuarioId: autorId, estado: 'aprobado' });
    await crearReporte({ usuarioId: autorId });
    await crearEvento({ usuarioId: autorId, estado: 'aprobado' });
    const { agente } = await entrarComoAdmin();

    const res = await exportar(agente);
    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toBe(TIPO_XLSX);
    expect(res.headers['content-disposition']).toMatch(/^attachment; filename="?TucuMaps-exportacion-\d{4}-\d{2}-\d{2}\.xlsx"?$/);
    expect(res.headers['cache-control']).toBe('no-store');

    const libro = await leerLibro(res);
    expect(libro.worksheets.map((h) => h.name)).toEqual(['Resumen', 'Lugares', 'Reportes de seguridad', 'Eventos']);

    const lugares = filas(libro.getWorksheet('Lugares'));
    expect(lugares.map((l) => l.Nombre)).toEqual(['Casa Histórica', 'Parque 9 de Julio']);
    expect(lugares[0]).toMatchObject({ Categoría: 'Histórico', 'Activo en el mapa': 'Sí', Latitud: -26.8303 });
    expect(lugares[1]['Activo en el mapa']).toBe('No');

    const reportes = filas(libro.getWorksheet('Reportes de seguridad'));
    expect(reportes).toHaveLength(2);
    expect(reportes[0]).toMatchObject({
      Tipo: 'Robos, asaltos y entraderas',
      Estado: 'Aprobado',
      'Visible en el mapa': 'Sí',
      Barrio: 'Barrio Norte',
      Confirmaciones: 0,
    });
    expect(reportes[0].Enviado).toBeInstanceOf(Date);

    const eventos = filas(libro.getWorksheet('Eventos'));
    expect(eventos).toHaveLength(1);
    expect(eventos[0]).toMatchObject({
      Nombre: 'Peña en el Parque',
      Categoría: 'Música',
      Modalidad: 'A la gorra',
      Estado: 'Aprobado',
      'En la agenda': 'Sí',
      Etiquetas: 'folclore',
    });

    const resumen = libro.getWorksheet('Resumen');
    expect(filaResumen(resumen, 'Generado por')).toBe('Admin Uno');
    expect(filaResumen(resumen, 'Período')).toBe('Todo el historial');
    expect(filaResumen(resumen, 'Lugares')).toBe(2);
    expect(filaResumen(resumen, 'Reportes de seguridad')).toBe(2);
    expect(filaResumen(resumen, '   Pendiente')).toBe(1);
    expect(filaResumen(resumen, 'Eventos')).toBe(1);
  });

  test('encabezado con formato: negrita, fila fija y filtros', async () => {
    const { agente } = await entrarComoAdmin();
    const hoja = (await leerLibro(await exportar(agente))).getWorksheet('Reportes de seguridad');
    expect(hoja.getRow(1).font.bold).toBe(true);
    expect(hoja.views[0]).toMatchObject({ state: 'frozen', ySplit: 1 });
    expect(hoja.autoFilter).toBeTruthy();
    expect(hoja.getColumn(5).width).toBe(60); // Descripción
  });

  test('las fechas salen en hora de Tucumán (UTC-3)', async () => {
    const autorId = await crearCiudadano();
    await crearReporte({ usuarioId: autorId, creadoEn: new Date('2026-11-20T23:30:00Z') });
    const { agente } = await entrarComoAdmin();
    const [reporte] = filas((await leerLibro(await exportar(agente))).getWorksheet('Reportes de seguridad'));
    // Excel no tiene zona: la celda guarda 20:30 del 20/11, como se ve en Tucumán.
    expect(reporte.Enviado.toISOString()).toBe('2026-11-20T20:30:00.000Z');
  });

  test('nunca exporta el autor de un reporte o un evento, ni emails ni contraseñas (RNF-07)', async () => {
    const autorId = await crearCiudadano({ nombre: 'Vecina Secreta', email: 'vecina@mail.com' });
    await crearReporte({ usuarioId: autorId });
    await crearEvento({ usuarioId: autorId });
    const { agente } = await entrarComoAdmin();
    const libro = await leerLibro(await exportar(agente));
    const texto = JSON.stringify(libro.worksheets.map((h) => h.getSheetValues()));
    expect(texto).not.toContain('Vecina Secreta');
    expect(texto).not.toContain('@mail.com');
    expect(texto).not.toContain('password');
  });

  test('registra quién moderó y el motivo de rechazo', async () => {
    const autorId = await crearCiudadano();
    const id = await crearReporte({ usuarioId: autorId });
    const { agente, usuario } = await entrarComoAdmin();
    await pool.query(
      `UPDATE reportes SET estado = 'rechazado', motivo_rechazo = 'No se pudo verificar', revisado_por = $2, revisado_en = now()
       WHERE id = $1`,
      [id, usuario.id],
    );
    const [reporte] = filas((await leerLibro(await exportar(agente))).getWorksheet('Reportes de seguridad'));
    expect(reporte).toMatchObject({ Estado: 'Rechazado', 'Revisado por': 'Admin Uno', 'Motivo de rechazo': 'No se pudo verificar' });
  });

  test('un reporte o evento rechazado o cancelado sale sin su descripción', async () => {
    const autorId = await crearCiudadano();
    await crearReporte({ usuarioId: autorId, estado: 'cancelado' });
    await crearEvento({ usuarioId: autorId, estado: 'rechazado' });
    const { agente } = await entrarComoAdmin();
    const libro = await leerLibro(await exportar(agente));
    const [reporte] = filas(libro.getWorksheet('Reportes de seguridad'));
    const [evento] = filas(libro.getWorksheet('Eventos'));
    expect(reporte).toMatchObject({ Estado: 'Cancelado', Descripción: '(no se exporta: no se publicó)', Barrio: 'Barrio Norte' });
    expect(evento).toMatchObject({ Estado: 'Rechazado', Descripción: '(no se exporta: no se publicó)' });
    expect(JSON.stringify(libro.worksheets.map((h) => h.getSheetValues()))).not.toContain('Arrebatos');
  });

  test('un filtro mal escrito no gasta el cupo de exportaciones', async () => {
    const { agente } = await entrarComoAdmin();
    for (let i = 0; i < 12; i += 1) expect((await agente.get('/api/admin/exportacion?desde=x')).status).toBe(400);
    expect((await exportar(agente, '?hojas=lugares')).status).toBe(200);
  });

  test('un texto que empieza con "=" queda como texto, no como fórmula', async () => {
    const autorId = await crearCiudadano();
    const id = await crearReporte({ usuarioId: autorId });
    await pool.query("UPDATE reportes SET descripcion = '=HYPERLINK(\"http://malo.example\",\"clic\")' WHERE id = $1", [id]);
    const { agente } = await entrarComoAdmin();
    const hoja = (await leerLibro(await exportar(agente))).getWorksheet('Reportes de seguridad');
    const celda = hoja.getRow(2).getCell(5);
    expect(celda.type).toBe(ExcelJS.ValueType.String);
    expect(celda.value).toBe('=HYPERLINK("http://malo.example","clic")');
  });

  test('?hojas= elige qué hojas van, sin repetir', async () => {
    const { agente } = await entrarComoAdmin();
    const libro = await leerLibro(await exportar(agente, '?hojas=eventos,lugares,eventos'));
    expect(libro.worksheets.map((h) => h.name)).toEqual(['Resumen', 'Lugares', 'Eventos']);
    expect(filaResumen(libro.getWorksheet('Resumen'), 'Reportes de seguridad')).toBeNull();
  });

  test('desde y hasta filtran reportes por envío y eventos por inicio; los lugares van todos', async () => {
    await crearLugar();
    const autorId = await crearCiudadano();
    await crearReporte({ usuarioId: autorId, creadoEn: new Date('2026-11-10T15:00:00Z') });
    await crearReporte({ usuarioId: autorId, creadoEn: new Date('2026-11-20T15:00:00Z') });
    // Creado hace poco pero empieza el 12/11: entra por su inicio.
    await crearEvento({ usuarioId: autorId, inicio: new Date('2026-11-12T23:00:00Z') });
    await crearEvento({ usuarioId: autorId, inicio: new Date('2026-12-01T23:00:00Z') });
    const { agente } = await entrarComoAdmin();

    const libro = await leerLibro(await exportar(agente, '?desde=2026-11-01&hasta=2026-11-15'));
    expect(filas(libro.getWorksheet('Reportes de seguridad'))).toHaveLength(1);
    const eventos = filas(libro.getWorksheet('Eventos'));
    expect(eventos).toHaveLength(1);
    expect(eventos[0].Inicio.toISOString()).toBe('2026-11-12T20:00:00.000Z');
    expect(filas(libro.getWorksheet('Lugares'))).toHaveLength(1);
    expect(filaResumen(libro.getWorksheet('Resumen'), 'Período')).toBe('Del 2026-11-01 al 2026-11-15');
  });

  test('"hasta" incluye el día entero en hora de Tucumán', async () => {
    const autorId = await crearCiudadano();
    // 15/11 a las 23:30 en Tucumán = 16/11 02:30 UTC.
    await crearReporte({ usuarioId: autorId, creadoEn: new Date('2026-11-16T02:30:00Z') });
    const { agente } = await entrarComoAdmin();
    const libro = await leerLibro(await exportar(agente, '?hasta=2026-11-15'));
    expect(filas(libro.getWorksheet('Reportes de seguridad'))).toHaveLength(1);
    expect(filaResumen(libro.getWorksheet('Resumen'), 'Período')).toBe('Hasta el 2026-11-15');
  });

  test('una base vacía exporta las hojas solo con encabezados', async () => {
    const { agente } = await entrarComoAdmin();
    const libro = await leerLibro(await exportar(agente));
    expect(filas(libro.getWorksheet('Eventos'))).toEqual([]);
    expect(filaResumen(libro.getWorksheet('Resumen'), 'Eventos')).toBe(0);
  });

  describe('validación', () => {
    test.each([
      ['?hojas=usuarios', 'hojas'],
      ['?hojas=,,', 'hojas'],
      ['?desde=ayer', 'desde'],
      ['?desde=2026-11-20&hasta=2026-11-01', 'hasta'],
    ])('%s responde 400', async (query, campo) => {
      const { agente } = await entrarComoAdmin();
      const res = await agente.get(`/api/admin/exportacion${query}`);
      expect(res.status).toBe(400);
      expect(res.body.error.codigo).toBe('DATOS_INVALIDOS');
      expect(res.body.error.detalles.map((d) => d.campo)).toContain(campo);
    });

    test('un filtro vacío equivale a no mandarlo', async () => {
      const { agente } = await entrarComoAdmin();
      const libro = await leerLibro(await exportar(agente, '?hojas=&desde=&hasta='));
      expect(libro.worksheets).toHaveLength(4);
    });
  });

  describe('permisos', () => {
    test('sin sesión responde 401', async () => {
      const res = await request(app).get('/api/admin/exportacion');
      expect(res.status).toBe(401);
      expect(res.body.error.codigo).toBe('NO_AUTENTICADO');
    });

    test('un ciudadano recibe 403 y no se genera nada', async () => {
      const { agente } = await registrarYEntrar();
      const res = await agente.get('/api/admin/exportacion');
      expect(res.status).toBe(403);
      expect(res.body.error.codigo).toBe('SIN_PERMISO');
      expect(res.headers['content-type']).toMatch(/json/);
    });
  });

  test('más de 10 exportaciones en 15 minutos por admin responde 429', async () => {
    const { agente } = await entrarComoAdmin();
    for (let i = 0; i < 10; i += 1) {
      expect((await agente.get('/api/admin/exportacion?hojas=lugares')).status).toBe(200);
    }
    const res = await agente.get('/api/admin/exportacion?hojas=lugares');
    expect(res.status).toBe(429);
    expect(res.body.error.codigo).toBe('DEMASIADOS_INTENTOS');
    expect(res.headers['retry-after']).toBeDefined();
  });
});
