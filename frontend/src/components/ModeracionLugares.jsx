import { useState } from 'react'
import { Link } from 'react-router-dom'
import { POR_PAGINA, cambiarActivoLugar, obtenerLugaresAdmin } from '../api/admin.js'
import { useListaAdmin } from '../hooks/useListaAdmin.js'
import AvisoAccion from './AvisoAccion.jsx'
import Cargando from './Cargando.jsx'
import { CATEGORIAS_LUGAR, fotoChica } from './iconoLugar.js'
import MensajeError from './MensajeError.jsx'
import Paginacion from './Paginacion.jsx'

const SIN_FILTROS = {}

// RF-13: los lugares del mapa, también los ocultos. No se borran: se ocultan.
function ModeracionLugares() {
  const lista = useListaAdmin(obtenerLugaresAdmin, SIN_FILTROS)
  const { elementos, cargando, error, aviso } = lista

  return (
    <section aria-label="Lugares">
      <div className="moderacion__encabezado">
        <Link to="/admin/lugar" className="boton-principal">
          Crear lugar
        </Link>
      </div>

      {aviso && <AvisoAccion aviso={aviso} />}
      {cargando && elementos.length === 0 && !error && (
        <Cargando className="agenda__aviso" texto="Cargando lugares…" />
      )}
      {error && <MensajeError className="agenda__aviso" error={error} onReintentar={lista.recargar} />}
      {!cargando && !error && elementos.length === 0 && (
        <p className="agenda__aviso" role="status">
          Todavía no hay lugares.
        </p>
      )}

      {elementos.length > 0 && (
        <ul className="moderacion__lista">
          {elementos.map((lugar) => (
            <li key={lugar.id}>
              <TarjetaLugar
                lugar={lugar}
                cambiarActivo={(activo) =>
                  lista.ejecutar(
                    cambiarActivoLugar(lugar.id, activo),
                    activo ? `${lugar.nombre} se volvió a mostrar en el mapa.` : `${lugar.nombre} se ocultó del mapa.`,
                  )
                }
              />
            </li>
          ))}
        </ul>
      )}

      <Paginacion pagina={lista.pagina} total={lista.total} porPagina={POR_PAGINA} onCambiar={lista.irAPagina} />
    </section>
  )
}

function TarjetaLugar({ lugar, cambiarActivo }) {
  const [confirmando, setConfirmando] = useState(false)
  const [ocupado, setOcupado] = useState(false)
  const direccion = [lugar.direccion, lugar.barrio, lugar.localidad].filter(Boolean).join(', ')

  async function cambiar(activo) {
    setOcupado(true)
    await cambiarActivo(activo)
    setOcupado(false)
    setConfirmando(false)
  }

  return (
    <article className="tarjeta-envio">
      {lugar.imagen_url ? (
        <img
          className="tarjeta-lugar__foto"
          src={fotoChica(lugar.imagen_url)}
          alt=""
          loading="lazy"
          referrerPolicy="no-referrer"
        />
      ) : (
        <div className="tarjeta-lugar__foto" aria-hidden="true" />
      )}
      <div className="tarjeta-envio__cuerpo">
        <h2 className="tarjeta-envio__titulo">{lugar.nombre}</h2>
        <p className="moderacion__texto">{CATEGORIAS_LUGAR[lugar.categoria]?.etiqueta ?? 'Lugar'}</p>
        {direccion && <p className="moderacion__texto">{direccion}</p>}
        {lugar.precio_entrada && <p className="tarjeta-envio__fecha">Entrada: {lugar.precio_entrada}</p>}
        <p>
          <span className={`estado-envio ${lugar.activo ? 'estado-envio--aprobado' : 'estado-envio--retirado'}`}>
            {lugar.activo ? 'Se ve en el mapa' : 'Oculto'}
          </span>
        </p>

        {confirmando ? (
          <div className="moderacion__confirmar" role="group" aria-label="Confirmar">
            <p>¿Ocultar {lugar.nombre} del mapa? No se borra: lo podés volver a mostrar.</p>
            <div className="moderacion__botones">
              <button type="button" className="boton-peligro" disabled={ocupado} onClick={() => cambiar(false)}>
                Sí, ocultar
              </button>
              <button type="button" className="boton-secundario" onClick={() => setConfirmando(false)}>
                Volver
              </button>
            </div>
          </div>
        ) : (
          <div className="moderacion__botones">
            <Link to="/admin/lugar" state={{ editar: lugar }} className="boton-secundario">
              Editar
            </Link>
            {lugar.activo ? (
              <button type="button" className="boton-peligro" onClick={() => setConfirmando(true)}>
                Ocultar del mapa
              </button>
            ) : (
              <button type="button" className="boton-principal" disabled={ocupado} onClick={() => cambiar(true)}>
                Volver a mostrar
              </button>
            )}
          </div>
        )}
      </div>
    </article>
  )
}

export default ModeracionLugares
