// Datos y pruebas compartidas de los envíos del ciudadano (#44). No es un archivo de pruebas:
// lo usan edicion-reportes, edicion-eventos y mis-envios. Van en archivos separados porque
// cada archivo tiene su propio límite general de 100 solicitudes por minuto.
const { app, pool, request, CSRF, limpiarBase, registrarYEntrar } = require('./helpers');

const DIA = 24 * 60 * 60 * 1000;
const enDias = (dias) => new Date(Date.now() + dias * DIA).toISOString();

const datosReporte = (extra = {}) => ({
  tipo: 'riesgo_comunitario',
  descripcion: 'Cuadra entera sin luz desde hace una semana',
  direccion: 'San Martín 1500',
  barrio: 'Centro',
  lat: -26.8301,
  lng: -65.215,
  ...extra,
});

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

// Cada clase de envío con su ruta, sus datos de prueba y un cambio válido para editarla.
const CLASES = [
  {
    clase: 'reporte',
    tabla: 'reportes',
    ruta: '/api/reportes',
    datos: datosReporte,
    cambio: { tipo: 'disturbio', descripcion: 'Discusión fuerte en la esquina', barrio: 'Sur' },
    estadosFinales: ['aprobado', 'rechazado', 'resuelto', 'retirado', 'cancelado'],
  },
  {
    clase: 'evento',
    tabla: 'eventos',
    ruta: '/api/eventos',
    datos: datosEvento,
    cambio: { nombre: 'Peña de primavera', modalidad: 'gratuita', etiquetas: ['primavera'] },
    estadosFinales: ['aprobado', 'rechazado', 'retirado', 'cancelado'],
  },
];

async function entrarVerificado(extra = {}) {
  const sesion = await registrarYEntrar(extra);
  await pool.query('UPDATE usuarios SET email_verificado = true WHERE id = $1', [sesion.usuario.id]);
  return sesion;
}

async function crear(agente, { ruta, datos }) {
  const res = await agente.post(ruta).set(CSRF).send(datos());
  if (res.status !== 201) throw new Error(`Alta falló: ${res.status} ${JSON.stringify(res.body)}`);
  return res.body.id;
}

const fila = async (tabla, id) => (await pool.query(`SELECT * FROM ${tabla} WHERE id = $1`, [id])).rows[0];

