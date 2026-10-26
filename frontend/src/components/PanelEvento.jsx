import HojaDetalle from './HojaDetalle.jsx'
import { textoFechaEvento } from './fechas.js'
import { CATEGORIAS_EVENTO, MODALIDADES_EVENTO } from './iconoEvento.js'

// RF-02: detalle de un evento. Usa el objeto de la lista: GET /api/eventos/:id devuelve lo mismo.
function PanelEvento({ evento, onCerrar }) {
  const direccion = [evento.direccion, evento.barrio].filter(Boolean).join(', ')

  return (
    <HojaDetalle titulo="Detalle del evento" onCerrar={onCerrar}>
      {evento.flyer_url && (
        <img
          className="panel-detalle__flyer"
          src={evento.flyer_url}
          alt={`Flyer de ${evento.nombre}`}
          referrerPolicy="no-referrer"
        />
      )}
      <h2 className="panel-detalle__nombre">{evento.nombre}</h2>
      <span className="panel-detalle__categoria panel-detalle__categoria--evento">
        {CATEGORIAS_EVENTO[evento.categoria] ?? 'Evento'}
      </span>{' '}
      <span className="panel-detalle__categoria panel-detalle__categoria--modalidad">
        {MODALIDADES_EVENTO[evento.modalidad] ?? evento.modalidad}
      </span>

      <p className="panel-detalle__fecha">🗓️ {textoFechaEvento(evento.inicio, evento.fin)}</p>
      <p className="panel-detalle__direccion">
        📍 <strong>{evento.lugar_nombre}</strong>
        {direccion && ` · ${direccion}`}
      </p>

      <p className="panel-detalle__descripcion">{evento.descripcion}</p>

      {evento.etiquetas?.length > 0 && (
        <ul className="panel-detalle__etiquetas" aria-label="Etiquetas">
          {evento.etiquetas.map((etiqueta) => (
            <li key={etiqueta}>#{etiqueta}</li>
          ))}
        </ul>
      )}
    </HojaDetalle>
  )
}

export default PanelEvento
