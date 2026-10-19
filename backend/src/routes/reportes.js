const { Router } = require('express');
const controller = require('../controllers/reportes');
const validar = require('../middlewares/validar');
const schemas = require('../schemas/reportes');
const { nivelVerificado } = require('../middlewares/auth');

const router = Router();

// RF-02, RF-11: acceso público, sin sesión.
router.get('/', controller.listar);
// RF-07, RF-09, RF-10: nivel "Verificado". El CSRF lo exige app.js.
router.post('/', nivelVerificado, validar(schemas.reporte), controller.crear);

module.exports = router;
