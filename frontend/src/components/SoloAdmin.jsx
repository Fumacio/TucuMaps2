import { Link, Navigate, useLocation } from 'react-router-dom'
import { useSesion } from '../context/sesion.js'
import Cargando from './Cargando.jsx'

// RF-15: las pantallas del panel. Esto solo decide qué mostrar: los datos los protege el backend.
function SoloAdmin({ children }) {
  const { usuario, cargando } = useSesion()
  const { pathname, search, state } = useLocation()

  if (cargando) return <Cargando className="agenda__aviso" />
  if (!usuario) {
    return <Navigate to="/ingresar" state={{ desde: `${pathname}${search}`, estadoDesde: state }} replace />
  }
  if (usuario.rol !== 'admin') {
    return (
      <div className="pagina-formulario">
        <div className="formulario">
          <h1>Panel de administración</h1>
          <p className="formulario__error" role="alert">
            No tenés permiso para ver esta pantalla.
          </p>
          <Link to="/" className="boton-principal">
            Volver al mapa
          </Link>
        </div>
      </div>
    )
  }
  return children
}

export default SoloAdmin
