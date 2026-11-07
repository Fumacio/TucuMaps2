import { useCallback, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import ModeracionEventos from '../components/ModeracionEventos.jsx'
import ModeracionLugares from '../components/ModeracionLugares.jsx'
import ModeracionReportes from '../components/ModeracionReportes.jsx'
import ModeracionUsuarios from '../components/ModeracionUsuarios.jsx'
import ResumenPanel from '../components/ResumenPanel.jsx'
import SoloAdmin from '../components/SoloAdmin.jsx'

const PESTANAS = [
  ['reportes', 'Reportes'],
  ['eventos', 'Eventos'],
  ['lugares', 'Lugares'],
  ['usuarios', 'Usuarios'],
]

// RF-08, RF-13, RF-15, RF-16: panel de administración. La pestaña va en la dirección (?pestana=eventos)
// para volver a ella después de crear o editar un evento.
function Admin() {
  return (
    <SoloAdmin>
      <Panel />
    </SoloAdmin>
  )
}

function Panel() {
  const [busqueda, setBusqueda] = useSearchParams()
  const pedida = busqueda.get('pestana')
  const pestana = PESTANAS.some(([valor]) => valor === pedida) ? pedida : 'reportes'
  const [cambios, setCambios] = useState(0) // cambiarlo vuelve a pedir los contadores
  const alCambiar = useCallback(() => setCambios((n) => n + 1), [])
  const ir = useCallback((valor) => setBusqueda({ pestana: valor }, { replace: true }), [setBusqueda])

  return (
    <div className="moderacion">
      <h1 className="agenda__titulo">Panel de administración</h1>
      <ResumenPanel actualizar={cambios} onIr={ir} />
      <div className="mis-envios__filtros moderacion__pestanas" role="group" aria-label="Qué administrar">
        {PESTANAS.map(([valor, etiqueta]) => (
          <button
            key={valor}
            type="button"
            aria-pressed={pestana === valor}
            onClick={() => ir(valor)}
          >
            {etiqueta}
          </button>
        ))}
      </div>
      {pestana === 'reportes' && <ModeracionReportes onCambio={alCambiar} />}
      {pestana === 'eventos' && <ModeracionEventos onCambio={alCambiar} />}
      {pestana === 'lugares' && <ModeracionLugares />}
      {pestana === 'usuarios' && <ModeracionUsuarios onCambio={alCambiar} />}
    </div>
  )
}

export default Admin
