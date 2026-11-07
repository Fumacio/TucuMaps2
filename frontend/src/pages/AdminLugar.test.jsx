import { fireEvent, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { crearLugar, editarLugar } from '../api/admin.js'
import { obtenerSesion } from '../api/auth.js'
import { ANA, mostrarConSesion } from '../test/conSesion.jsx'
import AdminLugar from './AdminLugar.jsx'

vi.mock('../api/auth.js', () => ({ obtenerSesion: vi.fn() }))
vi.mock('../api/admin.js', () => ({ crearLugar: vi.fn(), editarLugar: vi.fn() }))
// El mapa real no se puede tocar en jsdom: los botones marcan un punto (ElegirUbicacion tiene sus pruebas).
vi.mock('../components/ElegirUbicacion.jsx', () => ({
  default: ({ onCambiar, error }) => (
    <div>
      <button type="button" onClick={() => onCambiar({ lat: -26.83, lng: -65.2 })}>
        marcar punto
      </button>
      <button type="button" onClick={() => onCambiar({ lat: -34.6, lng: -58.4 })}>
        marcar afuera
      </button>
      {error && <p>{error}</p>}
    </div>
  ),
}))

const CASA = {
  id: 2,
  nombre: 'Casa Histórica',
  categoria: 'historico',
  descripcion: 'Donde se declaró la independencia',
  contenido_historico: 'Texto largo de la historia',
  fuente: 'Museo',
  direccion: 'Congreso 151',
  localidad: 'San Miguel de Tucumán',
  barrio: null,
  horarios: 'De 9 a 18',
  precio_entrada: 'Gratuita',
  imagen_url: 'https://ejemplo.com/casa.jpg',
  lat: -26.833132,
  lng: -65.203841,
  activo: false,
}

function escribir(etiqueta, valor) {
  fireEvent.change(screen.getByLabelText(etiqueta), { target: { value: valor } })
}

function guardar(nombre) {
  fireEvent.click(screen.getByRole('button', { name: nombre }))
}

function mostrarEditando() {
  mostrarConSesion({ pathname: '/admin/lugar', state: { editar: CASA } }, <AdminLugar />, '/admin/lugar')
}

beforeEach(() => {
  vi.clearAllMocks()
  vi.mocked(obtenerSesion).mockResolvedValue({ ...ANA, rol: 'admin' })
})

describe('AdminLugar (RF-10, RF-13)', () => {
  it('un ciudadano ve un aviso y no el formulario', async () => {
    vi.mocked(obtenerSesion).mockResolvedValue(ANA)
    mostrarConSesion('/admin/lugar', <AdminLugar />)

    expect(await screen.findByRole('alert')).toHaveTextContent('No tenés permiso')
    expect(screen.queryByLabelText('Nombre')).toBeNull()
  })

  it('crear manda POST con el precio de entrada, y la localidad viene completa', async () => {
    vi.mocked(crearLugar).mockResolvedValue({ id: 30 })
    mostrarConSesion('/admin/lugar', <AdminLugar />)

    await screen.findByRole('heading', { name: 'Crear lugar' })
    escribir('Nombre', '  Parque 9 de Julio ')
    escribir('Categoría', 'recreativo')
    escribir('Precio de entrada', 'Gratuita')
    guardar('marcar punto')
    guardar('Crear lugar')

    expect(await screen.findByRole('status')).toHaveTextContent('Ya se ve en el mapa.')
    expect(crearLugar).toHaveBeenCalledWith(
      expect.objectContaining({
        nombre: 'Parque 9 de Julio',
        categoria: 'recreativo',
        precio_entrada: 'Gratuita',
        localidad: 'San Miguel de Tucumán',
        lat: -26.83,
        lng: -65.2,
      }),
    )
    expect(screen.getByRole('link', { name: 'Volver al panel' })).toHaveAttribute('href', '/admin?pestana=lugares')
  })

  it('antes de enviar revisa nombre, categoría, punto y URL de la foto', async () => {
    mostrarConSesion('/admin/lugar', <AdminLugar />)

    await screen.findByRole('heading', { name: 'Crear lugar' })
    escribir('Foto (URL)', 'javascript:alert(1)')
    guardar('Crear lugar')

    expect(screen.getByLabelText('Nombre')).toHaveAccessibleDescription('El nombre debe tener al menos 2 caracteres')
    expect(screen.getByLabelText('Categoría')).toHaveAccessibleDescription('Elegí una categoría')
    expect(screen.getByText('Marcá en el mapa dónde está')).toBeInTheDocument()
    expect(screen.getByLabelText('Foto (URL)')).toHaveAccessibleDescription(
      'La URL de la imagen debe empezar con http:// o https://',
    )
    expect(crearLugar).not.toHaveBeenCalled()
  })

  it('una localidad vacía no se manda: la API la cambiaría por la capital', async () => {
    mostrarEditando()

    await screen.findByRole('heading', { name: 'Editar lugar' })
    escribir('Localidad', '  ')
    guardar('Guardar cambios')

    expect(screen.getByLabelText('Localidad')).toHaveAccessibleDescription('Escribí la localidad')
    expect(editarLugar).not.toHaveBeenCalled()
  })

  it('un punto fuera de Tucumán no se manda', async () => {
    mostrarConSesion('/admin/lugar', <AdminLugar />)

    await screen.findByRole('heading', { name: 'Crear lugar' })
    escribir('Nombre', 'Lugar')
    escribir('Categoría', 'historico')
    guardar('marcar afuera')
    guardar('Crear lugar')

    expect(screen.getByText('La ubicación debe estar dentro de Tucumán')).toBeInTheDocument()
    expect(crearLugar).not.toHaveBeenCalled()
  })

  it('un nombre repetido muestra el error de la API debajo del campo', async () => {
    vi.mocked(crearLugar).mockRejectedValue({
      codigo: 'DATOS_INVALIDOS',
      mensaje: 'Revisá los datos ingresados.',
      detalles: [{ campo: 'nombre', mensaje: 'Ya hay un lugar con ese nombre' }],
    })
    mostrarConSesion('/admin/lugar', <AdminLugar />)

    await screen.findByRole('heading', { name: 'Crear lugar' })
    escribir('Nombre', 'Casa Histórica')
    escribir('Categoría', 'historico')
    guardar('marcar punto')
    guardar('Crear lugar')

    await screen.findByText('Ya hay un lugar con ese nombre')
    expect(screen.getByLabelText('Nombre')).toHaveAccessibleDescription('Ya hay un lugar con ese nombre')
  })

  it('editar arranca con todos los campos y los manda todos: el PUT no borra nada', async () => {
    vi.mocked(editarLugar).mockResolvedValue(CASA)
    mostrarEditando()

    await screen.findByRole('heading', { name: 'Editar lugar' })
    expect(screen.getByLabelText('Contenido histórico')).toHaveValue('Texto largo de la historia')
    escribir('Horarios', 'De 10 a 18')
    guardar('Guardar cambios')

    expect(await screen.findByRole('status')).toHaveTextContent('El lugar quedó actualizado.')
    expect(editarLugar).toHaveBeenCalledWith(2, {
      nombre: 'Casa Histórica',
      categoria: 'historico',
      descripcion: 'Donde se declaró la independencia',
      contenido_historico: 'Texto largo de la historia',
      fuente: 'Museo',
      direccion: 'Congreso 151',
      localidad: 'San Miguel de Tucumán',
      barrio: '',
      horarios: 'De 10 a 18',
      precio_entrada: 'Gratuita',
      imagen_url: 'https://ejemplo.com/casa.jpg',
      lat: -26.833132,
      lng: -65.203841,
    })
  })
})
