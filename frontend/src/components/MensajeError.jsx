import { sePuedeReintentar } from '../api/cliente.js'

// RF-06: el mensaje viene de la API o, si no hubo respuesta, de cliente.js. Reintentar aparece
// solo si puede servir (sin conexión o falla del servidor, no un dato inválido).
function MensajeError({ error, onReintentar, className = '' }) {
  return (
    <div className={`mensaje-error ${className}`} role="alert">
      <span>{error.mensaje}</span>
      {onReintentar && sePuedeReintentar(error) && (
        <button type="button" className="mensaje-error__reintentar" onClick={onReintentar}>
          Reintentar
        </button>
      )}
    </div>
  )
}

export default MensajeError
