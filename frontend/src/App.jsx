import { useState } from 'react'
import Mapa from './components/Mapa.jsx'
import PanelDetalle from './components/PanelDetalle.jsx'

function App() {
  // id del lugar cuyo detalle se está mirando; null = panel cerrado.
  const [lugarId, setLugarId] = useState(null)

  return (
    <main className="app">
      <Mapa onSeleccionarLugar={setLugarId} />
      {lugarId !== null && (
        // key: al tocar otro lugar, el panel arranca de cero (vuelve a mostrar "Cargando…").
        <PanelDetalle key={lugarId} lugarId={lugarId} onCerrar={() => setLugarId(null)} />
      )}
    </main>
  )
}

export default App
