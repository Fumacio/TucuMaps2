# CLAUDE.md

Guía para Claude Code (y cualquier persona) que trabaje en este repositorio.

## Qué es TucuMaps

Trabajo Final Integrador (TFI) de Nacho. Mapa web de la provincia de Tucumán con dos capas:

- **Turismo y eventos:** lugares históricos y agenda de eventos.
- **Seguridad ciudadana:** reportes de los vecinos (alertas) que un administrador modera antes de publicarlos.

Equipo: **Nacho** (backend, base de datos y despliegue; Product Owner) y su prima **Lourdes** (frontend, diseño, textos, fotos y pruebas en celular). Roles completos en `docs/Cronograma TucuMaps.md`.

Entrega final: **martes 17/11/2026**. Sprints de 1 semana (ver `docs/Cronograma TucuMaps.md`). Lo que el cronograma marca como evolutivo (RF-17 a RF-23) no se implementa antes de la entrega.

## Estado actual

Sprint 3 en curso (26/10 – 01/11). El **backend** (`backend/`) tiene la Fase 1 completa (servidor en capas, registro, login, sesión, verificación de email, recuperación de contraseña, límites y middlewares de seguridad) y la Fase 2 completa: catálogos, lugares, eventos y alertas públicas, administración de lugares y el seed de los 20 lugares. Está desplegado en Render (`https://tucumaps-api.onrender.com/api/salud`) y los 20 lugares ya están en producción con su contenido y sus fotos. El **frontend** (`frontend/`, Vite + React) ya tiene el mapa con los 20 lugares, la agrupación de marcadores, el selector de Seguridad con las alertas, la agenda de eventos, los estados de carga y las pantallas de Términos y Privacidad (#25 a #29 y #61); faltan las pantallas de cuenta, los formularios, Mis envíos y el panel admin (#60, #62 a #65). Está publicado en Vercel desde el 30/10/2026 (`https://tucu-maps2.vercel.app`, #59). La Fase 3 del backend también está completa (reportes, propuestas de eventos, confirmaciones, moderación de reportes y eventos, bloqueo de usuarios, resumen del panel, baja de cuenta y la retención de `jobs/retencion.js`; issues #42 a #49) y el perfil (RF-25).

Nacho quiere entender lo que se programa: avanzar de a pasos, explicar qué se hace y por qué, y mostrarle el resultado de cada paso.

## Documentación (fuente de verdad)

Antes de programar una funcionalidad, leer el requerimiento y el contrato correspondiente. Si el código y los documentos no coinciden, gana el documento salvo que Nacho diga otra cosa; en ese caso actualizar el documento en el mismo PR.

| Archivo | Para qué |
| :--- | :--- |
| `docs/SRS preliminar.md` | Requerimientos (RF-xx, RNF-xx). Los números de RF siguen la renumeración v1.7; la tabla 5.1 tiene las equivalencias. No reutilizar números viejos. |
| `docs/API TucuMaps.md` | Contrato REST: rutas, niveles de acceso, formato de error, paginación, CSRF. |
| `docs/Modelo de datos TucuMaps.md` | Tablas, diagramas de estado de reportes y eventos. |
| `docs/Diagrama de casos de uso TucuMaps.md`, `docs/Diagramas de clases y despliegue TucuMaps.md` | Diagramas UML: casos de uso, clases del dominio, componentes y despliegue. Si cambia una entidad, una capa o un servicio de despliegue, actualizar el diagrama. |
| `docs/schema.sql` | Esquema PostgreSQL de referencia; se traduce a la primera migración. |
| `docs/Tecnologias TucuMaps.md` | Stack, estructura de carpetas, variables de entorno, despliegue. |
| `docs/BACKLOG DE DESARROLLO TucuMaps.md` | Historias y tareas por fase. |
| `docs/Cronograma TucuMaps.md` | Qué entra en cada sprint. |
| `docs/Seed lugares TucuMaps.md` | Los 20 lugares históricos del seed. |
| `docs/Terminos de uso TucuMaps.md`, `docs/Politica de privacidad TucuMaps.md` | Textos legales (RF-04, RF-24). |

Los `.md` de `docs/` son notas de Obsidian: usan enlaces `[[...]]` y frontmatter. Mantener ese formato al editarlos.

## Stack

- **Frontend:** Vite + React (JavaScript, sin TypeScript), React-Leaflet + `react-leaflet-cluster`.
- **Backend:** Node.js 20+ y Express, validación con `zod`, `pg` (node-postgres) con consultas parametrizadas, migraciones con `node-pg-migrate`, `helmet`, `cors`, `express-rate-limit`, Nodemailer.
- **Auth:** JWT en cookie `httpOnly` `tm_sesion`, 90 días, renovada en cada solicitud autenticada; en cada solicitud se verifica en la base el bloqueo y `token_version`. Contraseñas con `bcrypt`.
- **Base:** PostgreSQL (Neon en producción). Catálogos como `CHECK`; imágenes solo por URL (sin subida de archivos en el MVP).
- **Pruebas:** Jest + Supertest (backend), Vitest + React Testing Library (frontend). CI con GitHub Actions.
- **Despliegue:** Vercel (frontend, con *rewrite* de `/api/*` a Render), Render (backend), Neon (base). Sin Firebase/Firestore.

## Estructura planificada

```
backend/
  src/
    app.js  server.js
    config/env.js        # lee y valida variables de entorno con zod
    db/pool.js
    middlewares/         # auth, requireRol, validar(zod), errores
    routes/ controllers/ services/ models/
    schemas/             # esquemas zod
    jobs/retencion.js    # RF-24
  migrations/            # node-pg-migrate
  seeds/                 # 20 lugares
  tests/                 # Jest + Supertest
frontend/
  src/ api/ context/ pages/ components/
docs/
```

Capas del backend: **rutas → controladores → servicios → modelos**. Las reglas de negocio (estados, límites, permisos) van en servicios; el SQL solo en modelos.

## Comandos

```bash
# Backend (copiar .env.example a .env y completarlo)
cd backend && npm install
npm run dev                           # servidor con recarga en http://localhost:3000/api
npm test                              # Jest + Supertest contra TEST_DATABASE_URL
npm run lint
npm run migrate -- up                 # aplica migraciones a DATABASE_URL
npm run crear-admin -- mail@ej.com    # convierte en admin a un usuario ya registrado
npm run seed                          # crea los 20 lugares que falten en DATABASE_URL de .env
npm run seed -- --actualizar          # además actualiza los existentes (categoría, localidad y coordenadas siempre; el resto si no es null)
# A otra base (producción): DATABASE_URL=... npm run seed -- --confirmar-produccion
npm run backup                        # pg_dump de BACKUP_DATABASE_URL (production) en backend/backups/, borra las de más de 30 días

# Frontend
cd frontend && npm install
npm run dev            # Vite (en desarrollo reenvía /api a http://localhost:3000)
npm test               # Vitest (vitest run)
npm run lint           # oxlint
npm run build          # vite build
```

Las variables de entorno están en `docs/Tecnologias TucuMaps.md` (sección "Variables de entorno"). Cada paquete debe tener un `.env.example`; los `.env` reales nunca se suben.

### Base de datos de pruebas

En las sesiones de Claude Code en la nube, `.claude/hooks/session-start.sh` levanta un PostgreSQL local, crea la base `tucumaps_test` y exporta:

```
TEST_DATABASE_URL=postgres://tucumaps:tucumaps@localhost:5432/tucumaps_test
```

Las pruebas del backend deben usar `TEST_DATABASE_URL` (nunca `DATABASE_URL`, que apunta a Neon). El hook también corre `npm install` en `backend/` y `frontend/` cuando existen.

En la compu de Nacho (Windows, sin Docker) `TEST_DATABASE_URL` apunta a la rama `tests` del proyecto TucuMaps en Neon, y `DATABASE_URL` a la rama `desarrollo`. Lourdes usa la rama `frontend`. La rama `production` queda para el despliegue. `tests/setup-global.js` borra y recrea el esquema de la base de pruebas en cada corrida. En GitHub Actions las pruebas usan un PostgreSQL de servicio (`.github/workflows/ci.yml`).

## Convenciones

- **Idioma:** español para nombres de dominio (tablas, columnas, rutas, códigos de error, mensajes), comentarios, commits y PR. Código técnico genérico (variables auxiliares) puede ir en inglés si queda más claro, pero sin mezclar dentro de un mismo concepto.
- **API:** todas las rutas bajo `/api`; errores con el formato `{ error: { codigo, mensaje, detalles? } }` y `mensaje` en español apto para mostrar al usuario. Las rutas que modifican datos exigen `X-Requested-With: TucuMaps`.
- **SQL:** siempre parametrizado (`$1, $2`). Nunca concatenar entradas del usuario.
- **Esquema:** cada cambio de base es una migración nueva; no editar migraciones ya aplicadas. Si cambia el modelo, actualizar `docs/schema.sql` y `docs/Modelo de datos TucuMaps.md`.
- **Secretos:** nunca en el repo ni en logs. Solo variables de entorno.
- **Referencias a requerimientos:** citar el RF en comentarios, tests y PR cuando aplique (ej. `// RF-09: límite diario`).
- **Pruebas:** cada endpoint nuevo lleva pruebas de Supertest para el caso feliz, validación, permisos y estado inválido. Meta del Sprint 5: 70 % de cobertura del backend.

## Flujo de trabajo con Git

- `main` es la rama estable. Cada cambio va en una rama propia con PR hacia `main`. Nunca se sube directo a `main`.
- **CI bloqueado:** desde el 12/10/2026 GitHub Actions no arranca porque la cuenta de Nacho está bloqueada por facturación (presupuestos de $0 sin medio de pago). El repo es público. Mientras siga así, "CI en verde" se reemplaza por correr `npm run lint` y `npm test` en local y decirlo en el PR. Las tareas periódicas (retención RF-24, copias de seguridad) no usan Actions.
- **Claude mergea sus propios PRs** (decisión de Nacho, 12/10/2026): cuando las pruebas pasan, el CI está en verde y la revisión de abajo no deja hallazgos sin corregir, Claude mergea el PR sin esperar aprobación y le avisa a Nacho con el enlace. Si queda algún hallazgo de seguridad sin resolver o el cambio necesita una decisión de Nacho, el PR espera.
- **`TRUST_PROXY` con Vercel:** desde el 30/10/2026 `TRUST_PROXY` en Render vale 2 por el *rewrite* de `/api` en Vercel (ver el comentario en `render.yaml`); con 1, el rate limiting vería la IP de Vercel para todos los usuarios. El riesgo de `X-Forwarded-For` falsificado llamando directo a Render está anotado en #59 para la revisión de seguridad del Sprint 5. Cambiar la configuración del despliegue se consulta con Nacho.
- Lo que no se puede deshacer (borrar datos en Neon, migraciones destructivas en producción, cambiar secretos o configuración del despliegue) siempre se consulta con Nacho antes.
- Commits chicos y descriptivos, en español.
- **Revisión automática antes de cada PR:** antes de abrir un PR, de pasarlo de borrador a listo o de mergearlo, Claude debe:
  1. Correr las pruebas y el linter de los paquetes que tocó.
  2. Correr la skill `code-review` sobre el diff y corregir lo que encuentre.
  3. Correr la skill `security-review` sobre el diff y corregir lo que encuentre (importa especialmente en auth, sesión, permisos, datos personales y validación).
  4. Mencionar en la descripción del PR qué se revisó y qué hallazgos quedaron sin corregir, con el motivo.
