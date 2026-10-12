const { Router } = require('express');
const controller = require('../controllers/auth');
const validar = require('../middlewares/validar');
const { requerirSesion } = require('../middlewares/auth');
const { limiteLogin, limiteRegistro, limiteRecuperar } = require('../middlewares/limites');
const schemas = require('../schemas/auth');

const router = Router();

router.post('/registro', limiteRegistro, validar(schemas.registro), controller.registro);
router.post('/login', limiteLogin, validar(schemas.login), controller.login);
router.post('/logout', requerirSesion, controller.logout);
router.post('/logout-todos', requerirSesion, controller.logoutTodos);
router.get('/me', requerirSesion, controller.me);
router.post('/verificar-email', validar(schemas.verificarEmail), controller.verificarEmail);
router.post('/reenviar-verificacion', requerirSesion, controller.reenviarVerificacion);
router.post('/recuperar', limiteRecuperar, validar(schemas.recuperar), controller.recuperar);
router.post('/restablecer', validar(schemas.restablecer), controller.restablecer);

module.exports = router;
