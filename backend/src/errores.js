// Error de la API con el formato { error: { codigo, mensaje, detalles? } }.
// Los mensajes están en español y se pueden mostrar tal cual al usuario (RF-06).
class ErrorApi extends Error {
  constructor(status, codigo, mensaje, detalles, retryAfterSeg) {
    super(mensaje);
    this.status = status;
    this.codigo = codigo;
    this.detalles = detalles;
    this.retryAfterSeg = retryAfterSeg;
  }
}

const errores = {
  datosInvalidos: (detalles) =>
    new ErrorApi(400, 'DATOS_INVALIDOS', 'Revisá los datos ingresados.', detalles),
  tokenInvalido: () =>
    new ErrorApi(400, 'TOKEN_INVALIDO', 'El enlace no es válido o ya venció. Pedí uno nuevo.'),
  noAutenticado: () =>
    new ErrorApi(401, 'NO_AUTENTICADO', 'Tenés que iniciar sesión para continuar.'),
  credencialesInvalidas: () =>
    new ErrorApi(401, 'CREDENCIALES_INVALIDAS', 'El email o la contraseña son incorrectos.'),
  usuarioBloqueado: () =>
    new ErrorApi(403, 'USUARIO_BLOQUEADO', 'Tu cuenta está bloqueada.'),
  emailNoVerificado: () =>
    new ErrorApi(403, 'EMAIL_NO_VERIFICADO', 'Tenés que verificar tu email para hacer esto.'),
  sinPermiso: () =>
    new ErrorApi(403, 'SIN_PERMISO', 'No tenés permiso para hacer esto.'),
  noEncontrado: () =>
    new ErrorApi(404, 'NO_ENCONTRADO', 'No encontramos lo que buscás.'),
  emailEnUso: () =>
    new ErrorApi(409, 'EMAIL_EN_USO', 'Ya existe una cuenta con ese email.'),
  // Siempre lleva Retry-After con los segundos a esperar.
  demasiadosIntentos: (mensaje, retryAfterSeg) =>
    new ErrorApi(429, 'DEMASIADOS_INTENTOS', mensaje, undefined, retryAfterSeg),
};

module.exports = { ErrorApi, errores };
