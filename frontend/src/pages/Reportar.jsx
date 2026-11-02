import { useState } from 'react'
import { Link } from 'react-router-dom'
import { enviarReporte } from '../api/reportes.js'
import Campo from '../components/Campo.jsx'
import ElegirUbicacion from '../components/ElegirUbicacion.jsx'
import { separarErrores } from '../components/formularios.js'
import { TIPOS_ALERTA } from '../components/iconoAlerta.js'
import PuertaDeEnvio from '../components/PuertaDeEnvio.jsx'
import { useSesion } from '../context/sesion.js'

const VACIO = { tipo: '', descripcion: '', direccion: '', barrio: '' }

// RF-07, RF-09, RF-10: enviar un reporte de seguridad en 3 pasos (RNF-03): tocar "Enviar
// reporte", elegir el tipo y el punto, y enviar. Queda pendiente hasta que un administrador lo
// aprueba.
function Reportar() {
  return (
    <PuertaDeEnvio titulo="Enviar reporte" accion="enviar un reporte">
      <FormularioReporte />
    </PuertaDeEnvio>
  )
}

function FormularioReporte() {
  const { entrar } = useSesion()
  const [datos, setDatos] = useState(VACIO)
  const [ubicacion, setUbicacion] = useState(null)
  const [enviando, setEnviando] = useState(false)
  const [enviado, setEnviado] = useState(false)
  const [error, setError] = useState(null)
  const [erroresLocales, setErroresLocales] = useState({})

  // Al corregir un campo, su error se va.
  function olvidarError(campo) {
    setErroresLocales((anteriores) => ({ ...anteriores, [campo]: undefined }))
    setError(null)
  }

  function cambiar(evento) {
    const { name, value } = evento.target
    setDatos((anteriores) => ({ ...anteriores, [name]: value }))
    olvidarError(name)
  }

  function marcar(punto) {
    setUbicacion(punto)
    olvidarError('ubicacion')
  }

  function revisar() {
    const errores = {}
    if (!datos.tipo) errores.tipo = 'Elegí qué tipo de alerta es'
    const largo = datos.descripcion.trim().length
    if (largo < 10) errores.descripcion = 'Contá un poco más: al menos 10 caracteres'
    if (largo > 500) errores.descripcion = 'La descripción puede tener hasta 500 caracteres'
    if (!ubicacion) errores.ubicacion = 'Marcá en el mapa dónde pasó'
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
      await enviarReporte({
        tipo: datos.tipo,
        descripcion: datos.descripcion.trim(),
        direccion: datos.direccion.trim(),
        barrio: datos.barrio.trim(),
        lat: ubicacion.lat,
        lng: ubicacion.lng,
      })
      setEnviado(true)
    } catch (err) {
      // La sesión se cerró en otro lado: la puerta pasa a pedir que la inicie de nuevo.
      if (err?.codigo === 'NO_AUTENTICADO') return entrar(null)
      setError(err)
    } finally {
      setEnviando(false)
    }
  }

  function otroReporte() {
    setDatos(VACIO)
    setUbicacion(null)
    setErroresLocales({})
    setEnviado(false)
  }

  if (enviado) {
    return (
      <div className="pagina-formulario">
        <div className="formulario">
          <h1>¡Gracias por avisar!</h1>
          <p className="formulario__exito" role="status">
            Tu reporte quedó pendiente de revisión. No va a aparecer en el mapa hasta que un
            administrador lo apruebe.
          </p>
          <Link to="/" className="boton-principal">
            Volver al mapa
          </Link>
          <button type="button" className="boton-secundario" onClick={otroReporte}>
            Enviar otro reporte
          </button>
        </div>
      </div>
    )
  }

  const { porCampo: deLaApi, general } = separarErrores(error, [
    'tipo',
    'descripcion',
    'direccion',
    'barrio',
    'lat',
    'lng',
  ])
  const errores = {
    ...deLaApi,
    ...erroresLocales,
    ubicacion: erroresLocales.ubicacion ?? deLaApi.lat ?? deLaApi.lng,
  }

  return (
    <div className="pagina-formulario">
      <form className="formulario formulario--envio" onSubmit={enviar} noValidate>
        <h1>Enviar reporte</h1>
        <p className="formulario__intro">
          Un administrador lo revisa antes de mostrarlo en el mapa. No pongas datos personales.
        </p>
        {general && (
          <p className="formulario__error" role="alert">
            {general}
          </p>
        )}

        <fieldset className="elegir-tipo" aria-describedby={errores.tipo ? 'error-tipo' : undefined}>
          <legend>Tipo de alerta</legend>
          {Object.entries(TIPOS_ALERTA).map(([valor, { etiqueta, imagen }]) => (
            <label key={valor} className="elegir-tipo__opcion">
              <input
                type="radio"
                name="tipo"
                value={valor}
                checked={datos.tipo === valor}
                onChange={cambiar}
              />
              <img src={imagen} alt="" />
              <span>{etiqueta}</span>
            </label>
          ))}
          {errores.tipo && (
            <p id="error-tipo" className="campo__error">
              {errores.tipo}
            </p>
          )}
        </fieldset>

        <ElegirUbicacion valor={ubicacion} onCambiar={marcar} error={errores.ubicacion} />

        <Campo
          etiqueta="Qué pasó"
          name="descripcion"
          multilinea
          rows={4}
          maxLength={500}
          ayuda="Entre 10 y 500 caracteres."
          value={datos.descripcion}
          onChange={cambiar}
          error={errores.descripcion}
        />
        <Campo
          etiqueta="Dirección (opcional)"
          name="direccion"
          maxLength={200}
          autoComplete="off"
          value={datos.direccion}
          onChange={cambiar}
          error={errores.direccion}
        />
        <Campo
          etiqueta="Barrio (opcional)"
          name="barrio"
          maxLength={80}
          autoComplete="off"
          value={datos.barrio}
          onChange={cambiar}
          error={errores.barrio}
        />

        <button type="submit" className="boton-principal" disabled={enviando}>
          {enviando ? 'Enviando…' : 'Enviar reporte'}
        </button>
      </form>
    </div>
  )
}

export default Reportar
