// RF-01, RF-24, RF-25: lo que la persona cambia de su propia cuenta.
import { api } from './cliente.js'

export function cambiarPassword({ actual, nueva }) {
  return api('/cuenta/password', {
    metodo: 'PATCH',
    cuerpo: { password_actual: actual, password_nueva: nueva },
  })
}

export async function cambiarNombre(nombre) {
  const { usuario } = await api('/cuenta/nombre', { metodo: 'PATCH', cuerpo: { nombre } })
  return usuario
}

// El email no cambia todavía: llega un enlace al nuevo (POST /cuenta/confirmar-email).
export function pedirCambioDeEmail({ emailNuevo, password }) {
  return api('/cuenta/email', { metodo: 'POST', cuerpo: { email_nuevo: emailNuevo, password } })
}

export function confirmarEmailNuevo(token) {
  return api('/cuenta/confirmar-email', { metodo: 'POST', cuerpo: { token } })
}

export function darDeBaja(password) {
  return api('/cuenta', { metodo: 'DELETE', cuerpo: { password } })
}
