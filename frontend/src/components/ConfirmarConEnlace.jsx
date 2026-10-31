import { useEffect, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import Cargando from './Cargando.jsx'
import { mensajeDeError } from './formularios.js'

// RF-03, RF-25: pantalla que abre un enlace de un correo (?token=...) y lo confirma con la API.
// El token sirve una sola vez: el ref evita mandarlo dos veces (React, en desarrollo, arranca
// cada efecto dos veces y el segundo pedido fallaría con TOKEN_INVALIDO).
function ConfirmarConEnlace({ titulo, confirmar, alConfirmar, exito, siFalla }) {
  const [busqueda] = useSearchParams()
  const token = busqueda.get('token')
  const [estado, setEstado] = useState(token ? 'confirmando' : 'sin-token')
  const [error, setError] = useState(null)
  const enviado = useRef(false)

  useEffect(() => {
    if (!token || enviado.current) return
    enviado.current = true
    confirmar(token)
      .then(() => {
        setEstado('listo')
        alConfirmar?.()
      })
      .catch((err) => {
        setError(err)
        setEstado('error')
      })
  }, [token, confirmar, alConfirmar])

  return (
    <div className="fondo-cuenta">
      <div className="formulario formulario--tarjeta">
        <h1>{titulo}</h1>
        {estado === 'confirmando' && <Cargando />}
        {estado === 'listo' && (
          <p className="formulario__exito" role="status">
            {exito}
          </p>
        )}
        {estado === 'error' && (
          <p className="formulario__error" role="alert">
            {mensajeDeError(error)}
          </p>
        )}
        {estado === 'sin-token' && (
          <p className="formulario__error" role="alert">
            El enlace está incompleto. Abrilo de nuevo desde el correo.
          </p>
        )}
        {(estado === 'error' || estado === 'sin-token') && siFalla}
        {estado !== 'confirmando' && (
          <Link to="/" className="boton-principal">
            Ir al mapa
          </Link>
        )}
      </div>
    </div>
  )
}

export default ConfirmarConEnlace
