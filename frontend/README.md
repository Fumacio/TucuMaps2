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

### Probar el mapa con muchos marcadores (RNF-04)

Con `npm run dev`, abrir `http://localhost:5173/?marcadores=500` suma 500 lugares inventados a los reales (hasta 5000), para comprobar que el mapa sigue fluido con la agrupación (RF-05). Solo funciona en desarrollo: al armar la versión publicada (`npm run build`), Vite saca ese código. Al tocar un lugar inventado, el panel muestra un error, porque no existe en la API.

## Publicación en Vercel (#59)

`vercel.json` configura el despliegue:

- **`/api/*` → Render:** Vercel reenvía las llamadas a `https://tucumaps-api.onrender.com/api/*`. Para el navegador la API está en el mismo dominio que la página, así la cookie de sesión no se bloquea (Safari bloquea las de otros sitios).
- **Rutas de la app:** cualquier otra dirección que no sea un archivo (por ejemplo `/admin` o `/mis-envios`) devuelve `index.html`, y React Router muestra la pantalla que corresponde. Sin esto, recargar la página en esas rutas daría 404.
- **Cabeceras:** algunas de seguridad básicas, y caché larga para `assets/` (Vite les pone un hash en el nombre, así que cambian de nombre en cada versión).

En Vercel, el proyecto se crea con **Root Directory = `frontend`**; el resto (Vite, `npm run build`, `dist/`) lo toma de `vercel.json`. En Render, `TRUST_PROXY` vale 2 y `FRONTEND_URL` tiene la URL de Vercel (`https://tucu-maps2.vercel.app`, desde el 30/10/2026; ver `render.yaml`).

## Carpetas de `src/`

| Carpeta | Qué va adentro |
| :--- | :--- |
| `api/` | Las funciones que llaman a la API (un solo lugar para todos los `fetch`). |
| `context/` | `AuthContext`: quién es el usuario actual (`GET /api/auth/me`). |
| `pages/` | Una página por pantalla: Mapa, Agenda, Login, Registro, MisEnvios, Perfil, Legales, admin/... |
| `components/` | Piezas reutilizables: Mapa, Marcadores, PanelDetalle, Formularios, AvisoLegal. |
| `assets/` | Imágenes e íconos que usa el código. |
| `dev/` | Ayudas que solo existen en desarrollo, como los lugares de prueba. |
| `test/` | Datos de ejemplo para las pruebas. |

La documentación del proyecto (requerimientos, contrato de la API, cronograma) está en `docs/`, en la raíz del repositorio.
