// RF-02, RF-11: alertas activas de la capa Seguridad.
import { api } from './cliente.js'

export function obtenerAlertas() {
  return api('/reportes')
}
