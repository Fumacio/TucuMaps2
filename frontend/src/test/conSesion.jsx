// Para las pruebas de pantallas de cuenta: dibuja la pantalla en `ruta`, con ProveedorSesion
// y una pantalla de mapa y de login de mentira para ver adónde lleva. La prueba tiene que haber
// reemplazado ../api/auth.js (vi.mock) y decidir qué devuelve obtenerSesion.
import { render } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import ProveedorSesion from '../context/ProveedorSesion.jsx'

export const ANA = {
  id: 12,
  nombre: 'Ana Pérez',
  email: 'ana@mail.com',
  rol: 'ciudadano',
  email_verificado: true,
}

export function mostrarConSesion(ruta, pantalla, rutaDePantalla = ruta.split('?')[0]) {
  return render(
    <MemoryRouter initialEntries={[ruta]}>
      <ProveedorSesion>
        <Routes>
          <Route path={rutaDePantalla} element={pantalla} />
          <Route path="/" element={<p>pantalla del mapa</p>} />
          <Route path="/ingresar" element={<p>pantalla del login</p>} />
        </Routes>
      </ProveedorSesion>
    </MemoryRouter>,
  )
}
