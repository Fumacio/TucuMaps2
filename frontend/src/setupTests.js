// Se ejecuta antes de las pruebas: suma comprobaciones como toBeInTheDocument()
// y desmonta lo que dibujó cada prueba para que no afecte a la siguiente.
import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach } from 'vitest'

afterEach(() => {
  cleanup()
})
