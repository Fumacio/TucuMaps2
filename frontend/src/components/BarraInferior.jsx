import { NavLink } from 'react-router-dom'

const TRAZO = {
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
}

function IconoAgenda() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" {...TRAZO}>
      <rect x="3" y="5" width="18" height="16" rx="3" />
      <path d="M3 10h18M8 3v4M16 3v4" />
      <path d="m12 12.5 1.1 2.2 2.4.3-1.8 1.7.5 2.4-2.2-1.2-2.2 1.2.5-2.4-1.8-1.7 2.4-.3z" />
    </svg>
  )
}

function IconoMapa() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" {...TRAZO}>
      <path d="M12 21s-6-5.5-6-11a6 6 0 0 1 12 0c0 5.5-6 11-6 11z" />
      <circle cx="12" cy="10" r="2.5" />
    </svg>
  )
}

function IconoCuenta() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" {...TRAZO}>
      <circle cx="12" cy="12" r="9.5" />
      <circle cx="12" cy="10" r="3" />
      <path d="M6.5 18.5a6.5 6.5 0 0 1 11 0" />
    </svg>
  )
}

function BarraInferior() {
  return (
    <nav className="barra-inferior" aria-label="Navegación principal">
      <NavLink to="/agenda" className="barra-inferior__boton">
        <IconoAgenda />
        <span>Agenda</span>
      </NavLink>
      <NavLink to="/" end className="barra-inferior__boton">
        <IconoMapa />
        <span>Mapa</span>
      </NavLink>
      {/* Todavía no hay sección de cuenta: solo el ícono. */}
      <button
        type="button"
        className="barra-inferior__boton barra-inferior__boton--pronto"
        aria-label="Cuenta (próximamente)"
        title="Próximamente"
        disabled
      >
        <IconoCuenta />
        <span>Cuenta</span>
      </button>
    </nav>
  )
}

export default BarraInferior
