const { Router } = require('express');
const controller = require('../controllers/auth');
const validar = require('../middlewares/validar');
const { requerirSesion } = require('../middlewares/auth');
const schemas = require('../schemas/auth');

const router = Router();

// RF-01. La baja de cuenta (DELETE /api/cuenta, RF-24) entra en el Sprint 4.
router.patch('/password', requerirSesion, validar(schemas.cambiarPassword), controller.cambiarPassword);

module.exports = router;
