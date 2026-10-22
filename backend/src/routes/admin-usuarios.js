const { Router } = require('express');
const controller = require('../controllers/admin-usuarios');
const validar = require('../middlewares/validar');
const schemas = require('../schemas/usuarios');
const comunes = require('../schemas/comunes');

const router = Router();
const conId = validar(comunes.id, 'params');

// RF-16: el rol admin ya lo exige routes/admin.js; las acciones pasan además por el control de
// CSRF de app.js (X-Requested-With: TucuMaps).
router.get('/', validar(schemas.filtrosAdmin, 'query'), controller.listar);
router.post('/:id/bloquear', conId, controller.bloquear);
router.post('/:id/desbloquear', conId, controller.desbloquear);

module.exports = router;
