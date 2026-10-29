import 'leaflet/dist/leaflet.css'
import 'react-leaflet-cluster/dist/assets/MarkerCluster.css' // animación al abrir y cerrar grupos
import { useEffect, useRef, useState } from 'react'
import { MapContainer, TileLayer, ZoomControl, useMap } from 'react-leaflet'
import MarkerClusterGroup from 'react-leaflet-cluster'
import { obtenerEventos } from '../api/eventos.js'
import { obtenerLugares } from '../api/lugares.js'
import { obtenerAlertas } from '../api/reportes.js'
import { sumarAlertasDePrueba } from '../dev/alertasDePrueba.js'
import { sumarEventosDePrueba } from '../dev/eventosDePrueba.js'
import { sumarLugaresDePrueba } from '../dev/lugaresDePrueba.js'
import { usePedido } from '../hooks/usePedido.js'
import AvisoLegal from './AvisoLegal.jsx'
import Cargando from './Cargando.jsx'
import { iconoGrupoDeCapa, iconoGrupoTurismo } from './iconoGrupo.js'
import MarcadorAlerta from './MarcadorAlerta.jsx'
import MarcadorEvento from './MarcadorEvento.jsx'
import MarcadorLugar from './MarcadorLugar.jsx'
import MensajeError from './MensajeError.jsx'

const ICONO_GRUPO_SEGURIDAD = iconoGrupoDeCapa('seguridad')
const AGRUPAR = {
  maxClusterRadius: 50,
  showCoverageOnHover: false,
  spiderfyOnMaxZoom: true,
  chunkedLoading: true,
}
const ACTUALIZAR_ALERTAS_MS = 5 * 60 * 1000

// Fuera del componente: son siempre la misma función, así usePedido pide una sola vez.
const pedirLugares = () => obtenerLugares().then(sumarLugaresDePrueba)
const pedirEventos = () => obtenerEventos().then((datos) => sumarEventosDePrueba(datos))

// RF-02: el mapa abre centrado en Tucumán. Con este centro y zoom se ven los 20 lugares del seed,
// desde el centro de San Miguel hasta Villa Nougués.
const CENTRO_TUCUMAN = [-26.82, -65.26]
const ZOOM_INICIAL = 12
const ZOOM_EVENTO = 16

// Cuando llegan los lugares, acomoda la vista para que entren todos, sea cual sea el ancho de la
// pantalla (en el celular, el centro y zoom fijos dejaban lugares afuera). Lo hace una sola vez,
// y no lo hace si la persona ya movió el mapa mientras esperaba (el backend puede tardar en
// "despertar"), para no hacerle saltar la vista.
// En Seguridad no ajusta: los lugares no se ven ahí.
function AjustarVista({ lugares, activa }) {
  const mapa = useMap()
  const yaAjustada = useRef(false)

  useEffect(() => {
    function alMoverLaPersona() {
      yaAjustada.current = true
    }
    mapa.once('dragstart zoomstart', alMoverLaPersona)
    return () => mapa.off('dragstart zoomstart', alMoverLaPersona)
  }, [mapa])

  useEffect(() => {
    if (!activa || yaAjustada.current || lugares.length === 0) return
    yaAjustada.current = true
    mapa.fitBounds(
      lugares.map((lugar) => [lugar.lat, lugar.lng]),
      { padding: [40, 40], maxZoom: 15 }, // margen para que los pins no queden en el borde
    )
  }, [mapa, lugares, activa])

  return null
}

// "Ver mapa" de la agenda: centra el mapa en el evento y abre su detalle, una sola vez.
function EnfocarEvento({ evento, onEnfocar }) {
  const mapa = useMap()

  useEffect(() => {
    if (!evento) return
    mapa.setView([evento.lat, evento.lng], ZOOM_EVENTO)
    onEnfocar(evento)
  }, [mapa, evento, onEnfocar])

  return null
}

