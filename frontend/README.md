# TucuMaps · Frontend

Aplicación web de TucuMaps hecha con Vite + React (JavaScript).

## Cómo arrancarlo

```bash
cd frontend
npm install     # descarga las librerías (solo la primera vez o cuando cambian)
npm run dev     # abre la app en http://localhost:5173
```

## Comandos

| Comando | Qué hace |
| :--- | :--- |
| `npm run dev` | Servidor de desarrollo; la página se actualiza sola al guardar. |
| `npm run build` | Arma la versión para publicar en la carpeta `dist/`. |
| `npm run preview` | Muestra en el navegador la versión armada con `build`. |
| `npm run lint` | Revisa el código con oxlint. |
| `npm test` | Corre las pruebas (Vitest + React Testing Library). |

En desarrollo, las llamadas a `/api` se reenvían al backend en `http://localhost:3000` (proxy de `vite.config.js`), así que para usar datos reales hay que tener el backend corriendo (`cd backend && npm run dev`).

## Carpetas de `src/`

| Carpeta | Qué va adentro |
| :--- | :--- |
| `api/` | Las funciones que llaman a la API (un solo lugar para todos los `fetch`). |
| `context/` | `AuthContext`: quién es el usuario actual (`GET /api/auth/me`). |
| `pages/` | Una página por pantalla: Mapa, Agenda, Login, Registro, MisEnvios, Perfil, Legales, admin/... |
| `components/` | Piezas reutilizables: Mapa, Marcadores, PanelDetalle, Formularios, AvisoLegal. |
| `assets/` | Imágenes e íconos que usa el código. |

La documentación del proyecto (requerimientos, contrato de la API, cronograma) está en `docs/`, en la raíz del repositorio.
