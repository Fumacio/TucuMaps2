import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import Campo from './Campo.jsx'
import { errorDePassword, erroresPorCampo } from './formularios.js'

describe('errorDePassword (RF-01)', () => {
  it('acepta 8 caracteres o más con al menos una letra y un número', () => {
    expect(errorDePassword('clave1234')).toBeNull()
    expect(errorDePassword('ñandú2026')).toBeNull() // las letras con tilde o ñ también cuentan
  })

  it('rechaza las cortas, las sin número o sin letra, con el mensaje del servidor', () => {
    expect(errorDePassword('ab12')).toBe('La contraseña debe tener al menos 8 caracteres')
    expect(errorDePassword('solamenteletras')).toBe('La contraseña debe tener al menos una letra y un número')
    expect(errorDePassword('12345678')).toBe('La contraseña debe tener al menos una letra y un número')
  })

  it('rechaza las de más de 72 bytes (bcrypt cortaría el resto)', () => {
    expect(errorDePassword('a1'.repeat(37))).toBe('La contraseña es demasiado larga')
  })
})

describe('erroresPorCampo', () => {
  it('pasa los detalles de la API a un objeto por campo, con el primer mensaje de cada uno', () => {
    const error = {
      codigo: 'DATOS_INVALIDOS',
      mensaje: 'Revisá los datos.',
      detalles: [
        { campo: 'email', mensaje: 'El email no es válido' },
        { campo: 'password', mensaje: 'Muy corta' },
        { campo: 'password', mensaje: 'Sin número' },
      ],
    }

    expect(erroresPorCampo(error)).toEqual({ email: 'El email no es válido', password: 'Muy corta' })
  })

  it('sin detalles (u otro tipo de error) no hay errores por campo', () => {
    expect(erroresPorCampo({ codigo: 'CREDENCIALES_INVALIDAS', mensaje: 'x' })).toEqual({})
    expect(erroresPorCampo(null)).toEqual({})
  })
})

describe('Campo', () => {
  it('asocia la etiqueta, la ayuda y el error al campo', () => {
    render(<Campo etiqueta="Contraseña" type="password" ayuda="Mínimo 8, con letra y número" error="Muy corta" />)

    const entrada = screen.getByLabelText('Contraseña')
    expect(entrada).toHaveAttribute('type', 'password')
    expect(entrada).toHaveAttribute('aria-invalid', 'true')
    expect(entrada).toHaveAccessibleDescription('Mínimo 8, con letra y número Muy corta')
  })

  it('sin error no marca el campo como inválido', () => {
    render(<Campo etiqueta="Correo" type="email" />)

    expect(screen.getByLabelText('Correo')).not.toHaveAttribute('aria-invalid')
  })
})
