const { Router } = require('express');
const controller = require('../controllers/catalogos');

const router = Router();

router.get('/', controller.listar);

module.exports = router;
