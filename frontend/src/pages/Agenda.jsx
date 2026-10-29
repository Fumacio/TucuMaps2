import { useCallback, useState } from 'react'
import { Link } from 'react-router-dom'
import { obtenerEventos } from '../api/eventos.js'
import { EnlacesLegales } from '../components/AvisoLegal.jsx'
import Cargando from '../components/Cargando.jsx'
import { textoFechaCorta } from '../components/fechas.js'
import { CATEGORIAS_EVENTO, MODALIDADES_EVENTO } from '../components/iconoEvento.js'
import MensajeError from '../components/MensajeError.jsx'
import { sumarEventosDePrueba } from '../dev/eventosDePrueba.js'
import { usePedido } from '../hooks/usePedido.js'
import imagenEvento from '../assets/evento.png'

const SIN_FILTROS = { categoria: '', desde: '', hasta: '' }

// RF-02, RF-12: eventos vigentes ordenados por inicio, con filtros de categoría y fechas.
function Agenda() {
  const [filtros, setFiltros] = useState(SIN_FILTROS)
  const pedirEventos = useCallback(
    () => obtenerEventos(filtros).then((datos) => sumarEventosDePrueba(datos, filtros)),
    [filtros],
  )
  const { datos: eventos, error, cargando, reintentar } = usePedido(pedirEventos)
  const hayFiltros = Object.values(filtros).some(Boolean)

  function cambiarFiltro(evento) {
    const { name, value } = evento.target
    setFiltros((anteriores) => {
      const nuevos = { ...anteriores, [name]: value }
      // La API rechaza "hasta" antes de "desde": se borra en vez de mandar un pedido inválido.
      if (nuevos.desde && nuevos.hasta && nuevos.hasta < nuevos.desde) nuevos.hasta = ''
      return nuevos
    })
  }

  return (
    <div className="agenda">
      <h1 className="agenda__titulo">Eventos próximos</h1>

      <form className="agenda__filtros" onSubmit={(e) => e.preventDefault()}>
        <label>
          Tipo
          <select name="categoria" value={filtros.categoria} onChange={cambiarFiltro}>
            <option value="">Todos</option>
            {Object.entries(CATEGORIAS_EVENTO).map(([valor, etiqueta]) => (
              <option key={valor} value={valor}>
                {etiqueta}
              </option>
            ))}
          </select>
        </label>
        <label>
          Desde
          <input type="date" name="desde" value={filtros.desde} onChange={cambiarFiltro} />
        </label>
        <label>
          Hasta
          <input
            type="date"
            name="hasta"
            value={filtros.hasta}
            min={filtros.desde || undefined}
            onChange={cambiarFiltro}
          />
        </label>
        {hayFiltros && (
          <button type="button" className="agenda__limpiar" onClick={() => setFiltros(SIN_FILTROS)}>
            Limpiar filtros
          </button>
        )}
      </form>

      {/* RF-06 */}
      {error && <MensajeError className="agenda__aviso" error={error} onReintentar={reintentar} />}
      {cargando && <Cargando className="agenda__aviso" texto="Cargando eventos…" />}
      {eventos?.length === 0 && (
        <p className="agenda__aviso" role="status">
          {hayFiltros
            ? 'No hay eventos que coincidan con los filtros.'
            : 'Todavía no hay eventos próximos. ¡Volvé pronto!'}
        </p>
      )}

      {eventos?.length > 0 && (
        <ul className="agenda__lista">
          {eventos.map((evento) => (
            <li key={evento.id}>
              <TarjetaEvento evento={evento} />
            </li>
          ))}
        </ul>
      )}

      <footer className="pie-legal">
        TucuMaps no es un servicio oficial. <EnlacesLegales />
      </footer>
    </div>
  )
}

function TarjetaEvento({ evento }) {
  return (
    <article className="tarjeta-evento">
      {evento.flyer_url ? (
        <img
          className="tarjeta-evento__imagen"
          src={evento.flyer_url}
          alt=""
          loading="lazy"
          referrerPolicy="no-referrer"
        />
      ) : (
        <div className="tarjeta-evento__imagen tarjeta-evento__imagen--vacia">
          <img src={imagenEvento} alt="" />
        </div>
      )}
      <div className="tarjeta-evento__cuerpo">
        <p className="tarjeta-evento__fecha">{textoFechaCorta(evento.inicio)}</p>
        <h2 className="tarjeta-evento__nombre">{evento.nombre}</h2>
        <p className="tarjeta-evento__lugar">📍 {evento.lugar_nombre}</p>
        <p className="tarjeta-evento__etiquetas">
          <span>{CATEGORIAS_EVENTO[evento.categoria] ?? 'Evento'}</span>
          <span>{MODALIDADES_EVENTO[evento.modalidad] ?? evento.modalidad}</span>
        </p>
        <Link
          className="tarjeta-evento__ver-mapa"
          to={`/?evento=${encodeURIComponent(evento.id)}`}
          aria-label={`Ver ${evento.nombre} en el mapa`}
        >
          Ver mapa
        </Link>
      </div>
    </article>
  )
}

export default Agenda
