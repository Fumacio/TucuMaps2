import { useCallback, useState } from 'react'
import Mapa from './components/Mapa.jsx'
import PanelDetalle from './components/PanelDetalle.jsx'

function App() {
  // RF-02: capa que muestra el mapa, 'turismo' o 'seguridad'.
  const [capa, setCapa] = useState('turismo')
  // id del lugar cuyo detalle se está mirando; null = panel cerrado.
  const [lugarId, setLugarId] = useState(null)
  // useCallback: la misma función en cada dibujo, así el panel no rearma su escucha de Escape.
  const cerrarPanel = useCallback(() => setLugarId(null), [])
  const enSeguridad = capa === 'seguridad'

  function alternarCapa() {
    setCapa(enSeguridad ? 'turismo' : 'seguridad')
    setLugarId(null)
  }

  return (
    <main className="app">
      <Mapa capa={capa} onSeleccionarLugar={setLugarId} />
      <button
        type="button"
        className="boton-seguridad"
        aria-pressed={enSeguridad}
        onClick={alternarCapa}
      >
        <span className="boton-seguridad__sirena" aria-hidden="true" />
        Seguridad
      </button>
      {lugarId !== null && (
        // key: al tocar otro lugar, el panel arranca de cero (vuelve a mostrar "Cargando…").
        <PanelDetalle key={lugarId} lugarId={lugarId} onCerrar={cerrarPanel} />
      )}
    </main>
  )
}

export default App
