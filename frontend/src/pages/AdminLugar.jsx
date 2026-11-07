import { useLocation } from 'react-router-dom'
import { crearLugar, editarLugar } from '../api/admin.js'
import Campo from '../components/Campo.jsx'
import ElegirUbicacion from '../components/ElegirUbicacion.jsx'
import ExitoEnvio from '../components/ExitoEnvio.jsx'
import { CATEGORIAS_LUGAR } from '../components/iconoLugar.js'
import SoloAdmin from '../components/SoloAdmin.jsx'
import { dentroDeTucuman } from '../components/ubicacion.js'
import { useFormularioEnvio } from '../hooks/useFormularioEnvio.js'

const VACIO = {
  nombre: '',
  categoria: '',
  descripcion: '',
  contenido_historico: '',
  fuente: '',
  direccion: '',
  localidad: 'San Miguel de Tucumán',
  barrio: '',
  horarios: '',
  precio_entrada: '',
  imagen_url: '',
}
const CAMPOS_DE_TEXTO = Object.keys(VACIO).filter((campo) => campo !== 'categoria')
const VOLVER = { a: '/admin?pestana=lugares', texto: 'Volver al panel', reemplazar: true }

// Un lugar de la lista, en el formato del formulario. El PUT reemplaza el lugar entero: por eso
// arranca con todos sus campos, para no borrar los que no se tocan.
function aFormulario(lugar) {
  const datos = { categoria: lugar.categoria }
  for (const campo of CAMPOS_DE_TEXTO) datos[campo] = lugar[campo] ?? ''
  return { datos, ubicacion: { lat: lugar.lat, lng: lugar.lng } }
}

function revisar(datos, ubicacion) {
  const errores = {}
  if (datos.nombre.trim().length < 2) errores.nombre = 'El nombre debe tener al menos 2 caracteres'
  if (!datos.categoria) errores.categoria = 'Elegí una categoría'
  // RF-10
  if (!ubicacion) errores.ubicacion = 'Marcá en el mapa dónde está'
  else if (!dentroDeTucuman(ubicacion)) errores.ubicacion = 'La ubicación debe estar dentro de Tucumán'
  const imagen = datos.imagen_url.trim()
  if (imagen && !/^https?:\/\//i.test(imagen)) {
    errores.imagen_url = 'La URL de la imagen debe empezar con http:// o https://'
  }
  return errores
}

function armar(datos, ubicacion) {
  const cuerpo = { categoria: datos.categoria, lat: ubicacion.lat, lng: ubicacion.lng }
  for (const campo of CAMPOS_DE_TEXTO) cuerpo[campo] = datos[campo].trim()
  return cuerpo
}

// RF-13: crear un lugar o editarlo completo. El lugar a editar llega de la lista (state.editar).
function AdminLugar() {
  const editar = useLocation().state?.editar ?? null

  return (
    <SoloAdmin>
      <FormularioLugar key={editar ? `editar-${editar.id}` : 'nuevo'} editar={editar} />
    </SoloAdmin>
  )
}

function FormularioLugar({ editar }) {
  const { datos, ubicacion, marcar, cambiar, errores, general, enviando, enviado, enviar, reiniciar } =
    useFormularioEnvio({
      vacio: VACIO,
      inicial: editar && aFormulario(editar),
      camposApi: [...CAMPOS_DE_TEXTO, 'categoria', 'lat', 'lng'],
      aCampo: (campo) => (campo === 'lat' || campo === 'lng' ? 'ubicacion' : campo),
      revisar,
      mandar: (valores, punto) =>
        editar ? editarLugar(editar.id, armar(valores, punto)) : crearLugar(armar(valores, punto)),
    })

  if (enviado) {
    return editar ? (
      <ExitoEnvio titulo="Guardamos los cambios" mensaje="El lugar quedó actualizado." volver={VOLVER} />
    ) : (
      <ExitoEnvio
        titulo="Lugar creado"
        mensaje="Ya se ve en el mapa."
        volver={VOLVER}
        otro="Crear otro lugar"
        onOtro={reiniciar}
      />
    )
  }

  // Lo común de cada campo de texto: su valor, su cambio y su error.
  const campo = (nombre) => ({ name: nombre, value: datos[nombre], onChange: cambiar, error: errores[nombre] })

  return (
    <div className="pagina-formulario">
      <form className="formulario formulario--envio" onSubmit={enviar} noValidate>
        <h1>{editar ? 'Editar lugar' : 'Crear lugar'}</h1>
        {general && (
          <p className="formulario__error" role="alert">
            {general}
          </p>
        )}

        <fieldset className="formulario__grupo">
          <legend>El lugar</legend>
          <Campo etiqueta="Nombre" maxLength={150} autoComplete="off" {...campo('nombre')} />
          <Campo etiqueta="Categoría" {...campo('categoria')}>
            <option value="">Elegí una</option>
            {Object.entries(CATEGORIAS_LUGAR).map(([valor, { etiqueta }]) => (
              <option key={valor} value={valor}>
                {etiqueta}
              </option>
            ))}
          </Campo>
          <Campo etiqueta="Descripción (opcional)" multilinea rows={3} maxLength={2000} {...campo('descripcion')} />
        </fieldset>

        <fieldset className="formulario__grupo">
          <legend>Dónde</legend>
          <Campo etiqueta="Dirección (opcional)" maxLength={200} autoComplete="off" {...campo('direccion')} />
          <div className="formulario__par">
            <Campo etiqueta="Localidad" maxLength={80} autoComplete="off" {...campo('localidad')} />
            <Campo etiqueta="Barrio (opcional)" maxLength={80} autoComplete="off" {...campo('barrio')} />
          </div>
          <ElegirUbicacion
            valor={ubicacion}
            onCambiar={marcar}
            error={errores.ubicacion}
            ayuda="Tocá el mapa donde está el lugar."
          />
        </fieldset>

        <fieldset className="formulario__grupo">
          <legend>Para visitarlo (opcional)</legend>
          <Campo etiqueta="Horarios" maxLength={200} autoComplete="off" {...campo('horarios')} />
          <Campo etiqueta="Precio de entrada" maxLength={200} autoComplete="off" {...campo('precio_entrada')} />
          <Campo
            etiqueta="Foto (URL)"
            type="url"
            inputMode="url"
            maxLength={500}
            placeholder="https://"
            {...campo('imagen_url')}
          />
        </fieldset>

        <fieldset className="formulario__grupo">
          <legend>Historia (opcional)</legend>
          <Campo etiqueta="Contenido histórico" multilinea rows={6} maxLength={20000} {...campo('contenido_historico')} />
          <Campo etiqueta="Fuente" maxLength={300} autoComplete="off" {...campo('fuente')} />
        </fieldset>

        <button type="submit" className="boton-principal" disabled={enviando}>
          {enviando ? 'Enviando…' : editar ? 'Guardar cambios' : 'Crear lugar'}
        </button>
      </form>
    </div>
  )
}

export default AdminLugar
