const { Router } = require('express');
const controller = require('../controllers/reportes');

const router = Router();

// RF-02, RF-11: acceso público, sin sesión. El envío (POST) llega en la Fase 3.
router.get('/', controller.listar);

module.exports = router;
