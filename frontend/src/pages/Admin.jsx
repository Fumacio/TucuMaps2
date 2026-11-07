import { Link, Navigate } from 'react-router-dom'
import Cargando from '../components/Cargando.jsx'
import ModeracionReportes from '../components/ModeracionReportes.jsx'
import { useSesion } from '../context/sesion.js'

// RF-15: panel de administración. Esto solo decide qué mostrar: los datos los protege el backend.
function Admin() {
  const { usuario, cargando } = useSesion()

  if (cargando) return <Cargando className="agenda__aviso" />
  if (!usuario) return <Navigate to="/ingresar" state={{ desde: '/admin' }} replace />
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

  return (
    <div className="moderacion">
      <h1 className="agenda__titulo">Panel de administración</h1>
      <ModeracionReportes />
    </div>
  )
}

export default Admin
