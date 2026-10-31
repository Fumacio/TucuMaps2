import { Link } from 'react-router-dom'
import logo from '../assets/logo.png'
import { useSesion } from '../context/sesion.js'

// Navbar (Pantallas, 1). Con sesión, más adelante "Iniciar sesión" se reemplaza por
// "Enviar reporte" y "Proponer evento" (#62).
function BarraSuperior() {
  const { usuario, cargando } = useSesion()

  return (
    <header className="barra-superior">
      <Link to="/" className="barra-superior__marca">
        <img src={logo} alt="" className="barra-superior__logo" />
        <span>TUCUMAPS</span>
      </Link>
      {/* Mientras se pregunta la sesión no se muestra nada, para que no "salte" el botón. */}
      {!cargando && usuario && (
        <span className="barra-superior__saludo">Hola, {usuario.nombre.split(' ')[0]}</span>
      )}
      {!cargando && !usuario && (
        // Todavía no hay pantalla de login.
        <button type="button" className="barra-superior__sesion" title="Próximamente" disabled>
          Iniciar sesión
        </button>
      )}
    </header>
  )
}

export default BarraSuperior
