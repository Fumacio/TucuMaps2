import { useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { registrarse } from '../api/auth.js'
import Campo from '../components/Campo.jsx'
import CasillaTerminos from '../components/CasillaTerminos.jsx'
import { errorDePassword, erroresPorCampo } from '../components/formularios.js'
import { useSesion } from '../context/sesion.js'

const AYUDA_PASSWORD = 'Mínimo 8 caracteres, con al menos una letra y un número.'

// RF-01, RF-03, RF-04: crear una cuenta (Pantallas, 3). Queda con la sesión iniciada y llega un
// correo para verificar el email.
function Registro() {
  const { usuario, entrar } = useSesion()
  const navegar = useNavigate()
  const [datos, setDatos] = useState({ nombre: '', email: '', password: '' })
  const [aceptaTerminos, setAceptaTerminos] = useState(false)
  const [enviando, setEnviando] = useState(false)
  const [error, setError] = useState(null)
  const [erroresLocales, setErroresLocales] = useState({})

  if (usuario && !enviando) return <Navigate to="/" replace />

  function cambiar(evento) {
    const { name, value } = evento.target
    setDatos((anteriores) => ({ ...anteriores, [name]: value }))
  }

  // RF-01: lo que se puede revisar antes de enviar (el servidor lo vuelve a validar).
  function revisar() {
    const errores = {}
    const errorPassword = errorDePassword(datos.password)
    if (errorPassword) errores.password = errorPassword
    if (!aceptaTerminos) errores.terminos = 'Tenés que aceptar los términos de uso'
    return errores
  }

  async function enviar(evento) {
    evento.preventDefault()
    setError(null)
    const errores = revisar()
    setErroresLocales(errores)
    if (Object.keys(errores).length > 0) return

    setEnviando(true)
    try {
      entrar(
        await registrarse({
          nombre: datos.nombre.trim(),
          email: datos.email.trim(),
          password: datos.password,
          aceptaTerminos,
        }),
      )
      navegar('/', { replace: true })
    } catch (err) {
      setError(err)
      setEnviando(false)
    }
  }

  const deLaApi = erroresPorCampo(error)
  // El email repetido viene como error general (409); se muestra debajo del correo.
  if (error?.codigo === 'EMAIL_EN_USO') deLaApi.email = error.mensaje
  const errores = {
    ...deLaApi,
    ...erroresLocales,
    terminos: erroresLocales.terminos ?? deLaApi.acepta_terminos ?? deLaApi.mayor_de_edad,
  }
  const errorGeneral = error && Object.keys(deLaApi).length === 0 ? error.mensaje : null

  return (
    <div className="fondo-cuenta">
      <div className="pagina-formulario pagina-formulario--con-bienvenida">
        <form className="formulario" onSubmit={enviar} noValidate>
          <h1>Creá tu cuenta de TucuMaps</h1>
          {errorGeneral && (
            <p className="formulario__error" role="alert">
              {errorGeneral}
            </p>
          )}
          <Campo
            etiqueta="Nombre"
            name="nombre"
            autoComplete="name"
            value={datos.nombre}
            onChange={cambiar}
            error={errores.nombre}
          />
          <Campo
            etiqueta="Correo"
            name="email"
            type="email"
            autoComplete="email"
            value={datos.email}
            onChange={cambiar}
            error={errores.email}
          />
          <Campo
            etiqueta="Contraseña"
            name="password"
            type="password"
            autoComplete="new-password"
            ayuda={AYUDA_PASSWORD}
            value={datos.password}
            onChange={cambiar}
            error={errores.password}
          />
          <CasillaTerminos marcada={aceptaTerminos} onCambiar={setAceptaTerminos} error={errores.terminos} />
          <button type="submit" className="boton-principal" disabled={enviando}>
            {enviando ? 'Creando la cuenta…' : 'Crear cuenta'}
          </button>
          <p className="formulario__pie">
            ¿Ya tenés cuenta? <Link to="/ingresar">Iniciar sesión</Link>
          </p>
        </form>
      </div>
    </div>
  )
}

export default Registro
