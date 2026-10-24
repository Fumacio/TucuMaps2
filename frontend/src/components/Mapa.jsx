import 'leaflet/dist/leaflet.css'
import 'react-leaflet-cluster/dist/assets/MarkerCluster.css' // animación al abrir y cerrar grupos
import { useEffect, useRef, useState } from 'react'
import { MapContainer, TileLayer, ZoomControl, useMap } from 'react-leaflet'
import MarkerClusterGroup from 'react-leaflet-cluster'
import { obtenerLugares } from '../api/lugares.js'
import { sumarLugaresDePrueba } from '../dev/lugaresDePrueba.js'
import { iconoGrupoDeCapa } from './iconoGrupo.js'
import MarcadorLugar from './MarcadorLugar.jsx'

const ICONO_GRUPO_TURISMO = iconoGrupoDeCapa('turismo')

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

function Mapa({ onSeleccionarLugar }) {
  const [lugares, setLugares] = useState(null) // null = todavía no llegaron
  const [error, setError] = useState(null)
  const visibles = lugares ?? []

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
        {/* RF-05: los pins cercanos se juntan en un círculo con el total; al acercarse o tocarlo,
            se separan. La capa de Seguridad va a usar lo mismo con iconoGrupoDeCapa('seguridad'). */}
        <MarkerClusterGroup
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
      </MapContainer>
      {error && (
        <p className="mapa-aviso" role="alert">
          {error.mensaje}
        </p>
      )}
      {/* Llegó la lista pero vacía (por ejemplo, una base sin el seed): que no parezca un error del mapa. */}
      {lugares?.length === 0 && (
        <p className="mapa-aviso" role="status">
          Todavía no hay lugares para mostrar.
        </p>
      )}
    </>
  )
}

export default Mapa
