import { useCallback, useEffect, useState } from 'react'
import { useSesion } from '../context/sesion.js'

// Lista paginada del panel (RF-15): pide según filtros y página, y aplica las acciones de
// moderación sin recargar la pantalla. `pedir(filtros, pagina)` tiene que ser siempre la misma
// función. `filtrosIniciales.estado` decide qué elementos siguen en la lista después de una acción.
export function useListaAdmin(pedir, filtrosIniciales) {
  const { entrar } = useSesion()
  const [filtros, setFiltros] = useState(filtrosIniciales)
  const [pagina, setPagina] = useState(1)
  const [intento, setIntento] = useState(0)
  const [aviso, setAviso] = useState(null) // { tipo: 'exito' | 'error', texto }
  // La respuesta y a qué consulta corresponde: si no es la actual, está cargando.
  const consulta = JSON.stringify({ filtros, pagina, intento })
  const [resultado, setResultado] = useState({ consulta: null, datos: [], total: 0, error: null })

  useEffect(() => {
    let vigente = true
    pedir(filtros, pagina)
      .then(({ datos, total }) => {
        if (vigente) setResultado({ consulta, datos, total, error: null })
      })
      .catch((error) => {
        if (!vigente) return
        // La sesión se cerró en otro lado: la pantalla pasa a pedir que la inicie de nuevo.
        if (error?.codigo === 'NO_AUTENTICADO') entrar(null)
        setResultado({ consulta, datos: [], total: 0, error })
      })
    return () => {
      vigente = false
    }
    // `consulta` ya resume filtros, página e intento.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [consulta, pedir, entrar])

  const recargar = useCallback(() => setIntento((n) => n + 1), [])

  function cambiarFiltro(nombre, valor) {
    setFiltros((anteriores) => ({ ...anteriores, [nombre]: valor }))
    setPagina(1)
    setAviso(null)
  }

  // Ejecuta una acción sobre un elemento. Devuelve si salió bien.
  async function ejecutar(promesa, textoExito) {
    setAviso(null)
    try {
      const actualizado = await promesa
      setAviso({ tipo: 'exito', texto: textoExito })
      const sigueEnLaLista = !filtros.estado || actualizado.estado === filtros.estado
      if (sigueEnLaLista) {
        setResultado((actual) => ({
          ...actual,
          datos: actual.datos.map((e) => (e.id === actualizado.id ? actualizado : e)),
        }))
      } else if (resultado.datos.length === 1) {
        // Era el último de la página: se pide de nuevo la que corresponda.
        setPagina((n) => Math.max(1, n - 1))
        recargar()
      } else {
        setResultado((actual) => ({
          ...actual,
          datos: actual.datos.filter((e) => e.id !== actualizado.id),
          total: actual.total - 1,
        }))
      }
      return true
    } catch (error) {
      if (error?.codigo === 'NO_AUTENTICADO') {
        entrar(null)
        return false
      }
      setAviso({ tipo: 'error', texto: error?.mensaje })
      // 409 o 404: otro administrador ya actuó; la lista muestra cómo quedó de verdad.
      if (error?.codigo === 'TRANSICION_INVALIDA' || error?.codigo === 'NO_ENCONTRADO') recargar()
      return false
    }
  }

  return {
    filtros,
    cambiarFiltro,
    pagina,
    setPagina,
    elementos: resultado.consulta === consulta ? resultado.datos : [],
    total: resultado.total,
    error: resultado.consulta === consulta ? resultado.error : null,
    cargando: resultado.consulta !== consulta,
    recargar,
    aviso,
    ejecutar,
  }
}
