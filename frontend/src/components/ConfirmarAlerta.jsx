import { useState } from 'react'
import { Link } from 'react-router-dom'
import { confirmarAlerta } from '../api/reportes.js'
import { useSesion } from '../context/sesion.js'

// RF-14: confirmar una alerta ("yo también lo vi"). Solo vecinos con el email verificado; el
// administrador no confirma. La API no dice de antemano si la alerta es propia o ya se confirmó:
// en esos casos responde 403 o 409 y se muestra su mensaje. `confirmada` la guarda el marcador,
// porque el globito se desarma al cerrarse.
function ConfirmarAlerta({ alerta, confirmada, onConfirmada }) {
  const { usuario, entrar } = useSesion()
  const [estado, setEstado] = useState('listo')
  const [error, setError] = useState(null)

  if (usuario?.rol === 'admin') return null
  if (!usuario) {
    return (
      <p className="popup-alerta__confirmar">
        <Link to="/ingresar" state={{ desde: '/', estadoDesde: { capa: 'seguridad' } }}>
          Iniciá sesión para confirmarla
        </Link>
      </p>
    )
  }
  if (!usuario.email_verificado) {
    return <p className="popup-alerta__confirmar">Verificá tu email para poder confirmarla.</p>
  }
  if (confirmada) {
    return (
      <p className="popup-alerta__confirmar" role="status">
        ¡Gracias por confirmarla!
      </p>
    )
  }

  async function confirmar() {
    setEstado('enviando')
    setError(null)
    try {
      const { confirmaciones } = await confirmarAlerta(alerta.id)
      onConfirmada(confirmaciones)
    } catch (err) {
      // La sesión se cerró en otro lado: se ofrece iniciarla de nuevo.
      if (err?.codigo === 'NO_AUTENTICADO') return entrar(null)
      setError(err)
    } finally {
      setEstado('listo')
    }
  }

  return (
    <div className="popup-alerta__confirmar">
      <button type="button" className="boton-principal" onClick={confirmar} disabled={estado === 'enviando'}>
        {estado === 'enviando' ? 'Confirmando…' : 'Confirmar'}
      </button>
      {error && (
        <p className="popup-alerta__error" role="alert">
          {error.mensaje}
        </p>
      )}
    </div>
  )
}

export default ConfirmarAlerta
