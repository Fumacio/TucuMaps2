import { useState } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { iniciarSesion } from '../api/auth.js'
import Campo from '../components/Campo.jsx'
import { erroresPorCampo } from '../components/formularios.js'
import { useSesion } from '../context/sesion.js'
import PanelBienvenida from '../components/PanelBienvenida.jsx'

// RF-01: iniciar sesión (Pantallas, 3). Los errores de la API se muestran tal cual: contraseña
// incorrecta, cuenta bloqueada o demasiados intentos (429, con el tiempo de espera).
function Ingresar() {
  const { usuario, entrar } = useSesion()
  const navegar = useNavigate()
  const { state } = useLocation()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [error, setError] = useState(null)

  // Si ya hay sesión no tiene sentido esta pantalla.
  if (usuario && !enviando) return <Navigate to={state?.desde ?? '/'} replace />

  async function enviar(evento) {
    evento.preventDefault()
    setEnviando(true)
    setError(null)
    try {
      entrar(await iniciarSesion({ email: email.trim(), password }))
      navegar(state?.desde ?? '/', { replace: true })
    } catch (err) {
      setError(err)
      setEnviando(false)
    }
  }

  const errores = erroresPorCampo(error)
  const errorGeneral = error && Object.keys(errores).length === 0 ? error.mensaje : null

  return (
    <div className="fondo-cuenta">
      <div className="pagina-formulario pagina-formulario--con-bienvenida">
        <form className="formulario" onSubmit={enviar} noValidate>
          <h1>Ingresá tu cuenta de TucuMaps</h1>
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
          <Campo
            etiqueta="Contraseña"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            error={errores.password}
          />
          <Link to="/recuperar" className="formulario__enlace">
            Recuperar contraseña
          </Link>
          <div className="formulario__botones">
            <Link to="/registro" className="boton-secundario">
              Crear cuenta
            </Link>
            <button type="submit" className="boton-principal" disabled={enviando}>
              {enviando ? 'Entrando…' : 'Continuar'}
            </button>
          </div>
        </form>
        <PanelBienvenida />
      </div>
    </div>
  )
}

export default Ingresar
