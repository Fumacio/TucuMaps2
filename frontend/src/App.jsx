import { Suspense, lazy, useEffect, useRef } from 'react'
import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import AvisoVerificacion from './components/AvisoVerificacion.jsx'
import BarraInferior from './components/BarraInferior.jsx'
import BarraSuperior from './components/BarraSuperior.jsx'
import Cargando from './components/Cargando.jsx'
import Agenda from './pages/Agenda.jsx'
import Ingresar from './pages/Ingresar.jsx'
import Registro from './pages/Registro.jsx'
import VistaMapa from './pages/VistaMapa.jsx'
import { PANTALLAS_DE_CUENTA, PANTALLAS_DE_ENLACE } from './rutas.js'

// Se descargan recién al abrirlas: la mayoría de las visitas son al mapa y no las usan
// (Términos y Privacidad, además, traen react-markdown, que pesa).
const Legal = lazy(() => import('./pages/Legal.jsx'))
const MiCuenta = lazy(() => import('./pages/MiCuenta.jsx'))
const Recuperar = lazy(() => import('./pages/Recuperar.jsx'))
const Restablecer = lazy(() => import('./pages/Restablecer.jsx'))
const VerificarEmail = lazy(() => import('./pages/VerificarEmail.jsx'))
const ConfirmarEmail = lazy(() => import('./pages/ConfirmarEmail.jsx'))

function App() {
  const contenido = useRef(null)
  const { pathname } = useLocation()
  const enPantallaDeCuenta = PANTALLAS_DE_CUENTA.includes(pathname)

  // Al cambiar de página se empieza desde arriba (el scroll es de esta caja, no de la ventana).
  useEffect(() => {
    contenido.current?.scrollTo?.(0, 0)
  }, [pathname])

  return (
    <div className="app">
      <BarraSuperior />
      {/* En las pantallas de los enlaces de correo el aviso sobra (ya se está confirmando). */}
      {!PANTALLAS_DE_ENLACE.includes(pathname) && <AvisoVerificacion />}
      <main className="app__contenido" ref={contenido}>
        <Suspense fallback={<Cargando className="agenda__aviso" />}>
          <Routes>
            <Route path="/" element={<VistaMapa />} />
            <Route path="/agenda" element={<Agenda />} />
            <Route path="/ingresar" element={<Ingresar />} />
            <Route path="/registro" element={<Registro />} />
            <Route path="/recuperar" element={<Recuperar />} />
            <Route path="/restablecer" element={<Restablecer />} />
            <Route path="/verificar-email" element={<VerificarEmail />} />
            <Route path="/confirmar-email" element={<ConfirmarEmail />} />
            <Route path="/cuenta" element={<MiCuenta />} />
            <Route path="/terminos" element={<Legal key="terminos" documento="terminos" />} />
            <Route path="/privacidad" element={<Legal key="privacidad" documento="privacidad" />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </main>
      {/* Las pantallas de cuenta no llevan la barra de abajo (Pantallas, 3). */}
      {!enPantallaDeCuenta && <BarraInferior />}
    </div>
  )
}

export default App
