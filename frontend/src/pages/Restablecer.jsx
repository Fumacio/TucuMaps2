import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { restablecerPassword } from '../api/auth.js'
import Campo from '../components/Campo.jsx'
import { errorDePassword, esEnlaceInvalido, separarErrores } from '../components/formularios.js'
import { useSesion } from '../context/sesion.js'

// RF-03: elige la contraseña nueva con el token del enlace (vence a la hora y sirve una vez).
// La API cierra todas las sesiones abiertas, también la de este navegador si había una.
function Restablecer() {
  const { actualizar } = useSesion()
  const [busqueda] = useSearchParams()
  const token = busqueda.get('token')
  const [password, setPassword] = useState('')
  const [errorLocal, setErrorLocal] = useState(null)
  const [enviando, setEnviando] = useState(false)
  const [listo, setListo] = useState(false)
  const [error, setError] = useState(null)

  async function enviar(evento) {
    evento.preventDefault()
    setError(null)
    const errorPassword = errorDePassword(password)
    setErrorLocal(errorPassword)
    if (errorPassword) return

    setEnviando(true)
    try {
      await restablecerPassword({ token, password })
      setListo(true)
      actualizar()
    } catch (err) {
      setError(err)
    } finally {
      setEnviando(false)
    }
  }

  const { porCampo: errores, general: errorGeneral } = separarErrores(error, ['password'])

  return (
    <div className="fondo-cuenta">
      <form className="formulario formulario--tarjeta" onSubmit={enviar} noValidate>
        <h1>Elegí una contraseña nueva</h1>
        {!token && (
          <p className="formulario__error" role="alert">
            El enlace está incompleto. Abrilo de nuevo desde el correo o{' '}
            <Link to="/recuperar">pedí otro</Link>.
          </p>
        )}
        {token && listo && (
          <>
            <p className="formulario__exito" role="status">
              Tu contraseña cambió. Por seguridad cerramos la sesión en todos tus dispositivos.
            </p>
            <Link to="/ingresar" className="boton-principal">
              Iniciar sesión
            </Link>
          </>
        )}
        {token && !listo && (
          <>
            {errorGeneral && (
              <p className="formulario__error" role="alert">
                {errorGeneral}
                {esEnlaceInvalido(error) && (
                  <>
                    {' '}
                    <Link to="/recuperar">Pedí un enlace nuevo</Link>.
                  </>
                )}
              </p>
            )}
            <Campo
              etiqueta="Contraseña nueva"
              type="password"
              autoComplete="new-password"
              ayuda="Mínimo 8 caracteres, con al menos una letra y un número."
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              error={errorLocal ?? errores.password}
            />
            <button type="submit" className="boton-principal" disabled={enviando}>
              {enviando ? 'Guardando…' : 'Guardar la contraseña'}
            </button>
          </>
        )}
      </form>
    </div>
  )
}

export default Restablecer
