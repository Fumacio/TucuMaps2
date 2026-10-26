import { Link } from 'react-router-dom'
import logo from '../assets/logo.png'

// Navbar del usuario anónimo (Pantallas, 1). Con sesión, "Iniciar sesión" se reemplaza por
// "Enviar reporte" y "Proponer evento".
function BarraSuperior() {
  return (
    <header className="barra-superior">
      <Link to="/" className="barra-superior__marca">
        <img src={logo} alt="" className="barra-superior__logo" />
        <span>TUCUMAPS</span>
      </Link>
      {/* Todavía no hay pantalla de login. */}
      <button type="button" className="barra-superior__sesion" title="Próximamente" disabled>
        Iniciar sesión
      </button>
    </header>
  )
}

export default BarraSuperior
