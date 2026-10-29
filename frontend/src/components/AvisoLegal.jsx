import { Link } from 'react-router-dom'

// RF-04: aviso fijo en el mapa. En Seguridad, completo (texto de docs/Terminos de uso, "Textos de
// la interfaz"); en Turismo, una línea, para no tapar el mapa en el celular.
function AvisoLegal({ completo }) {
  return (
    <aside
      className={`aviso-legal${completo ? ' aviso-legal--completo' : ''}`}
      aria-label="Aviso legal"
    >
      {completo ? (
        <p>
          TucuMaps no es un servicio oficial y no reemplaza al <a href="tel:911">911</a>. Las alertas
          las envían usuarios y no están verificadas.
        </p>
      ) : (
        <p>TucuMaps no es un servicio oficial.</p>
      )}
      <EnlacesLegales />
    </aside>
  )
}

export function EnlacesLegales() {
  return (
    <span className="enlaces-legales">
      <Link to="/terminos">Términos</Link>
      {' · '}
      <Link to="/privacidad">Privacidad</Link>
    </span>
  )
}

export default AvisoLegal
