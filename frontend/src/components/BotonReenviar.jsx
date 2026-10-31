import { useState } from 'react'
import { reenviarVerificacion } from '../api/auth.js'

// RF-03: reenvía el enlace de verificación (la API permite 3 por hora; el 429 se muestra tal cual).
function BotonReenviar({ className = '' }) {
  const [estado, setEstado] = useState('listo')
  const [error, setError] = useState(null)

  async function reenviar() {
    setEstado('enviando')
    setError(null)
    try {
      await reenviarVerificacion()
      setEstado('enviado')
    } catch (err) {
      setError(err)
      setEstado('listo')
    }
  }

  if (estado === 'enviado') {
    return (
      <span className={className} role="status">
        Te mandamos otro enlace. Revisá también el correo no deseado.
      </span>
    )
  }

  return (
    <>
      <button type="button" className={className} onClick={reenviar} disabled={estado === 'enviando'}>
        {estado === 'enviando' ? 'Reenviando…' : 'Reenviar el correo'}
      </button>
      {error && <span role="alert">{error.mensaje}</span>}
    </>
  )
}

export default BotonReenviar
