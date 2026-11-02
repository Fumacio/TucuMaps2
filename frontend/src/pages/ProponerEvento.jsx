import { proponerEvento } from '../api/eventos.js'
import { obtenerLugares } from '../api/lugares.js'
import Campo from '../components/Campo.jsx'
import ElegirUbicacion from '../components/ElegirUbicacion.jsx'
import ExitoEnvio from '../components/ExitoEnvio.jsx'
import { ahoraEnTucuman, enUnAnioEnTucuman, fechaHoraConZona } from '../components/fechas.js'
import { CATEGORIAS_EVENTO, MODALIDADES_EVENTO } from '../components/iconoEvento.js'
import PuertaDeEnvio from '../components/PuertaDeEnvio.jsx'
import { useFormularioEnvio } from '../hooks/useFormularioEnvio.js'
import { usePedido } from '../hooks/usePedido.js'

const VACIO = {
  nombre: '',
  categoria: '',
  modalidad: '',
  descripcion: '',
  lugarId: '',
  lugar_nombre: '',
  direccion: '',
  barrio: '',
  inicio: '',
  fin: '',
  flyer_url: '',
  etiquetas: '',
}
const DIA_MS = 24 * 60 * 60 * 1000
const CAMPOS_API = [
  'nombre',
  'categoria',
  'modalidad',
  'descripcion',
  'lugar_nombre',
  'direccion',
  'barrio',
  'lugar_id',
  'lat',
  'lng',
  'inicio',
  'fin',
  'flyer_url',
  'etiquetas',
  ...[0, 1, 2, 3, 4].map((i) => `etiquetas.${i}`),
]

// Debajo de qué campo del formulario va cada error de la API.
function aCampo(campo) {
  if (campo === 'lat' || campo === 'lng') return 'ubicacion'
  if (campo === 'lugar_id') return 'lugarId'
  if (campo.startsWith('etiquetas')) return 'etiquetas'
  return campo
}

// "folclore, familia,, Folclore" → ["folclore", "familia"]: sin vacías y sin repetidas (sin
// distinguir mayúsculas), como las cuenta la API.
function separarEtiquetas(texto) {
  const etiquetas = texto
    .split(',')
    .map((etiqueta) => etiqueta.trim())
    .filter(Boolean)
  return etiquetas.filter((e, i) => etiquetas.findIndex((o) => o.toLowerCase() === e.toLowerCase()) === i)
}

function revisar(datos, ubicacion) {
  const errores = {}
  const largo = (campo) => datos[campo].trim().length
  if (largo('nombre') < 3) errores.nombre = 'El nombre debe tener al menos 3 caracteres'
  if (!datos.categoria) errores.categoria = 'Elegí una categoría'
  if (!datos.modalidad) errores.modalidad = 'Elegí una modalidad'
  if (largo('descripcion') < 10) errores.descripcion = 'Contá un poco más: al menos 10 caracteres'
  if (largo('lugar_nombre') < 3) errores.lugar_nombre = 'Escribí el nombre del lugar'
  if (largo('direccion') < 3) errores.direccion = 'Escribí la dirección'
  if (largo('barrio') < 2) errores.barrio = 'Escribí el barrio'
  if (!ubicacion) errores.ubicacion = 'Marcá en el mapa dónde es'

  // Las mismas reglas de fechas que la API.
  const inicio = Date.parse(fechaHoraConZona(datos.inicio))
  const fin = Date.parse(fechaHoraConZona(datos.fin))
  if (!datos.inicio) errores.inicio = 'Elegí cuándo empieza'
  else if (inicio <= Date.now()) errores.inicio = 'El evento tiene que empezar en el futuro'
  else if (inicio - Date.now() > 366 * DIA_MS) errores.inicio = 'El evento tiene que empezar dentro del próximo año'
  if (datos.fin && inicio && fin <= inicio) errores.fin = 'El fin tiene que ser posterior al inicio'
  else if (datos.fin && inicio && fin - inicio > 31 * DIA_MS) errores.fin = 'El evento puede durar hasta 31 días'

  const etiquetas = separarEtiquetas(datos.etiquetas)
  if (etiquetas.length > 5) errores.etiquetas = 'Podés poner hasta 5 etiquetas'
  else if (etiquetas.some((e) => e.length < 2 || e.length > 30)) {
    errores.etiquetas = 'Cada etiqueta debe tener entre 2 y 30 caracteres'
  }
  return errores
}

