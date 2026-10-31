import { useState } from 'react'
import { Link } from 'react-router-dom'
import { pedirRecuperacion } from '../api/auth.js'
import Campo from '../components/Campo.jsx'
import { separarErrores } from '../components/formularios.js'

// RF-03: pide el enlace para elegir una contraseña nueva. La API responde lo mismo exista o no
// la cuenta (no revela qué emails están registrados), así que el mensaje tampoco lo dice.
function Recuperar() {
  const [email, setEmail] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [enviado, setEnviado] = useState(false)
  const [error, setError] = useState(null)

  async function enviar(evento) {
    evento.preventDefault()
    setEnviando(true)
    setError(null)
    try {
      await pedirRecuperacion(email.trim())
      setEnviado(true)
    } catch (err) {
      setError(err)
    } finally {
      setEnviando(false)
    }
  }

  const { porCampo: errores, general: errorGeneral } = separarErrores(error, ['email'])

  return (
    <div className="fondo-cuenta">
      <form className="formulario formulario--tarjeta" onSubmit={enviar} noValidate>
        <h1>Recuperar contraseña</h1>
        {enviado ? (
          <p className="formulario__exito" role="status">
            Si hay una cuenta con <strong>{email.trim()}</strong>, te mandamos un enlace para elegir una
            contraseña nueva. Vence en 1 hora; revisá también el correo no deseado.
          </p>
        ) : (
          <>
            <p className="formulario__intro">
              Escribí el correo de tu cuenta y te mandamos un enlace para elegir una contraseña nueva.
            </p>
            {errorGeneral && (
              <p className="formulario__error" role="alert">
                {errorGeneral}
              </p>
            )}
            <Campo
              etiqueta="Correo"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              error={errores.email}
            />
            <button type="submit" className="boton-principal" disabled={enviando}>
              {enviando ? 'Enviando…' : 'Enviar el enlace'}
            </button>
          </>
        )}
        <p className="formulario__pie">
          <Link to="/ingresar">Volver a iniciar sesión</Link>
        </p>
      </form>
    </div>
  )
}

export default Recuperar
