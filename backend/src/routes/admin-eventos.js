const { Router } = require('express');
const controller = require('../controllers/admin-eventos');
const validar = require('../middlewares/validar');
const schemas = require('../schemas/eventos');
const { rechazo } = require('../schemas/moderacion');
const comunes = require('../schemas/comunes');

const router = Router();
const conId = validar(comunes.id, 'params');

// RF-15, RF-12: cola, historial y detalle. El rol admin ya lo exige routes/admin.js; las que
// modifican pasan además por el control de CSRF de app.js (X-Requested-With: TucuMaps).
router.get('/', validar(schemas.filtrosAdmin, 'query'), controller.listar);
router.get('/:id', conId, controller.detalle);
// RF-13: alta directa (nace aprobado) y edición sin cambiar el estado.
router.post('/', validar(schemas.evento), controller.crear);
router.put('/:id', conId, validar(schemas.edicionAdmin), controller.editar);
// RF-08, RF-13: transiciones del diagrama de estados (las controla el servicio).
router.post('/:id/aprobar', conId, controller.aprobar);
router.post('/:id/rechazar', conId, validar(rechazo), controller.rechazar);
router.post('/:id/retirar', conId, controller.retirar);

module.exports = router;
