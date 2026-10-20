// RF-07, RF-08, RF-09: editar y cancelar reportes pendientes (#44).
const { pool, limpiarBase, CLASES, probarEdicion } = require('./envios-comun');

beforeEach(limpiarBase);
afterAll(() => pool.end());

probarEdicion(CLASES[0]);
