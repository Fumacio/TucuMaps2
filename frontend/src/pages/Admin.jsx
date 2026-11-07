import { useSearchParams } from 'react-router-dom'
import ModeracionEventos from '../components/ModeracionEventos.jsx'
import ModeracionReportes from '../components/ModeracionReportes.jsx'
import SoloAdmin from '../components/SoloAdmin.jsx'

const PESTANAS = [
  ['reportes', 'Reportes'],
  ['eventos', 'Eventos'],
]

// RF-08, RF-13, RF-15: panel de administración. La pestaña va en la dirección (?pestana=eventos)
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
  const pestana = busqueda.get('pestana') === 'eventos' ? 'eventos' : 'reportes'

  return (
    <div className="moderacion">
      <h1 className="agenda__titulo">Panel de administración</h1>
      <div className="mis-envios__filtros moderacion__pestanas" role="group" aria-label="Qué moderar">
        {PESTANAS.map(([valor, etiqueta]) => (
          <button
            key={valor}
            type="button"
            aria-pressed={pestana === valor}
            onClick={() => setBusqueda({ pestana: valor }, { replace: true })}
          >
            {etiqueta}
          </button>
        ))}
      </div>
      {pestana === 'eventos' ? <ModeracionEventos /> : <ModeracionReportes />}
    </div>
  )
}

export default Admin
