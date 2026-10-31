// Reglas y errores compartidos por los formularios de cuenta (RF-01, RF-06).

// RF-01: la misma política que backend/src/schemas/auth.js, con los mismos mensajes, para
// avisar antes de enviar. El servidor igual la vuelve a validar.
export function errorDePassword(password) {
  if (password.length < 8) return 'La contraseña debe tener al menos 8 caracteres'
  if (new TextEncoder().encode(password).length > 72) return 'La contraseña es demasiado larga'
  if (!/\p{L}/u.test(password) || !/\d/.test(password)) {
    return 'La contraseña debe tener al menos una letra y un número'
  }
  return null
}

const ENLACE_INVALIDO = 'El enlace no es válido o ya venció. Pedí uno nuevo.'

// Un enlace de correo cortado o mal copiado llega como DATOS_INVALIDOS en el campo `token`, que
// la pantalla no muestra: se explica igual que un enlace vencido (TOKEN_INVALIDO).
export function esEnlaceInvalido(error) {
  return error?.codigo === 'TOKEN_INVALIDO' || Boolean(erroresPorCampo(error).token)
}

export function mensajeDeError(error) {
  return esEnlaceInvalido(error) ? ENLACE_INVALIDO : error?.mensaje
}

// La API manda los errores de validación como detalles: [{ campo, mensaje }]. Los pasa a
// { campo: mensaje } para mostrar cada uno debajo de su campo (el primero, si hay varios).
export function erroresPorCampo(error) {
  const errores = {}
  for (const { campo, mensaje } of error?.detalles ?? []) {
    errores[campo] ??= mensaje
  }
  return errores
}
