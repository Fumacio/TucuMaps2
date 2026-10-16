const { Router } = require('express');
const controller = require('../controllers/admin-lugares');
const validar = require('../middlewares/validar');
const schemas = require('../schemas/lugares');
const comunes = require('../schemas/comunes');

const router = Router();

// RF-13: el rol admin ya lo exige routes/admin.js. Las que modifican pasan además por el
// control de CSRF de app.js (X-Requested-With: TucuMaps).
router.get('/', validar(comunes.paginacion, 'query'), controller.listar);
router.post('/', validar(schemas.lugar), controller.crear);
router.put('/:id', validar(comunes.id, 'params'), validar(schemas.lugar), controller.actualizar);
router.patch(
  '/:id/activo',
  validar(comunes.id, 'params'),
  validar(schemas.cambioActivo),
  controller.cambiarActivo,
);

module.exports = router;
