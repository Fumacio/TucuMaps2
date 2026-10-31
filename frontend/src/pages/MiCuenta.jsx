import { useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { cerrarSesionEnTodos } from '../api/auth.js'
import { cambiarNombre, cambiarPassword, darDeBaja, pedirCambioDeEmail } from '../api/cuenta.js'
import AvatarUsuario from '../components/AvatarUsuario.jsx'
import Campo from '../components/Campo.jsx'
import Cargando from '../components/Cargando.jsx'
import { errorDePassword, separarErrores } from '../components/formularios.js'
import { useSesion } from '../context/sesion.js'

// Lo común a los formularios de esta pantalla: enviar, esperar y guardar el error o el éxito.
// Si la sesión ya no existe (401: se cerró desde otro dispositivo o venció), la borra acá
// también, y Mi cuenta lleva al login.
function useEnvio(campos) {
  const { entrar } = useSesion()
  const [enviando, setEnviando] = useState(false)
  const [error, setError] = useState(null)
  const [exito, setExito] = useState(null)

  async function enviar(accion, mensajeExito) {
    setEnviando(true)
    setError(null)
    setExito(null)
    try {
      await accion()
      setExito(mensajeExito)
      return true
    } catch (err) {
      if (err?.codigo === 'NO_AUTENTICADO') entrar(null)
      else setError(err)
      return false
    } finally {
      setEnviando(false)
    }
  }

  const { porCampo, general } = separarErrores(error, campos)
  return { enviando, error, errores: porCampo, errorGeneral: general, exito, enviar, limpiar: () => setExito(null) }
}

function Resultado({ errorGeneral, exito }) {
  return (
    <>
      {errorGeneral && (
        <p className="formulario__error" role="alert">
          {errorGeneral}
        </p>
      )}
      {exito && (
        <p className="formulario__exito" role="status">
          {exito}
        </p>
      )}
    </>
  )
}

// RF-25
function CambiarNombre({ usuario, entrar }) {
  const [nombre, setNombre] = useState(usuario.nombre)
  const { enviando, errores, errorGeneral, exito, enviar, limpiar } = useEnvio(['nombre'])

  function guardar(evento) {
    evento.preventDefault()
    enviar(async () => entrar(await cambiarNombre(nombre.trim())), 'Listo, tu nombre cambió.')
  }

  return (
    <form className="cuenta__formulario" onSubmit={guardar} noValidate>
      <Resultado errorGeneral={errorGeneral} exito={exito} />
      <Campo
        etiqueta="Nombre"
        autoComplete="name"
        value={nombre}
        onChange={(e) => {
          setNombre(e.target.value)
          limpiar() // el "Listo" era del nombre anterior
        }}
        error={errores.nombre}
      />
      <button type="submit" className="boton-principal" disabled={enviando}>
        {enviando ? 'Guardando…' : 'Guardar el nombre'}
      </button>
    </form>
  )
}

// RF-25: el email no cambia hasta que se abre el enlace que llega al nuevo (/confirmar-email).
function CambiarEmail() {
  const [emailNuevo, setEmailNuevo] = useState('')
  const [password, setPassword] = useState('')
  const { enviando, error, errores, errorGeneral, exito, enviar, limpiar } = useEnvio([
    'email_nuevo',
    'password',
  ])
  // Un email que ya usa otra cuenta (409) se muestra debajo del email nuevo.
  const emailEnUso = error?.codigo === 'EMAIL_EN_USO'

  async function guardar(evento) {
    evento.preventDefault()
    const email = emailNuevo.trim()
    const ok = await enviar(
      () => pedirCambioDeEmail({ emailNuevo: email, password }),
      `Te mandamos un enlace a ${email}. Tu email cambia cuando lo abras (vence en 24 horas).`,
    )
    if (ok) setPassword('')
  }

  return (
    <form className="cuenta__formulario" onSubmit={guardar} noValidate>
      <Resultado errorGeneral={emailEnUso ? null : errorGeneral} exito={exito} />
      <Campo
        etiqueta="Email nuevo"
        type="email"
        autoComplete="email"
        value={emailNuevo}
        onChange={(e) => {
          setEmailNuevo(e.target.value)
          limpiar()
        }}
        error={emailEnUso ? error.mensaje : errores.email_nuevo}
      />
      <Campo
        etiqueta="Tu contraseña"
        type="password"
        autoComplete="current-password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        error={errores.password}
      />
      <button type="submit" className="boton-principal" disabled={enviando}>
        {enviando ? 'Enviando…' : 'Cambiar el email'}
      </button>
    </form>
  )
}

// RF-01: cambia la contraseña; la API cierra las sesiones de los otros dispositivos.
function CambiarPassword() {
  const [actual, setActual] = useState('')
  const [nueva, setNueva] = useState('')
  const [errorLocal, setErrorLocal] = useState(null)
  const { enviando, errores, errorGeneral, exito, enviar } = useEnvio([
    'password_actual',
    'password_nueva',
  ])

  async function guardar(evento) {
    evento.preventDefault()
    const errorPassword = errorDePassword(nueva)
    setErrorLocal(errorPassword)
    if (errorPassword) return
    const ok = await enviar(
      () => cambiarPassword({ actual, nueva }),
      'Listo, tu contraseña cambió. Cerramos la sesión en tus otros dispositivos.',
    )
    if (ok) {
      setActual('')
      setNueva('')
    }
  }

  return (
    <form className="cuenta__formulario" onSubmit={guardar} noValidate>
      <Resultado errorGeneral={errorGeneral} exito={exito} />
      <Campo
        etiqueta="Contraseña actual"
        type="password"
        autoComplete="current-password"
        value={actual}
        onChange={(e) => setActual(e.target.value)}
        error={errores.password_actual}
      />
      <Campo
        etiqueta="Contraseña nueva"
        type="password"
        autoComplete="new-password"
        ayuda="Mínimo 8 caracteres, con al menos una letra y un número."
        value={nueva}
        onChange={(e) => setNueva(e.target.value)}
        error={errorLocal ?? errores.password_nueva}
      />
      <button type="submit" className="boton-principal" disabled={enviando}>
        {enviando ? 'Guardando…' : 'Cambiar la contraseña'}
      </button>
    </form>
  )
}

// RF-24: borra la cuenta. Pide la contraseña y una confirmación, porque no se puede deshacer.
function BorrarCuenta({ alBorrar }) {
  const [password, setPassword] = useState('')
  const [seguro, setSeguro] = useState(false)
  const { enviando, errores, errorGeneral, enviar } = useEnvio(['password'])

  async function borrar(evento) {
    evento.preventDefault()
    if (await enviar(() => darDeBaja(password), null)) alBorrar()
  }

  return (
    <form className="cuenta__formulario" onSubmit={borrar} noValidate>
      <p className="formulario__intro">
        Se borran tu cuenta y tus confirmaciones. Tus reportes y eventos quedan publicados sin tu
        nombre. <strong>No se puede deshacer.</strong>
      </p>
      <Resultado errorGeneral={errorGeneral} />
      <Campo
        etiqueta="Tu contraseña"
        type="password"
        autoComplete="current-password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        error={errores.password}
      />
      <label className="cuenta__confirmar">
        <input type="checkbox" checked={seguro} onChange={(e) => setSeguro(e.target.checked)} />
        Entiendo que mi cuenta se borra para siempre.
      </label>
      <button type="submit" className="boton-peligro" disabled={!seguro || enviando}>
        {enviando ? 'Borrando…' : 'Borrar mi cuenta'}
      </button>
    </form>
  )
}

// RF-01, RF-24, RF-25: Mi cuenta (Pantallas, 4). Sin sesión, lleva al login.
function MiCuenta() {
  const { usuario, cargando, entrar, salir } = useSesion()
  const navegar = useNavigate()
  const [errorSesion, setErrorSesion] = useState(null)
  const [cerrando, setCerrando] = useState(false)
  // Al salir a propósito (cerrar sesión o borrar la cuenta) se va al mapa. Sin esto, React dibuja
  // antes "sin sesión" que el cambio de pantalla (la navegación es de baja prioridad) y esta
  // pantalla mandaría al login.
  const [saliendo, setSaliendo] = useState(false)

  if (cargando) return <Cargando className="agenda__aviso" />
  if (!usuario) {
    return saliendo ? null : <Navigate to="/ingresar" state={{ desde: '/cuenta' }} replace />
  }

  // `cerrar` termina sin sesión: si falla, se queda acá y muestra el error.
  async function salirCon(cerrar) {
    setErrorSesion(null)
    setCerrando(true)
    setSaliendo(true)
    try {
      await cerrar()
      navegar('/', { replace: true })
    } catch (err) {
      setSaliendo(false)
      setErrorSesion(err)
    } finally {
      setCerrando(false)
    }
  }

  function alBorrar() {
    setSaliendo(true)
    navegar('/', { replace: true })
    entrar(null)
  }

  return (
    <div className="cuenta">
      <header className="cuenta__encabezado">
        <AvatarUsuario />
        <div>
          <h1>{usuario.nombre}</h1>
          <p className="cuenta__email">
            {usuario.email}{' '}
            <span className={`cuenta__estado${usuario.email_verificado ? ' cuenta__estado--ok' : ''}`}>
              {usuario.email_verificado ? 'Verificado' : 'Sin verificar'}
            </span>
          </p>
        </div>
      </header>

      <ul className="cuenta__opciones">
        <li>
          {/* Mis envíos llega con el #63. */}
          <span className="cuenta__opcion cuenta__opcion--pronto" title="Próximamente">
            Mis envíos <small>(próximamente)</small>
          </span>
        </li>
        <li>
          <details className="cuenta__opcion">
            <summary>Cambiar nombre</summary>
            <CambiarNombre usuario={usuario} entrar={entrar} />
          </details>
        </li>
        <li>
          <details className="cuenta__opcion">
            <summary>Cambiar email</summary>
            <CambiarEmail />
          </details>
        </li>
        <li>
          <details className="cuenta__opcion">
            <summary>Cambiar contraseña</summary>
            <CambiarPassword />
          </details>
        </li>
        <li>
          <details className="cuenta__opcion cuenta__opcion--peligro">
            <summary>Borrar cuenta</summary>
            <BorrarCuenta alBorrar={alBorrar} />
          </details>
        </li>
      </ul>

      <div className="cuenta__sesion">
        {errorSesion && (
          <p className="formulario__error" role="alert">
            {errorSesion.mensaje}
          </p>
        )}
        <button type="button" className="boton-secundario" onClick={() => salirCon(salir)} disabled={cerrando}>
          {cerrando ? 'Cerrando…' : 'Cerrar sesión'}
        </button>
        <button
          type="button"
          className="cuenta__todos"
          disabled={cerrando}
          onClick={() =>
            salirCon(async () => {
              await cerrarSesionEnTodos()
              entrar(null) // la API también borró la cookie de este navegador
            })
          }
        >
          Cerrar sesión en todos mis dispositivos
        </button>
      </div>
    </div>
  )
}

export default MiCuenta
