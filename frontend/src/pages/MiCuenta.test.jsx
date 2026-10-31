import { fireEvent, screen, within } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { cerrarSesion, cerrarSesionEnTodos, obtenerSesion } from '../api/auth.js'
import { cambiarNombre, cambiarPassword, darDeBaja, pedirCambioDeEmail } from '../api/cuenta.js'
import { ANA, mostrarConSesion } from '../test/conSesion.jsx'
import MiCuenta from './MiCuenta.jsx'

vi.mock('../api/auth.js', () => ({
  obtenerSesion: vi.fn(),
  cerrarSesion: vi.fn(),
  cerrarSesionEnTodos: vi.fn(),
}))
vi.mock('../api/cuenta.js', () => ({
  cambiarNombre: vi.fn(),
  cambiarPassword: vi.fn(),
  pedirCambioDeEmail: vi.fn(),
  darDeBaja: vi.fn(),
}))

async function abrirOpcion(nombre) {
  const titulo = await screen.findByText(nombre, { selector: 'summary' })
  fireEvent.click(titulo)
  return titulo.closest('details')
}

function escribir(opcion, etiqueta, valor) {
  fireEvent.change(within(opcion).getByLabelText(etiqueta), { target: { value: valor } })
}

beforeEach(() => {
  vi.clearAllMocks()
  vi.mocked(obtenerSesion).mockResolvedValue(ANA)
})