function mandar(datos, ubicacion) {
  return proponerEvento({
    nombre: datos.nombre.trim(),
    categoria: datos.categoria,
    modalidad: datos.modalidad,
    descripcion: datos.descripcion.trim(),
    lugar_nombre: datos.lugar_nombre.trim(),
    direccion: datos.direccion.trim(),
    barrio: datos.barrio.trim(),
    lugar_id: datos.lugarId ? Number(datos.lugarId) : null,
    lat: ubicacion.lat,
    lng: ubicacion.lng,
    inicio: fechaHoraConZona(datos.inicio),
    fin: fechaHoraConZona(datos.fin) || null,
    flyer_url: datos.flyer_url.trim(),
    etiquetas: separarEtiquetas(datos.etiquetas),
  })
}

// RF-07, RF-09, RF-10: proponer un evento. Queda pendiente hasta que un administrador la aprueba.
function ProponerEvento() {
  return (
    <PuertaDeEnvio titulo="Proponer evento" accion="proponer un evento">
      <FormularioEvento />
    </PuertaDeEnvio>
  )
}

function FormularioEvento() {
  const { datos: lugares } = usePedido(obtenerLugares)
  const formulario = useFormularioEnvio({ vacio: VACIO, camposApi: CAMPOS_API, aCampo, revisar, mandar })
  const { datos, setDatos, ubicacion, marcar, olvidarError, errores, general, enviando, enviar } = formulario

  // Elegir uno de los 20 lugares completa su nombre, dirección, barrio y punto. Volver a "Otro
  // lugar" los borra, para no mandar los datos de un lugar con otro nombre.
  function elegirLugar(evento) {
    const lugar = lugares?.find((l) => String(l.id) === evento.target.value)
    setDatos((anteriores) => ({
      ...anteriores,
      lugarId: lugar ? evento.target.value : '',
      lugar_nombre: lugar?.nombre ?? '',
      direccion: lugar?.direccion ?? '',
      barrio: lugar?.barrio ?? '',
    }))
    marcar(lugar ? { lat: lugar.lat, lng: lugar.lng } : null)
    olvidarError('lugarId', 'lugar_nombre', 'direccion', 'barrio')
  }

  // Cambiar el nombre del lugar o mover el punto ya no es el lugar del mapa elegido.
  function cambiar(evento) {
    if (evento.target.name === 'lugar_nombre') setDatos((anteriores) => ({ ...anteriores, lugarId: '' }))
    formulario.cambiar(evento)
  }

  function moverPunto(punto) {
    setDatos((anteriores) => ({ ...anteriores, lugarId: '' }))
    marcar(punto)
  }

  if (formulario.enviado) {
    return (
      <ExitoEnvio
        titulo="¡Gracias por tu propuesta!"
        mensaje="Tu evento quedó pendiente de revisión. No va a aparecer en el mapa ni en la agenda hasta que un administrador lo apruebe."
        otro="Proponer otro evento"
        onOtro={formulario.reiniciar}
      />
    )
  }

  return (
    <div className="pagina-formulario">
      <form className="formulario formulario--envio" onSubmit={enviar} noValidate>
        <h1>Proponer evento</h1>
        <p className="formulario__intro">
          Un administrador lo revisa antes de mostrarlo en el mapa y en la agenda.
        </p>
        {general && (
          <p className="formulario__error" role="alert">
            {general}
          </p>
        )}

        <fieldset className="formulario__grupo">
          <legend>El evento</legend>
          <Campo
            etiqueta="Nombre"
            name="nombre"
            maxLength={150}
            autoComplete="off"
            value={datos.nombre}
            onChange={cambiar}
            error={errores.nombre}
          />
          <div className="formulario__par">
            <Campo
              etiqueta="Categoría"
              name="categoria"
              value={datos.categoria}
              onChange={cambiar}
              error={errores.categoria}
            >
              <option value="">Elegí una</option>
              {Object.entries(CATEGORIAS_EVENTO).map(([valor, etiqueta]) => (
                <option key={valor} value={valor}>
                  {etiqueta}
                </option>
              ))}
            </Campo>
            <Campo
              etiqueta="Modalidad"
              name="modalidad"
              value={datos.modalidad}
              onChange={cambiar}
              error={errores.modalidad}
            >
              <option value="">Elegí una</option>
              {Object.entries(MODALIDADES_EVENTO).map(([valor, etiqueta]) => (
                <option key={valor} value={valor}>
                  {etiqueta}
                </option>
              ))}
            </Campo>
          </div>
          <Campo
            etiqueta="Descripción"
            name="descripcion"
            multilinea
            rows={4}
            maxLength={2000}
            ayuda="Entre 10 y 2000 caracteres."
            value={datos.descripcion}
            onChange={cambiar}
            error={errores.descripcion}
          />
        </fieldset>

        <fieldset className="formulario__grupo">
          <legend>Cuándo</legend>
          <div className="formulario__par">
            <Campo
              etiqueta="Empieza"
              name="inicio"
              type="datetime-local"
              min={ahoraEnTucuman()}
              max={enUnAnioEnTucuman()}
              value={datos.inicio}
              onChange={cambiar}
              error={errores.inicio}
            />
            <Campo
              etiqueta="Termina (opcional)"
              name="fin"
              type="datetime-local"
              min={datos.inicio || ahoraEnTucuman()}
              value={datos.fin}
              onChange={cambiar}
              error={errores.fin}
            />
          </div>
        </fieldset>

        <fieldset className="formulario__grupo">
          <legend>Dónde</legend>
          <Campo
            etiqueta="Lugar del mapa (opcional)"
            name="lugarId"
            ayuda="Si es en uno de los lugares de TucuMaps, elegilo y se completan los datos."
            value={datos.lugarId}
            onChange={elegirLugar}
            error={errores.lugarId}
          >
            <option value="">Otro lugar</option>
            {lugares?.map((lugar) => (
              <option key={lugar.id} value={lugar.id}>
                {lugar.nombre}
              </option>
            ))}
          </Campo>
          <Campo
            etiqueta="Nombre del lugar"
            name="lugar_nombre"
            maxLength={150}
            autoComplete="off"
            value={datos.lugar_nombre}
            onChange={cambiar}
            error={errores.lugar_nombre}
          />
          <div className="formulario__par">
            <Campo
              etiqueta="Dirección"
              name="direccion"
              maxLength={200}
              autoComplete="off"
              value={datos.direccion}
              onChange={cambiar}
              error={errores.direccion}
            />
            <Campo
              etiqueta="Barrio"
              name="barrio"
              maxLength={80}
              autoComplete="off"
              value={datos.barrio}
              onChange={cambiar}
              error={errores.barrio}
            />
          </div>
          <ElegirUbicacion
            valor={ubicacion}
            onCambiar={moverPunto}
            error={errores.ubicacion}
            ayuda="Tocá el mapa donde es el evento."
          />
        </fieldset>

        <fieldset className="formulario__grupo">
          <legend>Más datos (opcional)</legend>
          <Campo
            etiqueta="Imagen o flyer (URL)"
            name="flyer_url"
            type="url"
            inputMode="url"
            maxLength={500}
            placeholder="https://"
            value={datos.flyer_url}
            onChange={cambiar}
            error={errores.flyer_url}
          />
          <Campo
            etiqueta="Etiquetas"
            name="etiquetas"
            autoComplete="off"
            ayuda="Separadas por coma, hasta 5. Por ejemplo: folclore, familia."
            value={datos.etiquetas}
            onChange={cambiar}
            error={errores.etiquetas}
          />
        </fieldset>

        <button type="submit" className="boton-principal" disabled={enviando}>
          {enviando ? 'Enviando…' : 'Proponer evento'}
        </button>
      </form>
    </div>
  )
}

export default ProponerEvento
