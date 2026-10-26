import 'leaflet/dist/leaflet.css'
import 'react-leaflet-cluster/dist/assets/MarkerCluster.css' // animación al abrir y cerrar grupos
import { useEffect, useRef, useState } from 'react'
import { MapContainer, TileLayer, ZoomControl, useMap } from 'react-leaflet'
import MarkerClusterGroup from 'react-leaflet-cluster'
import { obtenerLugares } from '../api/lugares.js'
import { obtenerAlertas } from '../api/reportes.js'
import { sumarAlertasDePrueba } from '../dev/alertasDePrueba.js'
import { sumarLugaresDePrueba } from '../dev/lugaresDePrueba.js'
import { iconoGrupoDeCapa } from './iconoGrupo.js'
import MarcadorAlerta from './MarcadorAlerta.jsx'
import MarcadorLugar from './MarcadorLugar.jsx'

const ICONO_GRUPO_TURISMO = iconoGrupoDeCapa('turismo')
const ICONO_GRUPO_SEGURIDAD = iconoGrupoDeCapa('seguridad')

// RF-02: el mapa abre centrado en Tucumán. Con este centro y zoom se ven los 20 lugares del seed,
// desde el centro de San Miguel hasta Villa Nougués.
const CENTRO_TUCUMAN = [-26.82, -65.26]
const ZOOM_INICIAL = 12

// Cuando llegan los lugares, acomoda la vista para que entren todos, sea cual sea el ancho de la
// pantalla (en el celular, el centro y zoom fijos dejaban lugares afuera). Lo hace una sola vez,
// y no lo hace si la persona ya movió el mapa mientras esperaba (el backend puede tardar en
// "despertar"), para no hacerle saltar la vista.
function AjustarVista({ lugares }) {
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
    if (yaAjustada.current || lugares.length === 0) return
    yaAjustada.current = true
    mapa.fitBounds(
      lugares.map((lugar) => [lugar.lat, lugar.lng]),
      { padding: [40, 40], maxZoom: 15 }, // margen para que los pins no queden en el borde
    )
  }, [mapa, lugares])

  return null
}

function Mapa({ capa = 'turismo', onSeleccionarLugar }) {
  const [lugares, setLugares] = useState(null) // null = todavía no llegaron
  const [error, setError] = useState(null)
  const visibles = lugares ?? []
  const [alertas, setAlertas] = useState(null)
  const [errorAlertas, setErrorAlertas] = useState(null)
  const enSeguridad = capa === 'seguridad'

  // RF-11: se piden cada vez que se entra a Seguridad, porque vencen a las 24 hs.
  useEffect(() => {
    if (!enSeguridad) return
    let vigente = true
    obtenerAlertas()
      .then((datos) => {
        if (!vigente) return
        setAlertas(sumarAlertasDePrueba(datos))
        setErrorAlertas(null)
      })
      .catch((err) => {
        if (vigente) setErrorAlertas(err)
      })
    return () => {
      vigente = false
    }
  }, [enSeguridad])

  const errorVisible = enSeguridad ? errorAlertas : error

  // Pide los lugares una sola vez, cuando el mapa aparece en pantalla.
  useEffect(() => {
    let vigente = true // evita guardar la respuesta si el mapa ya se cerró
    obtenerLugares()
      .then((datos) => {
        if (vigente) setLugares(sumarLugaresDePrueba(datos))
      })
      .catch((err) => {
        if (vigente) setError(err)
      })
    return () => {
      vigente = false
    }
  }, [])

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
        <AjustarVista lugares={visibles} />
        {/* RF-02: solo los marcadores de la capa elegida. RF-05: los cercanos se agrupan. */}
        {enSeguridad ? (
          <MarkerClusterGroup
            key="seguridad"
            iconCreateFunction={ICONO_GRUPO_SEGURIDAD}
            maxClusterRadius={50}
            showCoverageOnHover={false}
            spiderfyOnMaxZoom
            chunkedLoading
          >
            {(alertas ?? []).map((alerta) => (
              <MarcadorAlerta key={alerta.id} alerta={alerta} />
            ))}
          </MarkerClusterGroup>
        ) : (
          <MarkerClusterGroup
            key="turismo"
            iconCreateFunction={ICONO_GRUPO_TURISMO}
            maxClusterRadius={50}
            showCoverageOnHover={false}
            spiderfyOnMaxZoom
            chunkedLoading
          >
            {visibles.map((lugar) => (
              <MarcadorLugar key={lugar.id} lugar={lugar} onSeleccionar={onSeleccionarLugar} />
            ))}
          </MarkerClusterGroup>
        )}
      </MapContainer>
      {errorVisible && (
        <p className="mapa-aviso" role="alert">
          {errorVisible.mensaje}
        </p>
      )}
      {/* Llegó la lista pero vacía (por ejemplo, una base sin el seed): que no parezca un error del mapa. */}
      {!enSeguridad && lugares?.length === 0 && (
        <p className="mapa-aviso" role="status">
          Todavía no hay lugares para mostrar.
        </p>
      )}
      {enSeguridad && alertas?.length === 0 && !errorAlertas && (
        <p className="mapa-aviso" role="status">
          No hay alertas activas en este momento.
        </p>
      )}
    </>
  )
}

export default Mapa
