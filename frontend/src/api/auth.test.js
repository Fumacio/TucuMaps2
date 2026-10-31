import { beforeEach, describe, expect, it, vi } from 'vitest'
import { iniciarSesion, obtenerSesion, registrarse, restablecerPassword } from './auth.js'
import { api } from './cliente.js'
import { cambiarPassword, darDeBaja, pedirCambioDeEmail } from './cuenta.js'

vi.mock('./cliente.js', () => ({ api: vi.fn() }))

const ANA = { id: 12, nombre: 'Ana Pérez', email: 'ana@mail.com', rol: 'ciudadano', email_verificado: false }

beforeEach(() => {
  vi.mocked(api).mockReset()
})

describe('sesión (RF-01)', () => {
  it('obtenerSesion devuelve el usuario conectado', async () => {
    vi.mocked(api).mockResolvedValue({ usuario: ANA })

    expect(await obtenerSesion()).toEqual(ANA)
    expect(api).toHaveBeenCalledWith('/auth/me')
  })

  it('sin sesión (401) devuelve null en vez de un error', async () => {
    vi.mocked(api).mockRejectedValue({ codigo: 'NO_AUTENTICADO', mensaje: 'Tenés que iniciar sesión.' })

    expect(await obtenerSesion()).toBeNull()
  })

  it('si el servidor falla, el error sigue de largo para mostrarlo', async () => {
    const error = { codigo: 'SIN_CONEXION', mensaje: 'Sin conexión' }
    vi.mocked(api).mockRejectedValue(error)

    await expect(obtenerSesion()).rejects.toEqual(error)
  })

  it('iniciarSesion manda email y contraseña por POST', async () => {
    vi.mocked(api).mockResolvedValue({ usuario: ANA })

    expect(await iniciarSesion({ email: 'ana@mail.com', password: 'clave1234' })).toEqual(ANA)
    expect(api).toHaveBeenCalledWith('/auth/login', {
      metodo: 'POST',
      cuerpo: { email: 'ana@mail.com', password: 'clave1234' },
    })
  })
})

describe('registro (RF-01, RF-04)', () => {
  it('la casilla de Términos completa acepta_terminos y mayor_de_edad', async () => {
    vi.mocked(api).mockResolvedValue({ usuario: ANA })

    await registrarse({ nombre: 'Ana Pérez', email: 'ana@mail.com', password: 'clave1234', aceptaTerminos: true })

    expect(api).toHaveBeenCalledWith('/auth/registro', {
      metodo: 'POST',
      cuerpo: {
        nombre: 'Ana Pérez',
        email: 'ana@mail.com',
        password: 'clave1234',
        acepta_terminos: true,
        mayor_de_edad: true,
      },
    })
  })
})

describe('contraseña y cuenta (RF-03, RF-24, RF-25)', () => {
  it('restablecerPassword manda el token del enlace y la contraseña nueva', async () => {
    await restablecerPassword({ token: 'abc', password: 'nueva1234' })
    expect(api).toHaveBeenCalledWith('/auth/restablecer', {
      metodo: 'POST',
      cuerpo: { token: 'abc', password: 'nueva1234' },
    })
  })

  it('cambiarPassword usa los nombres de campo de la API', async () => {
    await cambiarPassword({ actual: 'vieja1234', nueva: 'nueva1234' })
    expect(api).toHaveBeenCalledWith('/cuenta/password', {
      metodo: 'PATCH',
      cuerpo: { password_actual: 'vieja1234', password_nueva: 'nueva1234' },
    })
  })

  it('pedirCambioDeEmail y darDeBaja piden la contraseña', async () => {
    await pedirCambioDeEmail({ emailNuevo: 'nueva@mail.com', password: 'clave1234' })
    expect(api).toHaveBeenLastCalledWith('/cuenta/email', {
      metodo: 'POST',
      cuerpo: { email_nuevo: 'nueva@mail.com', password: 'clave1234' },
    })

    await darDeBaja('clave1234')
    expect(api).toHaveBeenLastCalledWith('/cuenta', { metodo: 'DELETE', cuerpo: { password: 'clave1234' } })
  })
})
