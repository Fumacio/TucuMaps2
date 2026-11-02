import { fireEvent, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { obtenerSesion } from '../api/auth.js'
import { editarReporte, enviarReporte } from '../api/reportes.js'
import { ANA, mostrarConSesion } from '../test/conSesion.jsx'
import Reportar from './Reportar.jsx'

vi.mock('../api/auth.js', () => ({ obtenerSesion: vi.fn() }))
vi.mock('../api/reportes.js', () => ({ enviarReporte: vi.fn(), editarReporte: vi.fn() }))
// El mapa real no se puede tocar en jsdom: un botón marca el punto (ElegirUbicacion tiene sus pruebas).
vi.mock('../components/ElegirUbicacion.jsx', () => ({
  default: ({ onCambiar, error }) => (
    <div>
      <button type="button" onClick={() => onCambiar({ lat: -26.83, lng: -65.2 })}>
        marcar punto
      </button>
      {error && <p>{error}</p>}
    </div>
  ),
}))

async function completar() {
  fireEvent.click(await screen.findByLabelText('Robos, asaltos y entraderas'))
  fireEvent.click(screen.getByRole('button', { name: 'marcar punto' }))
  fireEvent.change(screen.getByLabelText('Qué pasó'), { target: { value: '  Arrebato en la parada  ' } })
}

function enviar() {
  fireEvent.click(screen.getByRole('button', { name: 'Enviar reporte' }))
}

beforeEach(() => {
  vi.clearAllMocks()
  vi.mocked(obtenerSesion).mockResolvedValue(ANA)
})

describe('Reportar (RF-07, RF-09, RF-10)', () => {
  it('envía el tipo, la descripción y el punto, y avisa que queda pendiente de revisión', async () => {
    vi.mocked(enviarReporte).mockResolvedValue({ id: 45, estado: 'pendiente' })
    mostrarConSesion('/reportar', <Reportar />)

    await completar()
    fireEvent.change(screen.getByLabelText('Barrio (opcional)'), { target: { value: 'Centro' } })
    enviar()

    expect(await screen.findByRole('status')).toHaveTextContent(
      'pendiente de revisión. No va a aparecer en el mapa hasta que un administrador lo apruebe',
    )
    expect(enviarReporte).toHaveBeenCalledWith({
      tipo: 'robo_asalto',
      descripcion: 'Arrebato en la parada',
      direccion: '',
      barrio: 'Centro',
      lat: -26.83,
      lng: -65.2,
    })

    fireEvent.click(screen.getByRole('button', { name: 'Enviar otro reporte' }))
    expect(screen.getByLabelText('Qué pasó')).toHaveValue('')
  })

  it('antes de enviar pide el tipo, el punto y una descripción de al menos 10 caracteres', async () => {
    mostrarConSesion('/reportar', <Reportar />)
    fireEvent.change(await screen.findByLabelText('Qué pasó'), { target: { value: 'corto' } })
    enviar()

    expect(screen.getByText('Elegí qué tipo de alerta es')).toHaveAttribute('role', 'alert')
    expect(screen.getByLabelText('Robos, asaltos y entraderas')).toHaveAttribute('aria-invalid', 'true')
    expect(screen.getByText('Marcá en el mapa dónde pasó')).toBeInTheDocument()
    expect(screen.getByLabelText('Qué pasó')).toHaveAccessibleDescription(
      'Entre 10 y 500 caracteres. Contá un poco más: al menos 10 caracteres',
    )
    expect(enviarReporte).not.toHaveBeenCalled()

    fireEvent.click(screen.getByLabelText('Robos, asaltos y entraderas'))
    fireEvent.click(screen.getByRole('button', { name: 'marcar punto' }))
    expect(screen.queryByText('Elegí qué tipo de alerta es')).toBeNull()
    expect(screen.queryByText('Marcá en el mapa dónde pasó')).toBeNull()
  })

  it('el límite diario (429) se muestra con el mensaje de la API (RF-09)', async () => {
    vi.mocked(enviarReporte).mockRejectedValue({
      codigo: 'LIMITE_DIARIO',
      mensaje: 'Llegaste al límite de 5 reportes por día. Probá mañana.',
    })
    mostrarConSesion('/reportar', <Reportar />)

    await completar()
    enviar()

    expect(await screen.findByRole('alert')).toHaveTextContent('Llegaste al límite de 5 reportes por día')
  })

  it('los errores de la API van debajo de cada campo; los de lat/lng, en la ubicación', async () => {
    vi.mocked(enviarReporte).mockRejectedValue({
      codigo: 'DATOS_INVALIDOS',
      mensaje: 'Revisá los datos ingresados.',
      detalles: [
        { campo: 'barrio', mensaje: 'El barrio puede tener hasta 80 caracteres' },
        { campo: 'lat', mensaje: 'La ubicación debe estar dentro de Tucumán' },
      ],
    })
    mostrarConSesion('/reportar', <Reportar />)

    await completar()
    enviar()

    expect(await screen.findByLabelText('Barrio (opcional)')).toHaveAccessibleDescription(
      'El barrio puede tener hasta 80 caracteres',
    )
    expect(screen.getByText('La ubicación debe estar dentro de Tucumán')).toBeInTheDocument()
  })

  it('si la sesión se cerró en otro dispositivo, pide iniciarla de nuevo', async () => {
    vi.mocked(enviarReporte).mockRejectedValue({ codigo: 'NO_AUTENTICADO', mensaje: 'Tenés que iniciar sesión.' })
    mostrarConSesion('/reportar', <Reportar />)

    await completar()
    enviar()

    expect(await screen.findByText('Para enviar un reporte tenés que iniciar sesión.')).toBeInTheDocument()
  })
})

describe('Reportar en modo edición (RF-07)', () => {
  it('desde Mis envíos arranca con los datos del reporte y guarda con PUT', async () => {
    vi.mocked(editarReporte).mockResolvedValue({ id: 45, estado: 'pendiente' })
    const envio = {
      tipo: 'reporte',
      id: 45,
      estado: 'pendiente',
      contenido: {
        tipo: 'robo_asalto',
        descripcion: 'Arrebato en la parada',
        direccion: null,
        barrio: 'Centro',
        lat: -26.83,
        lng: -65.2,
      },
    }
    mostrarConSesion({ pathname: '/reportar', state: { editar: envio } }, <Reportar />, '/reportar')

    expect(await screen.findByRole('heading', { name: 'Editar reporte' })).toBeInTheDocument()
    expect(screen.getByLabelText('Robos, asaltos y entraderas')).toBeChecked()
    expect(screen.getByLabelText('Qué pasó')).toHaveValue('Arrebato en la parada')

    fireEvent.change(screen.getByLabelText('Dirección (opcional)'), { target: { value: 'Av. Mate de Luna 2400' } })
    fireEvent.click(screen.getByRole('button', { name: 'Guardar cambios' }))

    expect(await screen.findByRole('status')).toHaveTextContent('Tu reporte sigue pendiente de revisión.')
    expect(editarReporte).toHaveBeenCalledWith(45, {
      tipo: 'robo_asalto',
      descripcion: 'Arrebato en la parada',
      direccion: 'Av. Mate de Luna 2400',
      barrio: 'Centro',
      lat: -26.83,
      lng: -65.2,
    })
    expect(screen.getByRole('link', { name: 'Volver a Mis envíos' })).toHaveAttribute('href', '/mis-envios')
  })
})
