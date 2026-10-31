import { Suspense, lazy, useEffect, useRef } from 'react'
import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import BarraInferior from './components/BarraInferior.jsx'
import BarraSuperior from './components/BarraSuperior.jsx'
import Cargando from './components/Cargando.jsx'
import Agenda from './pages/Agenda.jsx'
import Ingresar from './pages/Ingresar.jsx'
import Registro from './pages/Registro.jsx'
import VistaMapa from './pages/VistaMapa.jsx'
import { PANTALLAS_DE_CUENTA } from './rutas.js'

// Se descarga recién al abrir Términos o Privacidad: react-markdown pesa y el mapa no lo usa.
const Legal = lazy(() => import('./pages/Legal.jsx'))

function App() {
  const contenido = useRef(null)
  const { pathname } = useLocation()

  // Al cambiar de página se empieza desde arriba (el scroll es de esta caja, no de la ventana).
  useEffect(() => {
    contenido.current?.scrollTo?.(0, 0)
  }, [pathname])

  return (
    <div className="app">
      <BarraSuperior />
      <main className="app__contenido" ref={contenido}>
        <Suspense fallback={<Cargando className="agenda__aviso" />}>
          <Routes>
            <Route path="/" element={<VistaMapa />} />
            <Route path="/agenda" element={<Agenda />} />
            <Route path="/ingresar" element={<Ingresar />} />
            <Route path="/registro" element={<Registro />} />
            <Route path="/terminos" element={<Legal key="terminos" documento="terminos" />} />
            <Route path="/privacidad" element={<Legal key="privacidad" documento="privacidad" />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </main>
      {/* Las pantallas de cuenta no llevan la barra de abajo (Pantallas, 3). */}
      {!PANTALLAS_DE_CUENTA.includes(pathname) && <BarraInferior />}
    </div>
  )
}

export default App
