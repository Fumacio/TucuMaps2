// RF-24: baja de cuenta (DELETE /api/cuenta, #49).
const { app, pool, request, CSRF, limpiarBase, registrarYEntrar } = require('./helpers');
const { entrarComoAdmin, crearCiudadano, crearReporte, crearEvento, filaReporte, filaEvento } = require('./admin-comun');

const PASSWORD = { password: 'clave1234' };
const darDeBaja = (agente, cuerpo = PASSWORD) => agente.delete('/api/cuenta').set(CSRF).send(cuerpo);
const existe = async (id) => (await pool.query('SELECT 1 FROM usuarios WHERE id = $1', [id])).rows.length > 0;

beforeEach(limpiarBase);
afterAll(() => pool.end());

describe('DELETE /api/cuenta: caso feliz', () => {
  test('borra la cuenta, deja sus envíos sin autor, borra sus confirmaciones y la cookie', async () => {
    const { agente, usuario } = await registrarYEntrar();
    const reporte = await crearReporte({ usuarioId: usuario.id, estado: 'aprobado' });
    const evento = await crearEvento({ usuarioId: usuario.id });
    const ajeno = await crearReporte({ usuarioId: await crearCiudadano({ email: 'beto@mail.com' }), estado: 'aprobado' });
    await pool.query('INSERT INTO confirmaciones (reporte_id, usuario_id) VALUES ($1, $2)', [ajeno, usuario.id]);

    const res = await darDeBaja(agente);
    expect(res.status).toBe(204);
    expect(res.headers['set-cookie'].join(';')).toMatch(/tm_sesion=;/);

    expect(await existe(usuario.id)).toBe(false);
    expect((await filaReporte(reporte)).usuario_id).toBeNull();
    expect((await filaEvento(evento)).propuesto_por).toBeNull();
    expect((await pool.query('SELECT count(*)::int AS n FROM confirmaciones')).rows[0].n).toBe(0);
    expect((await pool.query('SELECT count(*)::int AS n FROM tokens_usuario')).rows[0].n).toBe(0);
    // La misma cookie ya no sirve.
    expect((await agente.get('/api/auth/me')).status).toBe(401);
  });

  test('el email queda libre para registrarse de nuevo', async () => {
    const { agente } = await registrarYEntrar();
    expect((await darDeBaja(agente)).status).toBe(204);
    await expect(registrarYEntrar()).resolves.toBeDefined();
  });

  test('nada en el panel identifica al ex usuario', async () => {
    const { agente, usuario } = await registrarYEntrar({ nombre: 'Ana Secreta' });
    await crearReporte({ usuarioId: usuario.id });
    expect((await darDeBaja(agente)).status).toBe(204);

    const { agente: admin } = await entrarComoAdmin();
    for (const ruta of ['/api/admin/reportes', '/api/admin/usuarios']) {
      const texto = JSON.stringify((await admin.get(ruta)).body);
      expect(texto).not.toContain('Ana Secreta');
      expect(texto).not.toContain('ana@mail.com');
    }
  });
});

describe('DELETE /api/cuenta: validación y permisos', () => {
  test('con la contraseña incorrecta responde 400 y no borra nada', async () => {
    const { agente, usuario } = await registrarYEntrar();
    const res = await darDeBaja(agente, { password: 'otra1234' });
    expect(res.status).toBe(400);
    expect(res.body.error.codigo).toBe('DATOS_INVALIDOS');
    expect(res.body.error.detalles).toEqual([{ campo: 'password', mensaje: 'La contraseña no es correcta' }]);
    expect(await existe(usuario.id)).toBe(true);
  });

  test('sin contraseña responde 400', async () => {
    const { agente } = await registrarYEntrar();
    expect((await darDeBaja(agente, {})).status).toBe(400);
  });

  test('sin sesión responde 401 y sin X-Requested-With 403', async () => {
    expect((await darDeBaja(request(app))).status).toBe(401);
    const { agente, usuario } = await registrarYEntrar();
    expect((await agente.delete('/api/cuenta').send(PASSWORD)).status).toBe(403);
    expect(await existe(usuario.id)).toBe(true);
  });

  // Va última: las respuestas con error de las pruebas anteriores de este archivo ya cuentan.
  test('los intentos fallidos cuentan para el límite de 5 en 15 minutos', async () => {
    const { agente, usuario } = await registrarYEntrar();
    let fallidos = 0;
    while ((await darDeBaja(agente, { password: 'mala1234' })).status === 400) fallidos += 1;
    expect(fallidos).toBeLessThan(5);
    const res = await darDeBaja(agente);
    expect(res.status).toBe(429);
    expect(res.body.error.codigo).toBe('DEMASIADOS_INTENTOS');
    expect(await existe(usuario.id)).toBe(true);
  });
});
