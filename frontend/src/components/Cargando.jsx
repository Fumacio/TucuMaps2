import { useSyncExternalStore } from 'react'
import { escucharDemora, hayDemora } from '../api/cliente.js'

// RF-06: indicador de carga. Si algún pedido tarda (cliente.js), explica por qué.
function Cargando({ texto = 'Cargando…', className = '' }) {
  const demora = useSyncExternalStore(escucharDemora, hayDemora)

  return (
    <div className={`cargando ${className}`} role="status">
      <span className="cargando__ruedita" aria-hidden="true" />
      <span>
        {texto}
        {demora && (
          <span className="cargando__demora">
            El servidor se está despertando, puede tardar hasta un minuto.
          </span>
        )}
      </span>
    </div>
  )
}

export default Cargando
