import { Link, NavLink, useLocation } from 'react-router-dom'
import logo from '../assets/logo.png'
import { useSesion } from '../context/sesion.js'
import { PANTALLAS_DE_CUENTA } from '../rutas.js'

// Navbar (Pantallas, 1). Con sesión, "Iniciar sesión" se reemplaza por "Enviar reporte" y
// "Proponer evento"; Mi cuenta queda en la barra de abajo. El administrador no envía (RF-07):
// ve su saludo.
function BarraSuperior() {
  const { usuario, cargando } = useSesion()
  const { pathname } = useLocation()
  const enPantallaDeCuenta = PANTALLAS_DE_CUENTA.includes(pathname)
  const puedeEnviar = usuario && usuario.rol !== 'admin'
  const conEnvios = puedeEnviar && !enPantallaDeCuenta && !cargando

  return (
    <header className={conEnvios ? 'barra-superior barra-superior--envios' : 'barra-superior'}>
      <Link to="/" className="barra-superior__marca">
        <img src={logo} alt="" className="barra-superior__logo" />
        <span>TUCUMAPS</span>
      </Link>
      {enPantallaDeCuenta ? (
        <Link to="/" className="barra-superior__sesion">
          Volver al mapa
        </Link>
      ) : (
        // Mientras se pregunta la sesión no se muestra nada, para que no "salte" el botón.
        !cargando &&
        (puedeEnviar ? (
          <nav className="barra-superior__envios" aria-label="Enviar">
            <NavLink to="/reportar" className="barra-superior__envio">
              Enviar reporte
            </NavLink>
            <NavLink to="/proponer-evento" className="barra-superior__envio">
              Proponer evento
            </NavLink>
          </nav>
        ) : usuario ? (
          <Link to="/cuenta" className="barra-superior__saludo" title="Mi cuenta">
            Hola, {usuario.nombre.split(' ')[0]}
          </Link>
        ) : (
          <Link to="/ingresar" state={{ desde: pathname }} className="barra-superior__sesion">
            Iniciar sesión
          </Link>
        ))
      )}
    </header>
  )
}

export default BarraSuperior