// RF-07, RF-08, RF-09: editar y cancelar un envío pendiente, para una clase de CLASES.
function probarEdicion(c) {
  describe(`editar y cancelar: ${c.clase}`, () => {
    const editar = (agente, id, datos) => agente.put(`${c.ruta}/${id}`).set(CSRF).send(datos);
    const cancelar = (agente, id) => agente.post(`${c.ruta}/${id}/cancelar`).set(CSRF);

    describe('caso feliz (RF-07)', () => {
      test('el autor edita su envío pendiente y sigue pendiente', async () => {
        const { agente } = await entrarVerificado();
        const id = await crear(agente, c);
        const antes = await fila(c.tabla, id);

        const res = await editar(agente, id, c.datos(c.cambio));
        expect(res.status).toBe(200);
        expect(res.body).toEqual({ id, estado: 'pendiente' });

        const despues = await fila(c.tabla, id);
        expect(despues).toMatchObject(c.cambio);
        expect(despues.estado).toBe('pendiente');
        expect(despues.actualizado_en.getTime()).toBeGreaterThanOrEqual(antes.actualizado_en.getTime());
        expect(despues.creado_en).toEqual(antes.creado_en);
      });

      test('el autor cancela su envío pendiente', async () => {
        const { agente } = await entrarVerificado();
        const id = await crear(agente, c);
        const res = await cancelar(agente, id);
        expect(res.status).toBe(200);
        expect(res.body).toEqual({ id, estado: 'cancelado' });
        expect((await fila(c.tabla, id)).estado).toBe('cancelado');
      });

      test('editar ignora los campos que no son del formulario (estado, autor)', async () => {
        const { agente, usuario } = await entrarVerificado();
        const id = await crear(agente, c);
        const res = await editar(agente, id, c.datos({ estado: 'aprobado', usuario_id: 999, propuesto_por: 999 }));
        expect(res.status).toBe(200);
        const despues = await fila(c.tabla, id);
        expect(despues.estado).toBe('pendiente');
        expect(despues[c.clase === 'reporte' ? 'usuario_id' : 'propuesto_por']).toBe(String(usuario.id));
      });
    });

    describe('estado inválido (RF-08)', () => {
      test.each(c.estadosFinales)('si está %s, editar y cancelar responden 409 TRANSICION_INVALIDA', async (estado) => {
        const { agente } = await entrarVerificado();
        const id = await crear(agente, c);
        await pool.query(`UPDATE ${c.tabla} SET estado = $2 WHERE id = $1`, [id, estado]);
        const antes = await fila(c.tabla, id);

        for (const res of [await editar(agente, id, c.datos(c.cambio)), await cancelar(agente, id)]) {
          expect(res.status).toBe(409);
          expect(res.body.error.codigo).toBe('TRANSICION_INVALIDA');
        }
        expect(await fila(c.tabla, id)).toEqual(antes);
      });

      test('cancelado es final: cancelar dos veces responde 409 la segunda', async () => {
        const { agente } = await entrarVerificado();
        const id = await crear(agente, c);
        expect((await cancelar(agente, id)).status).toBe(200);
        const res = await cancelar(agente, id);
        expect(res.status).toBe(409);
        expect(res.body.error.mensaje).toMatch(/cancelado/);
      });

      test('dos cancelaciones simultáneas: una pasa y la otra responde 409', async () => {
        const { agente } = await entrarVerificado();
        const id = await crear(agente, c);
        const estados = (await Promise.all([cancelar(agente, id), cancelar(agente, id)])).map((r) => r.status);
        expect(estados.sort()).toEqual([200, 409]);
      });
    });

    describe('permisos', () => {
      test('un envío ajeno responde 403 SIN_PERMISO y no cambia', async () => {
        const { agente: autor } = await entrarVerificado();
        const id = await crear(autor, c);
        const antes = await fila(c.tabla, id);
        const { agente: otro } = await entrarVerificado({ email: 'otro@mail.com' });

        for (const res of [await editar(otro, id, c.datos(c.cambio)), await cancelar(otro, id)]) {
          expect(res.status).toBe(403);
          expect(res.body.error.codigo).toBe('SIN_PERMISO');
        }
        expect(await fila(c.tabla, id)).toEqual(antes);
      });

      test('un envío inexistente responde 404 NO_ENCONTRADO', async () => {
        const { agente } = await entrarVerificado();
        for (const res of [await editar(agente, 999, c.datos()), await cancelar(agente, 999)]) {
          expect(res.status).toBe(404);
          expect(res.body.error.codigo).toBe('NO_ENCONTRADO');
        }
      });

      test('un envío cuyo autor borró su cuenta responde 403', async () => {
        const { agente } = await entrarVerificado();
        const id = await crear(agente, c);
        const columna = c.clase === 'reporte' ? 'usuario_id' : 'propuesto_por';
        await pool.query(`UPDATE ${c.tabla} SET ${columna} = NULL WHERE id = $1`, [id]);
        expect((await cancelar(agente, id)).status).toBe(403);
      });

      test('sin sesión responde 401', async () => {
        const res = await request(app).post(`${c.ruta}/1/cancelar`).set(CSRF);
        expect(res.status).toBe(401);
      });

      test('sin el encabezado X-Requested-With responde 403', async () => {
        const { agente } = await entrarVerificado();
        const id = await crear(agente, c);
        expect((await agente.post(`${c.ruta}/${id}/cancelar`)).status).toBe(403);
        expect((await agente.put(`${c.ruta}/${id}`).send(c.datos(c.cambio))).status).toBe(403);
        expect((await fila(c.tabla, id)).estado).toBe('pendiente');
      });

      test('RF-03: con el email sin verificar responde 403 EMAIL_NO_VERIFICADO', async () => {
        const { agente, usuario } = await entrarVerificado();
        const id = await crear(agente, c);
        await pool.query('UPDATE usuarios SET email_verificado = false WHERE id = $1', [usuario.id]);
        const res = await cancelar(agente, id);
        expect(res.status).toBe(403);
        expect(res.body.error.codigo).toBe('EMAIL_NO_VERIFICADO');
      });

      test('un administrador recibe 403 SIN_PERMISO', async () => {
        const { agente, usuario } = await entrarVerificado();
        const id = await crear(agente, c);
        await pool.query("UPDATE usuarios SET rol = 'admin' WHERE id = $1", [usuario.id]);
        const res = await cancelar(agente, id);
        expect(res.status).toBe(403);
        expect(res.body.error.codigo).toBe('SIN_PERMISO');
      });
    });

    describe('validación (RF-10)', () => {
      test('editar con datos inválidos responde 400 y no cambia nada', async () => {
        const { agente } = await entrarVerificado();
        const id = await crear(agente, c);
        const antes = await fila(c.tabla, id);
        const res = await editar(agente, id, c.datos({ lat: -30, descripcion: 'corta' }));
        expect(res.status).toBe(400);
        expect(res.body.error.codigo).toBe('DATOS_INVALIDOS');
        expect(res.body.error.detalles.map((d) => d.campo).sort()).toEqual(['descripcion', 'lat']);
        expect(await fila(c.tabla, id)).toEqual(antes);
      });

      test('un id que no es un entero positivo responde 400', async () => {
        const { agente } = await entrarVerificado();
        expect((await agente.post(`${c.ruta}/abc/cancelar`).set(CSRF)).status).toBe(400);
        expect((await editar(agente, '0', c.datos())).status).toBe(400);
      });
    });

    describe('límite diario (RF-09)', () => {
      test('editar no cuenta como envío nuevo y cancelar no libera cupo', async () => {
        const { agente } = await entrarVerificado();
        const limite = c.clase === 'reporte' ? 5 : 3;
        const ids = [];
        for (let i = 0; i < limite; i += 1) ids.push(await crear(agente, c));

        // Con el cupo lleno todavía se puede editar.
        expect((await editar(agente, ids[0], c.datos(c.cambio))).status).toBe(200);
        // Cancelar no devuelve el cupo.
        expect((await cancelar(agente, ids[1])).status).toBe(200);
        const res = await agente.post(c.ruta).set(CSRF).send(c.datos());
        expect(res.status).toBe(429);
        expect(res.body.error.codigo).toBe('LIMITE_DIARIO');
      });
    });
  });
}

module.exports = {
  app,
  pool,
  request,
  CSRF,
  limpiarBase,
  registrarYEntrar,
  enDias,
  datosReporte,
  datosEvento,
  CLASES,
  entrarVerificado,
  crear,
  fila,
  probarEdicion,
};
