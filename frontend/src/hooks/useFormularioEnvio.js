import { useState } from 'react'
import { separarErrores } from '../components/formularios.js'
import { useSesion } from '../context/sesion.js'

// Lo común a los formularios de reporte y de evento (RF-07): los datos, el punto del mapa, los
// errores por campo (los de la revisión local y los de la API juntos) y el envío.
// - camposApi: los campos que manda la API en `detalles`; `aCampo` dice debajo de qué campo del
//   formulario va cada uno (por ejemplo, lat y lng van debajo del mapa).
// - revisar(datos, ubicacion): errores antes de enviar, como { campo: mensaje }.
// - mandar(datos, ubicacion): la llamada a la API.
export function useFormularioEnvio({ vacio, camposApi, aCampo = (campo) => campo, revisar, mandar }) {
  const { entrar } = useSesion()
  const [datos, setDatos] = useState(vacio)
  const [ubicacion, setUbicacion] = useState(null)
  const [errores, setErrores] = useState({})
  const [general, setGeneral] = useState(null)
  const [enviando, setEnviando] = useState(false)
  const [enviado, setEnviado] = useState(false)

  // Al corregir un campo se va solo su error; los demás quedan hasta el próximo envío.
  function olvidarError(...campos) {
    setErrores((anteriores) => {
      const quedan = { ...anteriores }
      for (const campo of campos) delete quedan[campo]
      return quedan
    })
  }

  function cambiar(evento) {
    const { name, value } = evento.target
    setDatos((anteriores) => ({ ...anteriores, [name]: value }))
    olvidarError(name)
  }

  function marcar(punto) {
    setUbicacion(punto)
    olvidarError('ubicacion')
  }

  async function enviar(evento) {
    evento.preventDefault()
    setGeneral(null)
    const locales = revisar(datos, ubicacion)
    setErrores(locales)
    if (Object.keys(locales).length > 0) return

    setEnviando(true)
    try {
      await mandar(datos, ubicacion)
      setEnviado(true)
    } catch (err) {
      // La sesión se cerró en otro lado: la puerta pasa a pedir que la inicie de nuevo.
      if (err?.codigo === 'NO_AUTENTICADO') return entrar(null)
      const { porCampo, general: mensaje } = separarErrores(err, camposApi)
      const deLaApi = {}
      for (const [campo, texto] of Object.entries(porCampo)) deLaApi[aCampo(campo)] ??= texto
      setErrores(deLaApi)
      setGeneral(mensaje)
    } finally {
      setEnviando(false)
    }
  }

  function reiniciar() {
    setDatos(vacio)
    setUbicacion(null)
    setErrores({})
    setGeneral(null)
    setEnviado(false)
  }

  return {
    datos,
    setDatos,
    ubicacion,
    marcar,
    cambiar,
    olvidarError,
    errores,
    general,
    enviando,
    enviado,
    enviar,
    reiniciar,
  }
}
