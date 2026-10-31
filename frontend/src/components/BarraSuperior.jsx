import { Link, useLocation } from 'react-router-dom'
import logo from '../assets/logo.png'
import { useSesion } from '../context/sesion.js'
import { PANTALLAS_DE_CUENTA } from '../rutas.js'

// Navbar (Pantallas, 1). Con sesión, más adelante "Iniciar sesión" se reemplaza por
// "Enviar reporte" y "Proponer evento" (#62).
function BarraSuperior() {
  const { usuario, cargando } = useSesion()
  const { pathname } = useLocation()
  const enPantallaDeCuenta = PANTALLAS_DE_CUENTA.includes(pathname)

  return (
    <header className="barra-superior">
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
        (usuario ? (
          <span className="barra-superior__saludo">Hola, {usuario.nombre.split(' ')[0]}</span>
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
