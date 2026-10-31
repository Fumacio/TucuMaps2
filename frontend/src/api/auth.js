// RF-01, RF-03: cuenta y sesión (docs/API TucuMaps.md, sección 2). La sesión es la cookie
// tm_sesion, que el navegador manda solo; cliente.js agrega X-Requested-With en los POST.
import { api } from './cliente.js'

// Devuelve el usuario conectado, o null si no hay sesión (la API responde 401).
export async function obtenerSesion() {
  try {
    const { usuario } = await api('/auth/me')
    return usuario
  } catch (error) {
    if (error?.codigo === 'NO_AUTENTICADO') return null
    throw error
  }
}

export async function registrarse({ nombre, email, password, aceptaTerminos }) {
  const { usuario } = await api('/auth/registro', {
    metodo: 'POST',
    // RF-04: una sola casilla declara las dos cosas (ver CasillaTerminos).
    cuerpo: { nombre, email, password, acepta_terminos: aceptaTerminos, mayor_de_edad: aceptaTerminos },
  })
  return usuario
}

export async function iniciarSesion({ email, password }) {
  const { usuario } = await api('/auth/login', { metodo: 'POST', cuerpo: { email, password } })
  return usuario
}

export function cerrarSesion() {
  return api('/auth/logout', { metodo: 'POST' })
}

export function cerrarSesionEnTodos() {
  return api('/auth/logout-todos', { metodo: 'POST' })
}

export function verificarEmail(token) {
  return api('/auth/verificar-email', { metodo: 'POST', cuerpo: { token } })
}

export function reenviarVerificacion() {
  return api('/auth/reenviar-verificacion', { metodo: 'POST' })
}

export function pedirRecuperacion(email) {
  return api('/auth/recuperar', { metodo: 'POST', cuerpo: { email } })
}

export function restablecerPassword({ token, password }) {
  return api('/auth/restablecer', { metodo: 'POST', cuerpo: { token, password } })
}
