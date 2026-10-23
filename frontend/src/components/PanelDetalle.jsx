import { useEffect, useRef, useState } from 'react'
import { obtenerLugar } from '../api/lugares.js'
import { separarHorarios } from './horarios.js'
import { CATEGORIAS_LUGAR, fotoChica } from './iconoLugar.js'

const ANCHO_FOTO_PANEL = 640
const DISTANCIA_DESLIZAR = 40 // píxeles que hay que mover la manija para que cuente como deslizar
const ESPERA_CLICK_TRAS_DESLIZAR = 500 // ms: el click que algunos navegadores mandan al soltar

// RF-02: detalle de un lugar con su contenido histórico. En el celular es una hoja que sube
// desde abajo y se desliza con la manija; en la computadora, un panel al costado (index.css).
function PanelDetalle({ lugarId, onCerrar }) {
  const [lugar, setLugar] = useState(null)
  const [error, setError] = useState(null)
  const [expandido, setExpandido] = useState(false)
  const inicioArrastre = useRef(null)
  const ultimoDeslizamiento = useRef(0)

  useEffect(() => {
    let vigente = true
    obtenerLugar(lugarId)
      .then((datos) => {
        if (vigente) setLugar(datos)
      })
      .catch((err) => {
        if (vigente) setError(err)
      })
    return () => {
      vigente = false
    }
  }, [lugarId])

  // Escape cierra el panel (para quien usa teclado).
  useEffect(() => {
    function alApretarTecla(evento) {
      if (evento.key === 'Escape') onCerrar()
    }
    window.addEventListener('keydown', alApretarTecla)
    return () => window.removeEventListener('keydown', alApretarTecla)
  }, [onCerrar])

  // Deslizar la manija: hacia arriba agranda, hacia abajo achica o cierra.
  function alEmpezarArrastre(evento) {
    inicioArrastre.current = evento.clientY
    // Sigue recibiendo el "soltar" aunque el dedo o el mouse salgan de la manija.
    evento.currentTarget.setPointerCapture?.(evento.pointerId)
  }

  function alTerminarArrastre(evento) {
    if (inicioArrastre.current === null) return
    const recorrido = evento.clientY - inicioArrastre.current
    inicioArrastre.current = null
    if (Math.abs(recorrido) < DISTANCIA_DESLIZAR) return // fue un toque: lo maneja alTocarManija

    ultimoDeslizamiento.current = Date.now()
    if (recorrido < 0) setExpandido(true)
    else if (expandido) setExpandido(false)
    else onCerrar()
  }

  // El navegador canceló el gesto (por ejemplo, entró una llamada): se descarta.
  function alCancelarArrastre() {
    inicioArrastre.current = null
  }

  function alTocarManija() {
    // Algunos navegadores mandan un click justo después de deslizar y otros no: se ignora solo
    // si llega enseguida, así un toque de verdad más tarde siempre funciona.
    if (Date.now() - ultimoDeslizamiento.current < ESPERA_CLICK_TRAS_DESLIZAR) return
    setExpandido(!expandido)
  }

  const categoria = lugar && (CATEGORIAS_LUGAR[lugar.categoria]?.etiqueta ?? 'Lugar')

  return (
    <aside
      className={`panel-detalle${expandido ? ' panel-detalle--expandido' : ''}`}
      aria-label="Detalle del lugar"
    >
      <button
        type="button"
        className="panel-detalle__manija"
        aria-label={expandido ? 'Achicar el panel' : 'Agrandar el panel'}
        onPointerDown={alEmpezarArrastre}
        onPointerUp={alTerminarArrastre}
        onPointerCancel={alCancelarArrastre}
        onClick={alTocarManija}
      />
      <button
        type="button"
        className="panel-detalle__cerrar"
        aria-label="Cerrar"
        onClick={onCerrar}
      >
        ×
      </button>

      <div className="panel-detalle__contenido">
        {!lugar && !error && <p role="status">Cargando…</p>}
        {error && <p role="alert">{error.mensaje}</p>}

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
      </div>
    </aside>
  )
}

export default PanelDetalle
