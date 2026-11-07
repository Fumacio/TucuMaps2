import { Link } from 'react-router-dom'
import {
  POR_PAGINA,
  aprobarEvento,
  obtenerEventosAdmin,
  rechazarEvento,
  retirarEvento,
} from '../api/admin.js'
import imagenEvento from '../assets/evento.png'
import { useListaAdmin } from '../hooks/useListaAdmin.js'
import AccionesModeracion from './AccionesModeracion.jsx'
import AvisoAccion from './AvisoAccion.jsx'
import Cargando from './Cargando.jsx'
import { nombreDeEstado } from './estadosEnvio.js'
import { textoFechaCorta, textoFechaEvento } from './fechas.js'
import { CATEGORIAS_EVENTO, MODALIDADES_EVENTO } from './iconoEvento.js'
import MensajeError from './MensajeError.jsx'
import Paginacion from './Paginacion.jsx'

const ESTADOS = [
  ['pendiente', 'Pendientes'],
  ['aprobado', 'Publicados'],
  ['rechazado', 'Rechazados'],
  ['retirado', 'Retirados'],
  ['cancelado', 'Cancelados'],
  ['', 'Todos'],
]
const RESULTADOS = {
  aprobar: 'Evento aprobado: ya se ve en el mapa y en la agenda.',
  rechazar: 'Evento rechazado.',
  retirar: 'Evento retirado.',
}
const FILTROS_INICIALES = { estado: 'pendiente', categoria: '', archivado: '' }

function hacer(accion, id, motivo) {
  if (accion === 'aprobar') return aprobarEvento(id)
  if (accion === 'rechazar') return rechazarEvento(id, motivo)
  return retirarEvento(id)
}

// Una propuesta archivada (pasaron 24 hs desde que sucedió, RF-12) ya no se puede aprobar: la API
// responde 409. Lo que sí se puede retirar, también archivado.
function accionesDe({ estado, archivado }) {
  if (estado === 'pendiente') return archivado ? ['rechazar'] : ['aprobar', 'rechazar']
  if (estado === 'aprobado') return ['retirar']
  return []
}

// RF-08, RF-13, RF-15: la cola de eventos del panel. Arranca en los pendientes.
function ModeracionEventos() {
  const lista = useListaAdmin(obtenerEventosAdmin, FILTROS_INICIALES)
  const { filtros, cambiarFiltro, elementos, cargando, error, aviso } = lista

  function cambiar(evento) {
    cambiarFiltro(evento.target.name, evento.target.value)
  }

  return (
    <section aria-label="Eventos">
      <div className="moderacion__encabezado">
        <Link to="/admin/evento" className="boton-principal">
          Crear evento
        </Link>
      </div>

      <form className="moderacion__filtros moderacion__filtros--tres" onSubmit={(e) => e.preventDefault()}>
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
          Categoría
          <select name="categoria" value={filtros.categoria} onChange={cambiar}>
            <option value="">Todas</option>
            {Object.entries(CATEGORIAS_EVENTO).map(([valor, etiqueta]) => (
              <option key={valor} value={valor}>
                {etiqueta}
              </option>
            ))}
          </select>
        </label>
        <label>
          Archivados
          <select name="archivado" value={filtros.archivado} onChange={cambiar}>
            <option value="">Todos</option>
            <option value="false">Sin archivar</option>
            <option value="true">Solo archivados</option>
          </select>
        </label>
      </form>

      {aviso && <AvisoAccion aviso={aviso} />}
      {cargando && <Cargando className="agenda__aviso" texto="Cargando eventos…" />}
      {error && <MensajeError className="agenda__aviso" error={error} onReintentar={lista.recargar} />}
      {!cargando && !error && elementos.length === 0 && (
        <p className="agenda__aviso" role="status">
          No hay eventos con estos filtros.
        </p>
      )}

      {elementos.length > 0 && (
        <ul className="moderacion__lista">
          {elementos.map((evento) => (
            <li key={evento.id}>
              <TarjetaEvento
                evento={evento}
                alElegir={(accion, motivo) => lista.ejecutar(hacer(accion, evento.id, motivo), RESULTADOS[accion])}
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

function TarjetaEvento({ evento, alElegir }) {
  const direccion = [evento.lugar_nombre, evento.direccion, evento.barrio].filter(Boolean).join(', ')
  const enOsm = `https://www.openstreetmap.org/?mlat=${evento.lat}&mlon=${evento.lng}#map=17/${evento.lat}/${evento.lng}`
  const sePuedeEditar = (evento.estado === 'pendiente' || evento.estado === 'aprobado') && !evento.archivado

  return (
    <article className="tarjeta-envio">
      <img className="tarjeta-envio__icono" src={imagenEvento} alt="" />
      <div className="tarjeta-envio__cuerpo">
        <h2 className="tarjeta-envio__titulo">{evento.nombre}</h2>
        <p className="moderacion__texto">
          {CATEGORIAS_EVENTO[evento.categoria] ?? 'Evento'} ·{' '}
          {MODALIDADES_EVENTO[evento.modalidad] ?? evento.modalidad}
        </p>
        <p className="moderacion__texto">{textoFechaEvento(evento.inicio, evento.fin)}</p>
        <p className="moderacion__texto">{evento.descripcion}</p>
        <p className="moderacion__texto">{direccion}</p>
        <p className="moderacion__enlace">
          <a href={enOsm} target="_blank" rel="noopener noreferrer">
            Ver el punto en el mapa
          </a>
        </p>
        {/* La API solo acepta http y https; se vuelve a mirar porque es un enlace que escribió otra persona. */}
        {/^https?:\/\//i.test(evento.flyer_url ?? '') && (
          <p className="moderacion__enlace">
            <a href={evento.flyer_url} target="_blank" rel="noopener noreferrer nofollow">
              Ver el flyer
            </a>
          </p>
        )}
        {evento.etiquetas?.length > 0 && <p className="tarjeta-envio__fecha">Etiquetas: {evento.etiquetas.join(', ')}</p>}
        <p className="tarjeta-envio__fecha">
          Enviado el {textoFechaCorta(evento.creado_en)} por {evento.autor?.nombre ?? 'una cuenta borrada'}
        </p>
        <p>
          <span className={`estado-envio estado-envio--${evento.estado}`}>{nombreDeEstado(evento.estado)}</span>
          {evento.archivado && <span className="moderacion__nota"> Archivado: ya pasó hace más de 24 hs.</span>}
        </p>
        {evento.motivo_rechazo && (
          <p className="tarjeta-envio__motivo">
            <strong>Motivo:</strong> {evento.motivo_rechazo}
          </p>
        )}
        <AccionesModeracion
          key={evento.estado}
          acciones={accionesDe(evento)}
          alElegir={alElegir}
          editar={sePuedeEditar ? { a: '/admin/evento', estado: { editar: evento } } : null}
        />
      </div>
    </article>
  )
}

export default ModeracionEventos
