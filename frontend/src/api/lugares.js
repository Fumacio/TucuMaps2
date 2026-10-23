// Lugares del mapa (RF-02): GET /api/lugares y GET /api/lugares/:id.
// En desarrollo, el proxy de vite.config.js manda /api al backend local (localhost:3000).
import { api } from './cliente.js'

export function obtenerLugares() {
  return api('/lugares')
}

export function obtenerLugar(id) {
  return api(`/lugares/${encodeURIComponent(id)}`)
}