function Mapa({
  capa = 'turismo',
  onSeleccionarLugar,
  onSeleccionarEvento,
  eventoEnfocadoId = null,
  onOlvidarEvento,
}) {
  // Lugares y eventos se piden una vez, cada uno con su propio Reintentar.
  const lugaresPedido = usePedido(pedirLugares)
  const eventosPedido = usePedido(pedirEventos)
  const lugares = lugaresPedido.datos // null = todavía no llegaron (o fallaron)
  const eventos = eventosPedido.datos
  const visibles = lugares ?? []
  const [alertas, setAlertas] = useState(null)
  const [errorAlertas, setErrorAlertas] = useState(null)
  const enSeguridad = capa === 'seguridad'
  const [pedidoAlertas, setPedidoAlertas] = useState(0) // cambiarlo vuelve a pedir (Reintentar)

  // RF-11: las alertas vencen a las 24 hs, así que se piden al entrar a Seguridad y se
  // actualizan cada tanto mientras se está ahí. Al salir se olvidan, para no mostrar viejas.
  useEffect(() => {
    if (!enSeguridad) return
    let vigente = true
    function pedir() {
      obtenerAlertas()
        .then((datos) => {
          if (!vigente) return
          setAlertas(sumarAlertasDePrueba(datos))
          setErrorAlertas(null)
        })
        .catch((err) => {
          if (!vigente) return
          setAlertas(null)
          setErrorAlertas(err)
        })
    }
    pedir()
    const intervalo = setInterval(pedir, ACTUALIZAR_ALERTAS_MS)
    return () => {
      vigente = false
      clearInterval(intervalo)
      setAlertas(null)
      setErrorAlertas(null)
    }
  }, [enSeguridad, pedidoAlertas])

  const eventoEnfocado =
    eventoEnfocadoId === null
      ? null
      : (eventos?.find((evento) => String(evento.id) === eventoEnfocadoId) ?? null)
  // RF-12: un enlace viejo puede apuntar a un evento que ya se archivó.
  const eventoNoEncontrado = eventoEnfocadoId !== null && eventos !== null && !eventoEnfocado

  const cargando = enSeguridad
    ? alertas === null && !errorAlertas
    : lugaresPedido.cargando || eventosPedido.cargando

  return (
    <>
      <MapContainer
        center={CENTRO_TUCUMAN}
        zoom={ZOOM_INICIAL}
        zoomControl={false}
        className="mapa"
      >
        {/* Abajo a la derecha: arriba a la izquierda lo taparía el panel de detalle en la
            computadora, y arriba a la derecha va el botón de Seguridad del diseño. */}
        <ZoomControl position="bottomright" />
        {/* Mapa base de OpenStreetMap; su licencia exige mostrar la atribución (RF-02). */}
        <TileLayer
          url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          maxZoom={19}
        />
        {/* Con ?evento= manda EnfocarEvento, salvo que ese evento no exista o no hayan llegado. */}
        <AjustarVista
          lugares={visibles}
          activa={
            !enSeguridad && (eventoEnfocadoId === null || eventoNoEncontrado || !!eventosPedido.error)
          }
        />
        <EnfocarEvento evento={eventoEnfocado} onEnfocar={onSeleccionarEvento} />
        {/* RF-02: solo los marcadores de la capa elegida. RF-05: los cercanos se agrupan. */}
        {enSeguridad ? (
          <MarkerClusterGroup key="seguridad" iconCreateFunction={ICONO_GRUPO_SEGURIDAD} {...AGRUPAR}>
            {(alertas ?? []).map((alerta) => (
              <MarcadorAlerta key={alerta.id} alerta={alerta} />
            ))}
          </MarkerClusterGroup>
        ) : (
          <MarkerClusterGroup key="turismo" iconCreateFunction={iconoGrupoTurismo} {...AGRUPAR}>
            {visibles.map((lugar) => (
              <MarcadorLugar key={lugar.id} lugar={lugar} onSeleccionar={onSeleccionarLugar} />
            ))}
            {(eventos ?? []).map((evento) => (
              <MarcadorEvento key={evento.id} evento={evento} onSeleccionar={onSeleccionarEvento} />
            ))}
          </MarkerClusterGroup>
        )}
      </MapContainer>
      {/* Todos los avisos van apilados en una columna, así nunca se tapan entre sí. */}
      <div className="mapa-avisos">
        {/* RF-06 */}
        {cargando && (
          <Cargando
            className="mapa-aviso"
            texto={enSeguridad ? 'Cargando alertas…' : 'Cargando lugares y eventos…'}
          />
        )}
        {enSeguridad && errorAlertas && (
          <MensajeError
            className="mapa-aviso"
            error={errorAlertas}
            onReintentar={() => setPedidoAlertas((n) => n + 1)}
          />
        )}
        {/* Si fallan los dos (servidor caído), un solo aviso que reintenta ambos. */}
        {!enSeguridad && lugaresPedido.error && (
          <MensajeError
            className="mapa-aviso"
            error={lugaresPedido.error}
            onReintentar={() => {
              lugaresPedido.reintentar()
              if (eventosPedido.error) eventosPedido.reintentar()
            }}
          />
        )}
        {/* Si solo fallan los eventos, que se entienda que los lugares sí están. */}
        {!enSeguridad && !lugaresPedido.error && eventosPedido.error && (
          <MensajeError
            className="mapa-aviso"
            error={{
              ...eventosPedido.error,
              mensaje: `No pudimos cargar los eventos. ${eventosPedido.error.mensaje}`,
            }}
            onReintentar={eventosPedido.reintentar}
          />
        )}
        {/* Llegó la lista pero vacía (por ejemplo, una base sin el seed): que no parezca un error del mapa. */}
        {!enSeguridad && lugares?.length === 0 && (
          <p className="mapa-aviso" role="status">
            Todavía no hay lugares para mostrar.
          </p>
        )}
        {!enSeguridad && eventoNoEncontrado && (
          <div className="mapa-aviso mapa-aviso--con-cerrar" role="status">
            <span>Ese evento ya no está en la agenda.</span>
            <button
              type="button"
              className="mapa-aviso__cerrar"
              aria-label="Cerrar aviso"
              onClick={onOlvidarEvento}
            >
              ×
            </button>
          </div>
        )}
        {enSeguridad && alertas?.length === 0 && !errorAlertas && (
          <p className="mapa-aviso" role="status">
            No hay alertas activas en este momento.
          </p>
        )}
      </div>
      <AvisoLegal completo={enSeguridad} />
    </>
  )
}

export default Mapa
