const { Router } = require('express');
const controller = require('../controllers/catalogos');
const { guardar } = require('../middlewares/cache');

const router = Router();

// Cambian solo con una migración; 5 minutos para que un deploy nuevo se vea enseguida.
router.get('/', guardar(300), controller.listar);

module.exports = router;
