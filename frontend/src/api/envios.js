// RF-07, RF-08: lo que envió el usuario de la sesión, con su estado.
import { api } from './cliente.js'

// tipo: 'reporte', 'evento' o '' (todos). Del más nuevo al más viejo, de a 20.
export function obtenerMisEnvios({ tipo = '', pagina = 1 } = {}) {
  const parametros = new URLSearchParams({ pagina: String(pagina), por_pagina: '20' })
  if (tipo) parametros.set('tipo', tipo)
  return api(`/mis-envios?${parametros}`)
}
