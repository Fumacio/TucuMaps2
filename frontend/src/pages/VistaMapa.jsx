import { useCallback, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import Mapa from '../components/Mapa.jsx'
import PanelDetalle from '../components/PanelDetalle.jsx'
import PanelEvento from '../components/PanelEvento.jsx'

function VistaMapa() {
  // ?evento=9 viene de "Ver mapa" en la agenda.
  const [busqueda, setBusqueda] = useSearchParams()
  const eventoEnfocadoId = busqueda.get('evento')
  const olvidarEvento = useCallback(() => {
    setBusqueda(
      (anterior) => {
        const nueva = new URLSearchParams(anterior)
        nueva.delete('evento')
        return nueva
      },
      { replace: true },
    )
  }, [setBusqueda])
  // RF-02: capa que muestra el mapa, 'turismo' o 'seguridad'.
  const [capa, setCapa] = useState('turismo')
  // Qué detalle está abierto: { tipo: 'lugar', id }, { tipo: 'evento', evento } o null.
  const [seleccion, setSeleccion] = useState(null)
  // useCallback: las mismas funciones en cada dibujo, así no se rearman marcadores ni escuchas.
  const cerrarPanel = useCallback(() => setSeleccion(null), [])
  const seleccionarLugar = useCallback((id) => setSeleccion({ tipo: 'lugar', id }), [])
  const seleccionarEvento = useCallback((evento) => setSeleccion({ tipo: 'evento', evento }), [])
  const enSeguridad = capa === 'seguridad'

  function alternarCapa() {
    setCapa(enSeguridad ? 'turismo' : 'seguridad')
    setSeleccion(null)
  }

  return (
    <div className="vista-mapa">
      <Mapa
        capa={capa}
        onSeleccionarLugar={seleccionarLugar}
        onSeleccionarEvento={seleccionarEvento}
        eventoEnfocadoId={eventoEnfocadoId}
        onOlvidarEvento={olvidarEvento}
      />
      <button
        type="button"
        className="boton-seguridad"
        aria-pressed={enSeguridad}
        onClick={alternarCapa}
      >
        <span className="boton-seguridad__sirena" aria-hidden="true" />
        Seguridad
      </button>
      {seleccion?.tipo === 'lugar' && (
        // key: al tocar otro lugar, el panel arranca de cero (vuelve a mostrar "Cargando…").
        <PanelDetalle key={seleccion.id} lugarId={seleccion.id} onCerrar={cerrarPanel} />
      )}
      {seleccion?.tipo === 'evento' && (
        <PanelEvento key={seleccion.evento.id} evento={seleccion.evento} onCerrar={cerrarPanel} />
      )}
    </div>
  )
}

export default VistaMapa
