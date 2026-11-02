import { useEffect, useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { obtenerMisEnvios } from '../api/envios.js'
import { cancelarEvento } from '../api/eventos.js'
import { cancelarReporte } from '../api/reportes.js'
import imagenEvento from '../assets/evento.png'
import Cargando from '../components/Cargando.jsx'
import { nombreDeEstado } from '../components/estadosEnvio.js'
import { textoFechaCorta } from '../components/fechas.js'
import { datosTipoAlerta } from '../components/iconoAlerta.js'
import { CATEGORIAS_EVENTO } from '../components/iconoEvento.js'
import MensajeError from '../components/MensajeError.jsx'
import { useSesion } from '../context/sesion.js'

const clave = (envio) => `${envio.tipo}-${envio.id}`

const FILTROS = [
  ['', 'Todos'],
  ['reporte', 'Reportes'],
  ['evento', 'Eventos'],
]

// RF-07, RF-08: lo que envió la persona, con su estado y, si se rechazó, el motivo.
function MisEnvios() {
  const { usuario, cargando } = useSesion()

  if (cargando) return <Cargando className="agenda__aviso" />
  if (!usuario) return <Navigate to="/ingresar" state={{ desde: '/mis-envios' }} replace />
  return <ListaDeEnvios />
}

function ListaDeEnvios() {
  const [tipo, setTipo] = useState('')
  const [pagina, setPagina] = useState(1)
  const [pedido, setPedido] = useState(0) // cambiarlo vuelve a pedir (Reintentar)
  // Las páginas ya traídas se van sumando ("Ver más"); cambiar el filtro empieza de cero.
  const [envios, setEnvios] = useState([])
  const [total, setTotal] = useState(0)
  const [estado, setEstado] = useState('cargando')
  const [error, setError] = useState(null)

  useEffect(() => {
    let vigente = true
    obtenerMisEnvios({ tipo, pagina })
      .then((respuesta) => {
        if (!vigente) return
        // Si entre página y página se mandó algo nuevo, la siguiente repite el último: se saltea.
        setEnvios((anteriores) => {
          if (pagina === 1) return respuesta.datos
          const ya = new Set(anteriores.map(clave))
          return [...anteriores, ...respuesta.datos.filter((e) => !ya.has(clave(e)))]
        })
        setTotal(respuesta.total)
        setEstado('listo')
      })
      .catch((err) => {
        if (!vigente) return
        setError(err)
        setEstado('error')
      })
    return () => {
      vigente = false
    }
  }, [tipo, pagina, pedido])

  function filtrar(nuevo) {
    if (nuevo === tipo) return
    setTipo(nuevo)
    setPagina(1)
    setEnvios([])
    setEstado('cargando')
  }

  function verMas() {
    setPagina((n) => n + 1)
    setEstado('cargando')
  }

  // Al cancelar uno, se actualiza en la lista sin volver a pedirla.
  function actualizar(cambiado) {
    setEnvios((anteriores) =>
      anteriores.map((e) => (e.tipo === cambiado.tipo && e.id === cambiado.id ? cambiado : e)),
    )
  }

  function reintentar() {
    setError(null)
    setEstado('cargando')
    setPedido((n) => n + 1)
  }

  // Algo cambió en el servidor (un administrador ya lo revisó): se vuelve a pedir desde el principio.
  function recargar() {
    setPagina(1)
    reintentar()
  }

  return (
    <div className="mis-envios">
      <h1 className="agenda__titulo">Mis envíos</h1>

      <div className="mis-envios__filtros" role="group" aria-label="Qué mostrar">
        {FILTROS.map(([valor, etiqueta]) => (
          <button
            key={valor}
            type="button"
            aria-pressed={tipo === valor}
            onClick={() => filtrar(valor)}
          >
            {etiqueta}
          </button>
        ))}
      </div>

      {envios.length > 0 && (
        <ul className="mis-envios__lista">
          {envios.map((envio) => (
            <li key={clave(envio)}>
              <TarjetaEnvio envio={envio} onCambio={actualizar} onDesactualizado={recargar} />
            </li>
          ))}
        </ul>
      )}

      {estado === 'listo' && envios.length === 0 && (
        <div className="agenda__aviso" role="status">
          <p>
            {tipo === 'reporte' && 'Todavía no enviaste reportes.'}
            {tipo === 'evento' && 'Todavía no propusiste eventos.'}
            {!tipo && 'Todavía no enviaste nada.'}
          </p>
          <p className="mis-envios__acciones">
            <Link to="/reportar" className="boton-secundario">
              Enviar reporte
            </Link>
            <Link to="/proponer-evento" className="boton-secundario">
              Proponer evento
            </Link>
          </p>
        </div>
      )}
      {estado === 'cargando' && <Cargando className="agenda__aviso" texto="Cargando tus envíos…" />}
      {estado === 'error' && <MensajeError className="agenda__aviso" error={error} onReintentar={reintentar} />}
      {estado === 'listo' && envios.length < total && (
        <button type="button" className="boton-secundario mis-envios__mas" onClick={verMas}>
          Ver más
        </button>
      )}
    </div>
  )
}

function TarjetaEnvio({ envio, onCambio, onDesactualizado }) {
  const { contenido } = envio
  const esReporte = envio.tipo === 'reporte'
  const tipoAlerta = esReporte ? datosTipoAlerta(contenido.tipo) : null
  const [confirmando, setConfirmando] = useState(false)
  const [cancelando, setCancelando] = useState(false)
  const [error, setError] = useState(null)

  // RF-07: cancelar es final. Si un administrador ya lo revisó, la API responde 409 y se muestra.
  async function cancelar() {
    setCancelando(true)
    setError(null)
    try {
      const { estado } = await (esReporte ? cancelarReporte(envio.id) : cancelarEvento(envio.id))
      onCambio({ ...envio, estado })
    } catch (err) {
      if (err?.codigo === 'TRANSICION_INVALIDA') return onDesactualizado()
      setError(err)
      setConfirmando(false)
    } finally {
      setCancelando(false)
    }
  }

  return (
    <article className="tarjeta-envio">
      <img className="tarjeta-envio__icono" src={esReporte ? tipoAlerta.imagen : imagenEvento} alt="" />
      <div className="tarjeta-envio__cuerpo">
        <p className="tarjeta-envio__clase">{esReporte ? 'Reporte' : 'Evento'}</p>
        <h2 className="tarjeta-envio__titulo">{esReporte ? tipoAlerta.etiqueta : contenido.nombre}</h2>
        {esReporte ? (
          <p className="tarjeta-envio__detalle">{contenido.descripcion}</p>
        ) : (
          <p className="tarjeta-envio__detalle">
            {CATEGORIAS_EVENTO[contenido.categoria] ?? 'Evento'} · {textoFechaCorta(contenido.inicio)} ·{' '}
            {contenido.lugar_nombre}
          </p>
        )}
        <p className="tarjeta-envio__fecha">Enviado el {textoFechaCorta(envio.creado_en)}</p>
        <p>
          <span className={`estado-envio estado-envio--${envio.estado}`}>{nombreDeEstado(envio.estado)}</span>
        </p>
        {envio.estado === 'rechazado' && envio.motivo_rechazo && (
          <p className="tarjeta-envio__motivo">
            <strong>Motivo:</strong> {envio.motivo_rechazo}
          </p>
        )}
        {error && (
          <p className="formulario__error" role="alert">
            {error.mensaje}
          </p>
        )}
        {/* RF-07: solo lo pendiente se puede corregir o cancelar. */}
        {envio.estado === 'pendiente' && !confirmando && (
          <p className="tarjeta-envio__acciones">
            <Link
              to={esReporte ? '/reportar' : '/proponer-evento'}
              state={{ editar: envio }}
              className="boton-secundario"
            >
              Editar
            </Link>
            <button type="button" className="boton-secundario" onClick={() => setConfirmando(true)}>
              Cancelar
            </button>
          </p>
        )}
        {envio.estado === 'pendiente' && confirmando && (
          <div className="tarjeta-envio__confirmar" role="group" aria-label="Confirmar la cancelación">
            <p>¿Cancelar {esReporte ? 'este reporte' : 'esta propuesta'}? No se puede deshacer.</p>
            <p className="tarjeta-envio__acciones">
              <button type="button" className="boton-peligro" onClick={cancelar} disabled={cancelando}>
                {cancelando ? 'Cancelando…' : 'Sí, cancelar'}
              </button>
              <button type="button" className="boton-secundario" onClick={() => setConfirmando(false)}>
                No
              </button>
            </p>
          </div>
        )}
      </div>
    </article>
  )
}

export default MisEnvios