describe('MiCuenta (RF-01, RF-24, RF-25)', () => {
  it('sin sesión lleva al login (Pantallas, 4)', async () => {
    vi.mocked(obtenerSesion).mockResolvedValue(null)
    mostrarConSesion('/cuenta', <MiCuenta />)

    expect(await screen.findByText('pantalla del login')).toBeInTheDocument()
  })

  it('muestra el nombre, el email y si está verificado; Mis envíos queda para el #63', async () => {
    mostrarConSesion('/cuenta', <MiCuenta />)

    expect(await screen.findByRole('heading', { name: 'Ana Pérez' })).toBeInTheDocument()
    expect(screen.getByText('ana@mail.com', { exact: false })).toHaveTextContent('Verificado')
    expect(screen.getByText(/Mis envíos/)).toHaveTextContent('próximamente')
  })

  it('cambiar el nombre actualiza lo que se muestra (RF-25)', async () => {
    vi.mocked(cambiarNombre).mockResolvedValue({ ...ANA, nombre: 'Ana María Pérez' })
    mostrarConSesion('/cuenta', <MiCuenta />)

    const opcion = await abrirOpcion('Cambiar nombre')
    escribir(opcion, 'Nombre', ' Ana María Pérez ')
    fireEvent.click(within(opcion).getByRole('button', { name: 'Guardar el nombre' }))

    expect(await screen.findByRole('heading', { name: 'Ana María Pérez' })).toBeInTheDocument()
    expect(cambiarNombre).toHaveBeenCalledWith('Ana María Pérez')
  })

  it('cambiar el email avisa que llega un enlace; un email en uso va debajo del campo (RF-25)', async () => {
    vi.mocked(pedirCambioDeEmail)
      .mockRejectedValueOnce({ codigo: 'EMAIL_EN_USO', mensaje: 'Ya hay una cuenta con ese email.' })
      .mockResolvedValue({ ok: true })
    mostrarConSesion('/cuenta', <MiCuenta />)

    const opcion = await abrirOpcion('Cambiar email')
    escribir(opcion, 'Email nuevo', 'otra@mail.com')
    escribir(opcion, 'Tu contraseña', 'clave1234')
    fireEvent.click(within(opcion).getByRole('button', { name: 'Cambiar el email' }))
    expect(await within(opcion).findByLabelText('Email nuevo')).toHaveAccessibleDescription(
      'Ya hay una cuenta con ese email.',
    )

    fireEvent.click(within(opcion).getByRole('button', { name: 'Cambiar el email' }))
    expect(await within(opcion).findByRole('status')).toHaveTextContent('Te mandamos un enlace a otra@mail.com')
    expect(pedirCambioDeEmail).toHaveBeenLastCalledWith({ emailNuevo: 'otra@mail.com', password: 'clave1234' })
  })

  it('cambiar la contraseña revisa la política antes y muestra la contraseña actual incorrecta', async () => {
    vi.mocked(cambiarPassword).mockRejectedValue({
      codigo: 'DATOS_INVALIDOS',
      mensaje: 'Revisá los datos ingresados.',
      detalles: [{ campo: 'password_actual', mensaje: 'La contraseña actual no es correcta' }],
    })
    mostrarConSesion('/cuenta', <MiCuenta />)

    const opcion = await abrirOpcion('Cambiar contraseña')
    escribir(opcion, 'Contraseña actual', 'vieja1234')
    escribir(opcion, 'Contraseña nueva', 'corta1')
    fireEvent.click(within(opcion).getByRole('button', { name: 'Cambiar la contraseña' }))
    expect(cambiarPassword).not.toHaveBeenCalled()

    escribir(opcion, 'Contraseña nueva', 'nueva12345')
    fireEvent.click(within(opcion).getByRole('button', { name: 'Cambiar la contraseña' }))
    expect(await within(opcion).findByText('La contraseña actual no es correcta')).toBeInTheDocument()
    expect(cambiarPassword).toHaveBeenCalledWith({ actual: 'vieja1234', nueva: 'nueva12345' })
  })

  it('borrar la cuenta pide la confirmación y después sale al mapa sin sesión (RF-24)', async () => {
    vi.mocked(darDeBaja).mockResolvedValue(null)
    mostrarConSesion('/cuenta', <MiCuenta />)

    const opcion = await abrirOpcion('Borrar cuenta')
    const boton = within(opcion).getByRole('button', { name: 'Borrar mi cuenta' })
    expect(boton).toBeDisabled()

    escribir(opcion, 'Tu contraseña', 'clave1234')
    fireEvent.click(within(opcion).getByRole('checkbox'))
    fireEvent.click(boton)

    expect(await screen.findByText('pantalla del mapa')).toBeInTheDocument()
    expect(darDeBaja).toHaveBeenCalledWith('clave1234')
  })

  it('si es el último administrador (409), lo dice y no borra nada', async () => {
    vi.mocked(darDeBaja).mockRejectedValue({
      codigo: 'ULTIMO_ADMIN',
      mensaje: 'Sos el único administrador: antes nombrá a otro.',
    })
    mostrarConSesion('/cuenta', <MiCuenta />)

    const opcion = await abrirOpcion('Borrar cuenta')
    escribir(opcion, 'Tu contraseña', 'clave1234')
    fireEvent.click(within(opcion).getByRole('checkbox'))
    fireEvent.click(within(opcion).getByRole('button', { name: 'Borrar mi cuenta' }))

    expect(await within(opcion).findByRole('alert')).toHaveTextContent('Sos el único administrador')
  })

  it('cerrar sesión y cerrar en todos los dispositivos llevan al mapa (RF-01)', async () => {
    vi.mocked(cerrarSesion).mockResolvedValue(null)
    vi.mocked(cerrarSesionEnTodos).mockResolvedValue(null)
    const { unmount } = mostrarConSesion('/cuenta', <MiCuenta />)

    fireEvent.click(await screen.findByRole('button', { name: 'Cerrar sesión' }))
    expect(await screen.findByText('pantalla del mapa')).toBeInTheDocument()
    expect(cerrarSesion).toHaveBeenCalled()
    unmount()

    mostrarConSesion('/cuenta', <MiCuenta />)
    fireEvent.click(await screen.findByRole('button', { name: 'Cerrar sesión en todos mis dispositivos' }))
    expect(await screen.findByText('pantalla del mapa')).toBeInTheDocument()
    expect(cerrarSesionEnTodos).toHaveBeenCalled()
  })

  it('si la sesión ya no existe (401, cerrada desde otro dispositivo), lleva al login', async () => {
    vi.mocked(cambiarNombre).mockRejectedValue({ codigo: 'NO_AUTENTICADO', mensaje: 'Tenés que iniciar sesión.' })
    mostrarConSesion('/cuenta', <MiCuenta />)

    const opcion = await abrirOpcion('Cambiar nombre')
    fireEvent.click(within(opcion).getByRole('button', { name: 'Guardar el nombre' }))

    expect(await screen.findByText('pantalla del login')).toBeInTheDocument()
  })

  it('cerrar sesión sin conexión no la muestra cerrada: se queda y avisa', async () => {
    vi.mocked(cerrarSesion).mockRejectedValue({
      codigo: 'SIN_CONEXION',
      mensaje: 'No pudimos conectarnos con el servidor.',
    })
    mostrarConSesion('/cuenta', <MiCuenta />)

    fireEvent.click(await screen.findByRole('button', { name: 'Cerrar sesión' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('No pudimos conectarnos')
    expect(screen.getByRole('heading', { name: 'Ana Pérez' })).toBeInTheDocument()
  })

  it('el "Listo" del nombre se va si se vuelve a editar', async () => {
    vi.mocked(cambiarNombre).mockResolvedValue(ANA)
    mostrarConSesion('/cuenta', <MiCuenta />)

    const opcion = await abrirOpcion('Cambiar nombre')
    fireEvent.click(within(opcion).getByRole('button', { name: 'Guardar el nombre' }))
    expect(await within(opcion).findByRole('status')).toHaveTextContent('Listo')

    escribir(opcion, 'Nombre', 'Otro')
    expect(within(opcion).queryByRole('status')).toBeNull()
  })
})
