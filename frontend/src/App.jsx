import { useCallback, useState } from 'react'
import Mapa from './components/Mapa.jsx'
import PanelDetalle from './components/PanelDetalle.jsx'

function App() {
  // id del lugar cuyo detalle se está mirando; null = panel cerrado.
  const [lugarId, setLugarId] = useState(null)
  // useCallback: la misma función en cada dibujo, así el panel no rearma su escucha de Escape.
  const cerrarPanel = useCallback(() => setLugarId(null), [])

  return (
    <main className="app">
      <Mapa onSeleccionarLugar={setLugarId} />
      {lugarId !== null && (
        // key: al tocar otro lugar, el panel arranca de cero (vuelve a mostrar "Cargando…").
        <PanelDetalle key={lugarId} lugarId={lugarId} onCerrar={cerrarPanel} />
      )}
    </main>
  )
}

export default App
