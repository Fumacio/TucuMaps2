const { Router } = require('express');
const controller = require('../controllers/mis-envios');
const validar = require('../middlewares/validar');
const schemas = require('../schemas/envios');
const { requerirSesion } = require('../middlewares/auth');

const router = Router();

// RF-07, RF-08: nivel "Sesión". Cada usuario ve solo lo suyo.
router.get('/', requerirSesion, validar(schemas.filtrosMisEnvios, 'query'), controller.listar);

module.exports = router;
