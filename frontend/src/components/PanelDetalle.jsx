import { useCallback } from 'react'
import { obtenerLugar } from '../api/lugares.js'
import { usePedido } from '../hooks/usePedido.js'
import Cargando from './Cargando.jsx'
import HojaDetalle from './HojaDetalle.jsx'
import { separarHorarios } from './horarios.js'
import { CATEGORIAS_LUGAR, fotoChica } from './iconoLugar.js'
import MensajeError from './MensajeError.jsx'

const ANCHO_FOTO_PANEL = 640

// RF-02: detalle de un lugar con su contenido histórico.
function PanelDetalle({ lugarId, onCerrar }) {
  const pedirLugar = useCallback(() => obtenerLugar(lugarId), [lugarId])
  const { datos: lugar, error, cargando, reintentar } = usePedido(pedirLugar)

  const categoria = lugar && (CATEGORIAS_LUGAR[lugar.categoria]?.etiqueta ?? 'Lugar')

  return (
    <HojaDetalle titulo="Detalle del lugar" onCerrar={onCerrar}>
      {cargando && <Cargando />}
      {error && <MensajeError error={error} onReintentar={reintentar} />}

      {lugar && (
        <>
          {lugar.imagen_url && (
            <img
              className="panel-detalle__foto"
              src={fotoChica(lugar.imagen_url, ANCHO_FOTO_PANEL)}
              alt={`Foto de ${lugar.nombre}`}
            />
          )}
          <h2 className="panel-detalle__nombre">{lugar.nombre}</h2>
          <span className="panel-detalle__categoria">{categoria}</span>

          <p className="panel-detalle__direccion">
            📍 {[lugar.direccion, lugar.barrio, lugar.localidad].filter(Boolean).join(', ')}
          </p>

          {lugar.descripcion && <p className="panel-detalle__descripcion">{lugar.descripcion}</p>}

          <dl className="panel-detalle__datos">
            {lugar.horarios && (
              <>
                <dt>Horarios</dt>
                <dd>
                  {separarHorarios(lugar.horarios).map(({ dias, detalle }, i) => (
                    <span key={i} className="panel-detalle__horario">
                      {dias && <strong className="panel-detalle__dias">{dias}:</strong>} {detalle}
                    </span>
                  ))}
                </dd>
              </>
            )}
            {lugar.precio_entrada && (
              <>
                <dt>Entrada</dt>
                <dd>{lugar.precio_entrada}</dd>
              </>
            )}
          </dl>

          {lugar.contenido_historico && (
            <section>
              <h3>Historia</h3>
              {lugar.contenido_historico.split('\n\n').map((parrafo, i) => (
                <p key={i}>{parrafo}</p>
              ))}
            </section>
          )}

          {lugar.fuente && <p className="panel-detalle__fuente">Fuente: {lugar.fuente}</p>}
        </>
      )}
    </HojaDetalle>
  )
}

export default PanelDetalle
