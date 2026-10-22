const { Router } = require('express');
const controller = require('../controllers/auth');
const validar = require('../middlewares/validar');
const { requerirSesion } = require('../middlewares/auth');
const { limiteCambioPassword, limiteCambioEmail } = require('../middlewares/limites');
const schemas = require('../schemas/auth');

const router = Router();

// RF-01.
router.patch(
  '/password',
  limiteCambioPassword,
  requerirSesion,
  validar(schemas.cambiarPassword),
  controller.cambiarPassword,
);

// RF-25: perfil. Cambiar el email pide la contraseña: los intentos fallidos cuentan para el
// mismo límite que el cambio de contraseña. Además, como manda correos, tiene el límite por IP
// de las rutas que envían correos (10 por hora). La confirmación es pública, como verificar-email,
// porque el enlace se puede abrir en otro dispositivo.
router.patch('/nombre', requerirSesion, validar(schemas.cambiarNombre), controller.cambiarNombre);
router.post(
  '/email',
  limiteCambioEmail,
  limiteCambioPassword,
  requerirSesion,
  validar(schemas.cambiarEmail),
  controller.pedirCambioEmail,
);
// RF-24: baja de cuenta. Pide la contraseña: los intentos fallidos cuentan para el mismo límite
// que el cambio de contraseña.
router.delete('/', limiteCambioPassword, requerirSesion, validar(schemas.bajaCuenta), controller.darDeBaja);
router.post('/confirmar-email', validar(schemas.confirmarEmail), controller.confirmarCambioEmail);

module.exports = router;
