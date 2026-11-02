// RF-02, RF-12: eventos vigentes (los archivados ya no vienen).
import { api } from './cliente.js'

// filtros: { categoria, desde, hasta }; los vacíos no se mandan.
export function obtenerEventos(filtros = {}) {
  const parametros = new URLSearchParams()
  for (const [nombre, valor] of Object.entries(filtros)) {
    if (valor) parametros.set(nombre, valor)
  }
  const busqueda = parametros.toString()
  return api(busqueda ? `/eventos?${busqueda}` : '/eventos')
}

export function obtenerEvento(id) {
  return api(`/eventos/${encodeURIComponent(id)}`)
}

// RF-07, RF-09, RF-10: queda pendiente hasta que un administrador la aprueba.
export function proponerEvento(evento) {
  return api('/eventos', { metodo: 'POST', cuerpo: evento })
}
