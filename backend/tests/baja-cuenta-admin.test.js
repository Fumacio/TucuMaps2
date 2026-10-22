// RF-24: baja de cuenta de un administrador (DELETE /api/cuenta, #49). Va aparte de
// baja-cuenta.test.js porque los 409 cuentan para el límite de intentos de cada archivo.
const { pool, CSRF, limpiarBase } = require('./helpers');
const { entrarComoAdmin, crearCiudadano, crearReporte, filaReporte } = require('./admin-comun');

const darDeBaja = (agente) => agente.delete('/api/cuenta').set(CSRF).send({ password: 'clave1234' });
const existe = async (id) => (await pool.query('SELECT 1 FROM usuarios WHERE id = $1', [id])).rows.length > 0;

beforeEach(limpiarBase);
afterAll(() => pool.end());

describe('DELETE /api/cuenta: administradores (decisión del 19/10/2026)', () => {
  test('el único admin recibe 409 ULTIMO_ADMIN y su cuenta sigue', async () => {
    const { agente, usuario } = await entrarComoAdmin();
    const res = await darDeBaja(agente);
    expect(res.status).toBe(409);
    expect(res.body.error.codigo).toBe('ULTIMO_ADMIN');
    expect(await existe(usuario.id)).toBe(true);
  });

  test('si queda otro admin activo puede darse de baja; lo que revisó queda sin revisor', async () => {
    const otro = await crearCiudadano({ email: 'dos@mail.com' });
    await pool.query("UPDATE usuarios SET rol = 'admin' WHERE id = $1", [otro]);
    const { agente, usuario } = await entrarComoAdmin();
    const reporte = await crearReporte({ estado: 'aprobado' });
    await pool.query('UPDATE reportes SET revisado_por = $2 WHERE id = $1', [reporte, usuario.id]);

    expect((await darDeBaja(agente)).status).toBe(204);
    expect(await existe(usuario.id)).toBe(false);
    expect((await filaReporte(reporte)).revisado_por).toBeNull();
  });

  test('un admin bloqueado no cuenta como "otro admin"', async () => {
    const otro = await crearCiudadano({ email: 'dos@mail.com' });
    await pool.query("UPDATE usuarios SET rol = 'admin', bloqueado = true WHERE id = $1", [otro]);
    const { agente } = await entrarComoAdmin();
    expect((await darDeBaja(agente)).status).toBe(409);
  });

  test('si los dos únicos admins se dan de baja a la vez, solo uno lo logra', async () => {
    const { agente: uno } = await entrarComoAdmin();
    const { agente: dos } = await entrarComoAdmin({ nombre: 'Admin Dos', email: 'dos@mail.com' });
    const estados = (await Promise.all([darDeBaja(uno), darDeBaja(dos)])).map((r) => r.status);
    expect(estados.sort()).toEqual([204, 409]);
    const { rows } = await pool.query("SELECT count(*)::int AS n FROM usuarios WHERE rol = 'admin'");
    expect(rows[0].n).toBe(1);
  });
});
