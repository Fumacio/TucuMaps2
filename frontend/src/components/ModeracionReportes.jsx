import {
  POR_PAGINA,
  aprobarReporte,
  obtenerReportesAdmin,
  rechazarReporte,
  resolverReporte,
  retirarReporte,
} from '../api/admin.js'
import { useListaAdmin } from '../hooks/useListaAdmin.js'
import AccionesModeracion from './AccionesModeracion.jsx'
import Cargando from './Cargando.jsx'
import { nombreDeEstado } from './estadosEnvio.js'
import { textoFechaCorta } from './fechas.js'
import { datosTipoAlerta, TIPOS_ALERTA, textoConfirmaciones } from './iconoAlerta.js'
import MensajeError from './MensajeError.jsx'
import Paginacion from './Paginacion.jsx'

const ESTADOS = [
  ['pendiente', 'Pendientes'],
  ['aprobado', 'Publicados'],
  ['rechazado', 'Rechazados'],
  ['resuelto', 'Resueltos'],
  ['retirado', 'Retirados'],
  ['cancelado', 'Cancelados'],
  ['', 'Todos'],
]
const ACCIONES_POR_ESTADO = { pendiente: ['aprobar', 'rechazar'], aprobado: ['resolver', 'retirar'] }
const RESULTADOS = {
  aprobar: 'Reporte aprobado: ya se ve en el mapa.',
  rechazar: 'Reporte rechazado.',
  resolver: 'Reporte marcado como resuelto.',
  retirar: 'Reporte retirado del mapa.',
}
const FILTROS_INICIALES = { estado: 'pendiente', tipo: '', desde: '', hasta: '' }

function hacer(accion, id, motivo) {
  if (accion === 'aprobar') return aprobarReporte(id)
  if (accion === 'rechazar') return rechazarReporte(id, motivo)
  if (accion === 'resolver') return resolverReporte(id)
  return retirarReporte(id)
}

// RF-08, RF-13, RF-15: la cola de reportes del panel. Arranca en los pendientes.
function ModeracionReportes() {
  const lista = useListaAdmin(obtenerReportesAdmin, FILTROS_INICIALES)
  const { filtros, cambiarFiltro, elementos, cargando, error, aviso } = lista

  function cambiar(evento) {
    const { name, value } = evento.target
    cambiarFiltro(name, value)
    // La API rechaza "hasta" antes de "desde": se borra en vez de mandar un pedido inválido.
    if (name === 'desde' && value && filtros.hasta && filtros.hasta < value) cambiarFiltro('hasta', '')
  }

  return (
    <section aria-label="Reportes">
      <form className="moderacion__filtros" onSubmit={(e) => e.preventDefault()}>
        <label>
          Estado
          <select name="estado" value={filtros.estado} onChange={cambiar}>
            {ESTADOS.map(([valor, etiqueta]) => (
              <option key={valor} value={valor}>
                {etiqueta}
              </option>
            ))}
          </select>
        </label>
        <label>
          Tipo
          <select name="tipo" value={filtros.tipo} onChange={cambiar}>
            <option value="">Todos</option>
            {Object.entries(TIPOS_ALERTA).map(([valor, { etiqueta }]) => (
              <option key={valor} value={valor}>
                {etiqueta}
              </option>
            ))}
          </select>
        </label>
        <label>
          Enviados desde
          <input type="date" name="desde" value={filtros.desde} onChange={cambiar} />
        </label>
        <label>
          Hasta
          <input type="date" name="hasta" min={filtros.desde || undefined} value={filtros.hasta} onChange={cambiar} />
        </label>
      </form>

      {aviso && <AvisoAccion aviso={aviso} />}
      {cargando && <Cargando className="agenda__aviso" texto="Cargando reportes…" />}
      {error && <MensajeError className="agenda__aviso" error={error} onReintentar={lista.recargar} />}
      {!cargando && !error && elementos.length === 0 && (
        <p className="agenda__aviso" role="status">
          No hay reportes con estos filtros.
        </p>
      )}

      {elementos.length > 0 && (
        <ul className="moderacion__lista">
          {elementos.map((reporte) => (
            <li key={reporte.id}>
              <TarjetaReporte
                reporte={reporte}
                alElegir={(accion, motivo) => lista.ejecutar(hacer(accion, reporte.id, motivo), RESULTADOS[accion])}
              />
            </li>
          ))}
        </ul>
      )}

      {!cargando && (
        <Paginacion pagina={lista.pagina} total={lista.total} porPagina={POR_PAGINA} onCambiar={lista.setPagina} />
      )}
    </section>
  )
}

function AvisoAccion({ aviso }) {
  return aviso.tipo === 'exito' ? (
    <p className="formulario__exito moderacion__aviso" role="status">
      {aviso.texto}
    </p>
  ) : (
    <p className="formulario__error moderacion__aviso" role="alert">
      {aviso.texto}
    </p>
  )
}

function TarjetaReporte({ reporte, alElegir }) {
  const tipo = datosTipoAlerta(reporte.tipo)
  const direccion = [reporte.direccion, reporte.barrio].filter(Boolean).join(', ')
  const enOsm = `https://www.openstreetmap.org/?mlat=${reporte.lat}&mlon=${reporte.lng}#map=17/${reporte.lat}/${reporte.lng}`

  return (
    <article className="tarjeta-envio">
      <img className="tarjeta-envio__icono" src={tipo.imagen} alt="" />
      <div className="tarjeta-envio__cuerpo">
        <h2 className="tarjeta-envio__titulo">{tipo.etiqueta}</h2>
        <p className="moderacion__texto">{reporte.descripcion}</p>
        {direccion && <p className="moderacion__texto">{direccion}</p>}
        <p className="moderacion__enlace">
          <a href={enOsm} target="_blank" rel="noopener noreferrer">
            Ver el punto en el mapa
          </a>
        </p>
        <p className="tarjeta-envio__fecha">
          Enviado el {textoFechaCorta(reporte.creado_en)} por {reporte.autor?.nombre ?? 'una cuenta borrada'}
        </p>
        {reporte.estado !== 'pendiente' && (
          <p className="tarjeta-envio__fecha">{textoConfirmaciones(reporte.confirmaciones)}</p>
        )}
        <p>
          <span className={`estado-envio estado-envio--${reporte.estado}`}>{nombreDeEstado(reporte.estado)}</span>
          {reporte.estado === 'aprobado' && !reporte.activa && (
            <span className="moderacion__nota"> Ya no se ve en el mapa: pasaron 24 hs.</span>
          )}
        </p>
        {reporte.motivo_rechazo && (
          <p className="tarjeta-envio__motivo">
            <strong>Motivo:</strong> {reporte.motivo_rechazo}
          </p>
        )}
        <AccionesModeracion
          key={reporte.estado}
          acciones={ACCIONES_POR_ESTADO[reporte.estado] ?? []}
          alElegir={alElegir}
        />
      </div>
    </article>
  )
}

export default ModeracionReportes
