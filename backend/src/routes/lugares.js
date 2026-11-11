const { Router } = require('express');
const controller = require('../controllers/lugares');
const validar = require('../middlewares/validar');
const { revalidar } = require('../middlewares/cache');
const schemas = require('../schemas/lugares');
const comunes = require('../schemas/comunes');

const router = Router();

// RF-02: acceso público, sin sesión.
router.get('/', revalidar, validar(schemas.filtros, 'query'), controller.listar);
router.get('/:id', revalidar, validar(comunes.id, 'params'), controller.detalle);

module.exports = router;
