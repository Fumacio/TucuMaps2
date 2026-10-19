const { Router } = require('express');
const controller = require('../controllers/eventos');
const validar = require('../middlewares/validar');
const schemas = require('../schemas/eventos');
const comunes = require('../schemas/comunes');
const { nivelVerificado } = require('../middlewares/auth');

const router = Router();

// RF-02, RF-12: acceso público, sin sesión.
router.get('/', validar(schemas.filtros, 'query'), controller.listar);
router.get('/:id', validar(comunes.id, 'params'), controller.detalle);
// RF-07, RF-09, RF-10: nivel "Verificado". El CSRF lo exige app.js.
router.post('/', nivelVerificado, validar(schemas.evento), controller.proponer);

module.exports = router;
