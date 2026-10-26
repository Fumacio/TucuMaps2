import { useCallback, useEffect, useState } from 'react'

// RF-06: pide datos a la API y da { datos, error, cargando, reintentar }.
// `pedir` tiene que ser estable (useCallback): cuando cambia, se vuelve a pedir.
// `pedir` en null no pide nada (por ejemplo, una capa que no se está mirando).
export function usePedido(pedir) {
  const [intento, setIntento] = useState(0)
  // La última respuesta y a qué pedido e intento corresponde: si no son los actuales, está cargando.
  const [resultado, setResultado] = useState({ pedir: null, intento: -1, datos: null, error: null })

  useEffect(() => {
    if (!pedir) return
    let vigente = true // evita guardar una respuesta vieja si ya se pidió otra cosa
    pedir()
      .then((datos) => {
        if (vigente) setResultado({ pedir, intento, datos, error: null })
      })
      .catch((error) => {
        if (vigente) setResultado({ pedir, intento, datos: null, error })
      })
    return () => {
      vigente = false
    }
  }, [pedir, intento])

  const reintentar = useCallback(() => setIntento((n) => n + 1), [])
  const actual = pedir !== null && resultado.pedir === pedir && resultado.intento === intento

  return {
    datos: actual ? resultado.datos : null,
    error: actual ? resultado.error : null,
    cargando: pedir !== null && !actual,
    reintentar,
  }
}
