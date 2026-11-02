// RF-02, RF-11: alertas activas de la capa Seguridad.
import { api } from './cliente.js'

export function obtenerAlertas() {
  return api('/reportes')
}

// RF-07, RF-09, RF-10: queda pendiente hasta que un administrador lo aprueba.
export function enviarReporte(reporte) {
  return api('/reportes', { metodo: 'POST', cuerpo: reporte })
}
