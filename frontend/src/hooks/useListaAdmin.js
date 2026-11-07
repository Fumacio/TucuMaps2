import { useCallback, useEffect, useState } from 'react'
import { useSesion } from '../context/sesion.js'

// Lista paginada del panel (RF-15): pide según filtros y página, y después de cada acción de
// moderación vuelve a pedir la página actual, sin recargar la pantalla. Así la lista y las
// páginas siempre son las del servidor. `pedir(filtros, pagina)` tiene que ser siempre la misma
// función. `onCambio` avisa que algo cambió en el servidor (para actualizar los contadores).
export function useListaAdmin(pedir, filtrosIniciales, onCambio) {
  const { entrar } = useSesion()
  const [filtros, setFiltros] = useState(filtrosIniciales)
  const [pagina, setPagina] = useState(1)
  const [intento, setIntento] = useState(0)
  const [aviso, setAviso] = useState(null) // { tipo: 'exito' | 'error', texto }
  // Qué se está mirando. Al volver a pedir lo mismo (otro intento) la lista sigue a la vista.
  const vista = JSON.stringify({ filtros, pagina })
  const [resultado, setResultado] = useState({ vista: null, intento: -1, datos: [], total: 0, error: null })

  useEffect(() => {
    let vigente = true
    pedir(filtros, pagina)
      .then(({ datos, total, por_pagina: porPagina }) => {
        if (!vigente) return
        // Se vació la última página (por ejemplo, otro administrador actuó): va a la última que hay.
        const ultima = Math.max(1, Math.ceil(total / porPagina))
        if (datos.length === 0 && ultima < pagina) {
          setPagina(ultima)
          return
        }
        setResultado({ vista, intento, datos, total, error: null })
      })
      .catch((error) => {
        if (!vigente) return
        // La sesión se cerró en otro lado: la pantalla pasa a pedir que la inicie de nuevo.
        if (error?.codigo === 'NO_AUTENTICADO') entrar(null)
        setResultado({ vista, intento, datos: [], total: 0, error })
      })
    return () => {
      vigente = false
    }
  }, [pedir, filtros, pagina, intento, vista, entrar])

  const recargar = useCallback(() => setIntento((n) => n + 1), [])
  const mismaVista = resultado.vista === vista

  function cambiarFiltro(nombre, valor) {
    setFiltros((anteriores) => ({ ...anteriores, [nombre]: valor }))
    setPagina(1)
    setAviso(null)
  }

  function irAPagina(nueva) {
    setPagina(nueva)
    setAviso(null)
  }

  // Ejecuta una acción sobre un elemento. Devuelve si salió bien.
  async function ejecutar(promesa, textoExito) {
    setAviso(null)
    try {
      await promesa
      setAviso({ tipo: 'exito', texto: textoExito })
      recargar()
      onCambio?.()
      return true
    } catch (error) {
      if (error?.codigo === 'NO_AUTENTICADO') {
        entrar(null)
        return false
      }
      setAviso({ tipo: 'error', texto: error?.mensaje })
      // 409 o 404: otro administrador ya actuó; la lista muestra cómo quedó de verdad.
      if (error?.codigo === 'TRANSICION_INVALIDA' || error?.codigo === 'NO_ENCONTRADO') {
        recargar()
        onCambio?.()
      }
      return false
    }
  }

  return {
    filtros,
    cambiarFiltro,
    pagina,
    irAPagina,
    elementos: mismaVista ? resultado.datos : [],
    total: resultado.total,
    error: mismaVista ? resultado.error : null,
    cargando: !mismaVista || resultado.intento !== intento,
    recargar,
    aviso,
    ejecutar,
  }
}
