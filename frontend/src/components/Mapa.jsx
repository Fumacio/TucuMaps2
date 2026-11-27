import 'leaflet/dist/leaflet.css'
import 'react-leaflet-cluster/dist/assets/MarkerCluster.css' // animación al abrir y cerrar grupos
import { useEffect, useRef, useState } from 'react'
import L from 'leaflet'
import { Circle, CircleMarker, MapContainer, Marker, ZoomControl, useMap } from 'react-leaflet'
import MarkerClusterGroup from 'react-leaflet-cluster'
import { obtenerEventos } from '../api/eventos.js'
import { obtenerLugares } from '../api/lugares.js'
import { obtenerAlertas } from '../api/reportes.js'
import { sumarAlertasDePrueba } from '../dev/alertasDePrueba.js'
import { sumarEventosDePrueba } from '../dev/eventosDePrueba.js'
import { sumarLugaresDePrueba } from '../dev/lugaresDePrueba.js'
import { useMiUbicacion } from '../hooks/useMiUbicacion.js'
import { usePedido } from '../hooks/usePedido.js'
import AvisoLegal from './AvisoLegal.jsx'
import BotonMiUbicacion from './BotonMiUbicacion.jsx'
import CapaOsm from './CapaOsm.jsx'
import Cargando from './Cargando.jsx'
import { iconoGrupoDeCapa, iconoGrupoTurismo } from './iconoGrupo.js'
import LimitarATucuman from './LimitarATucuman.jsx'
import { LIMITES_TUCUMAN, radioMiUbicacion } from './ubicacion.js'
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
const AZUL = '#4263eb' // el mismo --azul de index.css, para el punto de "Mi ubicación"

// Fuera del componente: son siempre la misma función, así usePedido pide una sola vez.
const pedirLugares = () => obtenerLugares().then(sumarLugaresDePrueba)
const pedirEventos = () => obtenerEventos().then((datos) => sumarEventosDePrueba(datos))

// RF-02: el mapa abre centrado en Tucumán. Con este centro y zoom se ven los 20 lugares del seed,
// desde el centro de San Miguel hasta Villa Nougués.
const CENTRO_TUCUMAN = [-26.82, -65.26]
const ZOOM_INICIAL = 12
const ZOOM_EVENTO = 16
const ZOOM_PUNTO = 17

// El pin del punto que abre el panel de administración: distinto de los de lugares, eventos y alertas.
const ICONO_PUNTO = L.divIcon({
  className: 'pin-punto',
  html: '<span class="pin-punto__forma"></span>',
  iconSize: [28, 28],
  iconAnchor: [14, 28],
})

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

// Leaflet solo se entera cuando cambia el tamaño de la ventana. Si cambia la caja del mapa
// (por ejemplo, aparece o se va el aviso de verificación), se lo avisa para que no quede gris.
function SeguirTamanio() {
  const mapa = useMap()

  useEffect(() => {
    if (typeof ResizeObserver === 'undefined') return // navegadores viejos y jsdom
    const observador = new ResizeObserver(() => mapa.invalidateSize())
    observador.observe(mapa.getContainer())
    return () => observador.disconnect()
  }, [mapa])

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

// "Ver el punto en el mapa" del panel: centra el mapa en el punto que se está revisando, una vez
// por punto. Un reporte pendiente todavía no está en el mapa, por eso se marca aparte.
function EnfocarPunto({ punto }) {
  const mapa = useMap()

  useEffect(() => {
    if (punto) mapa.setView([punto.lat, punto.lng], ZOOM_PUNTO)
  }, [mapa, punto])

  return null
}

function Mapa({
  capa = 'turismo',
  onSeleccionarLugar,
  onSeleccionarEvento,
  eventoEnfocadoId = null,
  onOlvidarEvento,
  punto = null,
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

  // RF-02: dónde está la persona (el punto azul), solo si tocó "Mi ubicación". No se guarda.
  const miUbicacion = useMiUbicacion()
  const [yo, setYo] = useState(null)

  function buscarMiUbicacion(centrar) {
    setYo(null) // si esta vez falla, no queda a la vista un punto viejo
    miUbicacion.buscar((punto) => {
      setYo(punto)
      centrar(punto)
    })
  }

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
        {...LIMITES_TUCUMAN}
      >
        {/* Abajo a la derecha: arriba a la izquierda lo taparía el panel de detalle en la
            computadora, y arriba a la derecha va el botón de Seguridad del diseño. */}
        <ZoomControl position="bottomright" />
        {/* Se agrega después del zoom para quedar arriba de él. */}
        {miUbicacion.hayGps && (
          <BotonMiUbicacion buscando={miUbicacion.buscando} onBuscar={buscarMiUbicacion} />
        )}
        {/* Mapa base de OpenStreetMap; su licencia exige mostrar la atribución (RF-02). */}
        <CapaOsm />
        {/* Con ?evento= manda EnfocarEvento, salvo que ese evento no exista o no hayan llegado.
            Con ?lat=&lng= manda EnfocarPunto. */}
        <AjustarVista
          lugares={visibles}
          activa={
            !enSeguridad &&
            !punto &&
            (eventoEnfocadoId === null || eventoNoEncontrado || !!eventosPedido.error)
          }
        />
        <EnfocarEvento evento={eventoEnfocado} onEnfocar={onSeleccionarEvento} />
        <EnfocarPunto punto={punto} />
        {punto && (
          <Marker
            position={[punto.lat, punto.lng]}
            icon={ICONO_PUNTO}
            title="Punto a revisar"
            interactive={false}
            zIndexOffset={1000}
          />
        )}
        <SeguirTamanio />
        <LimitarATucuman />
        {yo && (
          <>
            {/* La precisión del GPS: un círculo suave, sin tapar los marcadores, con tope. */}
            <Circle
              center={[yo.lat, yo.lng]}
              radius={radioMiUbicacion(yo.precision)}
              interactive={false}
              pathOptions={{ color: AZUL, weight: 1, fillOpacity: 0.12 }}
            />
            <CircleMarker
              center={[yo.lat, yo.lng]}
              radius={8}
              interactive={false}
              className="mi-ubicacion"
              pathOptions={{ color: '#fff', weight: 3, fillColor: AZUL, fillOpacity: 1 }}
            />
          </>
        )}
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
        {miUbicacion.problema && (
          <div className="mapa-aviso mapa-aviso--con-cerrar" role="alert">
            <span>
              {
                {
                  fuera: 'Estás fuera de Tucumán.',
                  'sin-permiso': 'No diste permiso para usar tu ubicación. Podés activarlo en el navegador.',
                  'sin-senal': 'No pudimos obtener tu ubicación. Probá de nuevo en un rato.',
                }[miUbicacion.problema]
              }
            </span>
            <button
              type="button"
              className="mapa-aviso__cerrar"
              aria-label="Cerrar aviso"
              onClick={miUbicacion.olvidarProblema}
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
