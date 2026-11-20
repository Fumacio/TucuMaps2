import { useEffect, useRef, useState } from 'react'
import { dentroDeTucuman } from '../components/ubicacion.js'

// La ubicación del celular, solo cuando la persona la pide (así el navegador no pregunta apenas se
// entra). No se manda a ningún lado ni se guarda: la usa quien la pidió.
// - buscar(alEncontrar): alEncontrar recibe { lat, lng, precision } (precisión en metros).
// - problema: null, 'sin-permiso' (no dio permiso), 'sin-senal' (no se pudo ubicar a tiempo) o
//   'fuera' (fuera de Tucumán).
export function useMiUbicacion() {
  const [buscando, setBuscando] = useState(false)
  const [problema, setProblema] = useState(null)
  const hayGps = typeof navigator !== 'undefined' && 'geolocation' in navigator
  // El GPS puede tardar: si mientras tanto se dejó la pantalla, su respuesta se ignora.
  const montado = useRef(true)

  useEffect(() => {
    montado.current = true
    return () => {
      montado.current = false
    }
  }, [])

  function buscar(alEncontrar) {
    setBuscando(true)
    setProblema(null)
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        if (!montado.current) return
        setBuscando(false)
        const punto = { lat: coords.latitude, lng: coords.longitude, precision: coords.accuracy }
        if (!dentroDeTucuman(punto)) {
          setProblema('fuera')
          return
        }
        alEncontrar(punto)
      },
      (error) => {
        if (!montado.current) return
        setBuscando(false)
        setProblema(error?.code === 1 ? 'sin-permiso' : 'sin-senal') // 1 = PERMISSION_DENIED
      },
      // Una ubicación de hasta un minuto atrás sirve: en la compu o bajo techo, pedir siempre una
      // nueva y precisa suele pasarse de los 10 segundos.
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 },
    )
  }

  return { hayGps, buscando, problema, buscar, olvidarProblema: () => setProblema(null) }
}
