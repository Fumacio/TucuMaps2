const { Router } = require('express');
const controller = require('../controllers/reportes');
const validar = require('../middlewares/validar');
const schemas = require('../schemas/reportes');
const comunes = require('../schemas/comunes');
const { nivelVerificado } = require('../middlewares/auth');

const router = Router();

// RF-02, RF-11: acceso público, sin sesión.
router.get('/', controller.listar);
// RF-07, RF-09, RF-10: nivel "Verificado". El CSRF lo exige app.js.
router.post('/', nivelVerificado, validar(schemas.reporte), controller.crear);
// RF-07, RF-08: solo el autor y mientras siga pendiente (lo controla el servicio).
router.put('/:id', nivelVerificado, validar(comunes.id, 'params'), validar(schemas.reporte), controller.editar);
router.post('/:id/cancelar', nivelVerificado, validar(comunes.id, 'params'), controller.cancelar);

module.exports = router;
