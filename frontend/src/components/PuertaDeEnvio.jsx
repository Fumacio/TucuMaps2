import { Link, useLocation } from 'react-router-dom'
import { useSesion } from '../context/sesion.js'
import BotonReenviar from './BotonReenviar.jsx'
import Cargando from './Cargando.jsx'

// RF-07: solo un vecino con sesión y email verificado envía reportes o propone eventos.
// `accion` completa la frase: "Para {accion} tenés que…".
function PuertaDeEnvio({ titulo, accion, children }) {
  const { usuario, cargando } = useSesion()
  const { pathname } = useLocation()

  if (cargando) return <Cargando className="agenda__aviso" />
  if (usuario?.email_verificado && usuario.rol !== 'admin') return children

  return (
    <div className="pagina-formulario">
      <div className="formulario">
        <h1>{titulo}</h1>
        {!usuario && (
          <>
            <p className="formulario__intro">Para {accion} tenés que iniciar sesión.</p>
            <Link to="/ingresar" state={{ desde: pathname }} className="boton-principal">
              Iniciar sesión
            </Link>
          </>
        )}
        {usuario && usuario.rol === 'admin' && (
          <p className="formulario__intro">
            Los administradores no envían reportes ni proponen eventos: los revisan desde el panel.
          </p>
        )}
        {usuario && usuario.rol !== 'admin' && (
          <>
            <p className="formulario__intro">
              Para {accion} tenés que verificar tu email. Abrí el enlace que te mandamos a{' '}
              <strong>{usuario.email}</strong>.
            </p>
            <BotonReenviar className="boton-principal" />
          </>
        )}
        <Link to="/" className="boton-secundario">
          Volver al mapa
        </Link>
      </div>
    </div>
  )
}

export default PuertaDeEnvio
