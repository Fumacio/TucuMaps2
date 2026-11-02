import { useId } from 'react'
import { enviarReporte } from '../api/reportes.js'
import Campo from '../components/Campo.jsx'
import ElegirUbicacion from '../components/ElegirUbicacion.jsx'
import ExitoEnvio from '../components/ExitoEnvio.jsx'
import { TIPOS_ALERTA } from '../components/iconoAlerta.js'
import PuertaDeEnvio from '../components/PuertaDeEnvio.jsx'
import { useFormularioEnvio } from '../hooks/useFormularioEnvio.js'

const VACIO = { tipo: '', descripcion: '', direccion: '', barrio: '' }

// RF-07, RF-09, RF-10: enviar un reporte de seguridad en 3 pasos (RNF-03): tocar "Enviar
// reporte", elegir el tipo y el punto, y enviar. Queda pendiente hasta que un administrador lo
// aprueba.
function Reportar() {
  return (
    <PuertaDeEnvio titulo="Enviar reporte" accion="enviar un reporte">
      <FormularioReporte />
    </PuertaDeEnvio>
  )
}

function revisar(datos, ubicacion) {
  const errores = {}
  if (!datos.tipo) errores.tipo = 'Elegí qué tipo de alerta es'
  const largo = datos.descripcion.trim().length
  if (largo < 10) errores.descripcion = 'Contá un poco más: al menos 10 caracteres'
  if (largo > 500) errores.descripcion = 'La descripción puede tener hasta 500 caracteres'
  if (!ubicacion) errores.ubicacion = 'Marcá en el mapa dónde pasó'
  return errores
}

function mandar(datos, ubicacion) {
  return enviarReporte({
    tipo: datos.tipo,
    descripcion: datos.descripcion.trim(),
    direccion: datos.direccion.trim(),
    barrio: datos.barrio.trim(),
    lat: ubicacion.lat,
    lng: ubicacion.lng,
  })
}

function FormularioReporte() {
  const idErrorTipo = useId()
  const { datos, ubicacion, marcar, cambiar, errores, general, enviando, enviado, enviar, reiniciar } =
    useFormularioEnvio({
      vacio: VACIO,
      camposApi: ['tipo', 'descripcion', 'direccion', 'barrio', 'lat', 'lng'],
      aCampo: (campo) => (campo === 'lat' || campo === 'lng' ? 'ubicacion' : campo),
      revisar,
      mandar,
    })

  if (enviado) {
    return (
      <ExitoEnvio
        titulo="¡Gracias por avisar!"
        mensaje="Tu reporte quedó pendiente de revisión. No va a aparecer en el mapa hasta que un administrador lo apruebe."
        otro="Enviar otro reporte"
        onOtro={reiniciar}
      />
    )
  }

  return (
    <div className="pagina-formulario">
      <form className="formulario formulario--envio" onSubmit={enviar} noValidate>
        <h1>Enviar reporte</h1>
        <p className="formulario__intro">
          Un administrador lo revisa antes de mostrarlo en el mapa. No pongas datos personales.
        </p>
        {general && (
          <p className="formulario__error" role="alert">
            {general}
          </p>
        )}

        <fieldset className="elegir-tipo" aria-describedby={errores.tipo ? idErrorTipo : undefined}>
          <legend>Tipo de alerta</legend>
          {Object.entries(TIPOS_ALERTA).map(([valor, { etiqueta, imagen }]) => (
            <label key={valor} className="elegir-tipo__opcion">
              <input
                type="radio"
                name="tipo"
                value={valor}
                checked={datos.tipo === valor}
                onChange={cambiar}
                aria-invalid={errores.tipo ? true : undefined}
              />
              <img src={imagen} alt="" />
              <span>{etiqueta}</span>
            </label>
          ))}
          {errores.tipo && (
            <p id={idErrorTipo} className="campo__error" role="alert">
              {errores.tipo}
            </p>
          )}
        </fieldset>

        <ElegirUbicacion valor={ubicacion} onCambiar={marcar} error={errores.ubicacion} />

        <Campo
          etiqueta="Qué pasó"
          name="descripcion"
          multilinea
          rows={4}
          maxLength={500}
          ayuda="Entre 10 y 500 caracteres."
          value={datos.descripcion}
          onChange={cambiar}
          error={errores.descripcion}
        />
        <Campo
          etiqueta="Dirección (opcional)"
          name="direccion"
          maxLength={200}
          autoComplete="off"
          value={datos.direccion}
          onChange={cambiar}
          error={errores.direccion}
        />
        <Campo
          etiqueta="Barrio (opcional)"
          name="barrio"
          maxLength={80}
          autoComplete="off"
          value={datos.barrio}
          onChange={cambiar}
          error={errores.barrio}
        />

        <button type="submit" className="boton-principal" disabled={enviando}>
          {enviando ? 'Enviando…' : 'Enviar reporte'}
        </button>
      </form>
    </div>
  )
}

export default Reportar
