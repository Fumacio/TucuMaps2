// RF-02, RF-11: alertas activas de la capa Seguridad.
import { api } from './cliente.js'

export function obtenerAlertas() {
  return api('/reportes')
}

// RF-07, RF-09, RF-10: queda pendiente hasta que un administrador lo aprueba.
export function enviarReporte(reporte) {
  return api('/reportes', { metodo: 'POST', cuerpo: reporte })
}

// RF-07: mientras está pendiente, el autor lo puede corregir (mismo cuerpo que el alta) o cancelar.
export function editarReporte(id, reporte) {
  return api(`/reportes/${encodeURIComponent(id)}`, { metodo: 'PUT', cuerpo: reporte })
}

export function cancelarReporte(id) {
  return api(`/reportes/${encodeURIComponent(id)}/cancelar`, { metodo: 'POST' })
}
