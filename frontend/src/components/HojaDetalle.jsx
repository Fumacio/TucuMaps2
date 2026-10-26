import { useEffect, useRef, useState } from 'react'

const DISTANCIA_DESLIZAR = 40 // píxeles que hay que mover la manija para que cuente como deslizar
const ESPERA_CLICK_TRAS_DESLIZAR = 500 // ms: el click que algunos navegadores mandan al soltar

// Panel de detalle (de un lugar o de un evento). En el celular es una hoja que sube desde abajo
// y se desliza con la manija; en la computadora, un panel al costado (index.css).
function HojaDetalle({ titulo, onCerrar, children }) {
  const [expandido, setExpandido] = useState(false)
  const inicioArrastre = useRef(null)
  const ultimoDeslizamiento = useRef(0)

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

  return (
    <aside
      className={`panel-detalle${expandido ? ' panel-detalle--expandido' : ''}`}
      aria-label={titulo}
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

      <div className="panel-detalle__contenido">{children}</div>
    </aside>
  )
}

export default HojaDetalle
