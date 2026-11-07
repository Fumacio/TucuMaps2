// RF-08, RF-13, RF-15: moderación desde el panel. El backend exige el rol de administrador.
import { api } from './cliente.js'

export const POR_PAGINA = 20

// Los filtros vacíos no se mandan. Responde { datos, pagina, por_pagina, total }.
function lista(ruta, filtros, pagina) {
  const parametros = new URLSearchParams({ pagina: String(pagina), por_pagina: String(POR_PAGINA) })
  for (const [nombre, valor] of Object.entries(filtros)) {
    if (valor) parametros.set(nombre, valor)
  }
  return api(`${ruta}?${parametros}`)
}

function accion(ruta, id, nombre, cuerpo) {
  return api(`${ruta}/${encodeURIComponent(id)}/${nombre}`, { metodo: 'POST', cuerpo })
}

const REPORTES = '/admin/reportes'

export function obtenerReportesAdmin(filtros, pagina = 1) {
  return lista(REPORTES, filtros, pagina)
}

// Cada acción responde con el reporte actualizado.
export function aprobarReporte(id) {
  return accion(REPORTES, id, 'aprobar')
}

export function rechazarReporte(id, motivo) {
  return accion(REPORTES, id, 'rechazar', { motivo })
}

export function resolverReporte(id) {
  return accion(REPORTES, id, 'resolver')
}

export function retirarReporte(id) {
  return accion(REPORTES, id, 'retirar')
}
