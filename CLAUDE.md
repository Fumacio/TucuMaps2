# CLAUDE.md

Guía para Claude Code (y cualquier persona) que trabaje en este repositorio.

## Qué es TucuMaps

Trabajo Final Integrador (TFI) de Nacho. Mapa web de la provincia de Tucumán con dos capas:

- **Turismo y eventos:** lugares históricos y agenda de eventos.
- **Seguridad ciudadana:** reportes de los vecinos (alertas) que un administrador modera antes de publicarlos.

Equipo: **Nacho** (backend, base de datos y despliegue; Product Owner) y su prima **Lourdes** (frontend, diseño, textos, fotos y pruebas en celular). Roles completos en `docs/Cronograma TucuMaps.md`.

Entrega final: **martes 17/11/2026**. Sprints de 1 semana (ver `docs/Cronograma TucuMaps.md`). Lo que el cronograma marca como evolutivo (RF-17 a RF-23) no se implementa antes de la entrega.

## Estado actual

Sprint 5 en curso (09/11 – 15/11): pruebas, seguridad, copias de seguridad y carpeta del TFI, sin funcionalidades nuevas. El **backend** (`backend/`) está completo: Fases 1 a 3 (cuenta y sesión, contenido público, envíos, moderación, usuarios, baja de cuenta y retención, issues #42 a #49), el perfil (RF-25), la revisión de seguridad (#100) y el rendimiento (#101). Está desplegado en Render (`https://tucumaps-api.onrender.com/api/salud`) con los 20 lugares en producción. El **frontend** (`frontend/`, Vite + React) también está completo en funcionalidad: mapa, agrupación, selector de Seguridad, agenda, estados de carga, textos legales, pantallas de cuenta, formularios, Mis aportes y panel admin (#25 a #29 y #60 a #65). Está publicado en Vercel desde el 30/10/2026 (`https://tucu-maps2.vercel.app`, #59). Falta: la copia diaria programada (#99), la carpeta del TFI (#102), el manual con capturas y "Mi ubicación" (#111).

Nacho quiere entender lo que se programa: avanzar de a pasos, explicar qué se hace y por qué, y mostrarle el resultado de cada paso.

## Documentación (fuente de verdad)

Antes de programar una funcionalidad, leer el requerimiento y el contrato correspondiente. Si el código y los documentos no coinciden, gana el documento salvo que Nacho diga otra cosa; en ese caso actualizar el documento en el mismo PR.

| Archivo | Para qué |
| :--- | :--- |
| `docs/SRS TucuMaps.md` | Requerimientos (RF-xx, RNF-xx). Los números de RF siguen la renumeración v1.7; la tabla 5.1 tiene las equivalencias. No reutilizar números viejos. |
| `docs/API TucuMaps.md` | Contrato REST: rutas, niveles de acceso, formato de error, paginación, CSRF. |
| `docs/Modelo de datos TucuMaps.md` | Tablas, diagramas de estado de reportes y eventos. |
| `docs/Diagrama de casos de uso TucuMaps.md`, `docs/Diagramas de clases y despliegue TucuMaps.md` | Diagramas UML: casos de uso, clases del dominio, componentes y despliegue. Si cambia una entidad, una capa o un servicio de despliegue, actualizar el diagrama. |
| `docs/schema.sql` | Esquema PostgreSQL de referencia; se traduce a la primera migración. |
| `docs/Tecnologias TucuMaps.md` | Stack, estructura de carpetas, variables de entorno, despliegue. |
| `docs/BACKLOG DE DESARROLLO TucuMaps.md` | Historias y tareas por fase. |
| `docs/Cronograma TucuMaps.md` | Qué entra en cada sprint. |
| `docs/Seed lugares TucuMaps.md` | Los 20 lugares históricos del seed. |
| `docs/Terminos de uso TucuMaps.md`, `docs/Politica de privacidad TucuMaps.md` | Textos legales (RF-04, RF-24). |
| `docs/Carpeta de presentacion TucuMaps.md` | Checklist de la carpeta del TFI según la guía de la UTN FRT, decisiones de formato y lo esencial de APA 7. |

Los `.md` de `docs/` son notas de Obsidian: usan enlaces `[[...]]` y frontmatter. Mantener ese formato al editarlos.

## Stack

- **Frontend:** Vite + React (JavaScript, sin TypeScript), React-Leaflet + `react-leaflet-cluster`.
- **Backend:** Node.js 20+ y Express, validación con `zod`, `pg` (node-postgres) con consultas parametrizadas, migraciones con `node-pg-migrate`, `helmet`, `cors`, `express-rate-limit`, `compression`, Nodemailer.
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
npm run seed-demo                     # reportes y eventos de ejemplo a nombre de demo@tucumaps.invalid (DEMO_PASSWORD en .env)
npm run seed-demo -- --reiniciar      # los vuelve a crear (las alertas aprobadas duran 24 hs); --borrar los saca
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
- **`TRUST_PROXY` con Vercel:** desde el 30/10/2026 `TRUST_PROXY` vale 2 en Render y en `render.yaml` por el *rewrite* de `/api` en Vercel; con 1, el rate limiting vería la IP de Vercel para todos los usuarios. El riesgo de `X-Forwarded-For` falsificado llamando directo a Render es un riesgo aceptado (decisión de Nacho, 11/11/2026; detalle en `docs/Tecnologias TucuMaps.md`, sección de seguridad): los límites que protegen cuentas no dependen solo de la IP. Cambiar la configuración del despliegue se consulta con Nacho.
- Lo que no se puede deshacer (borrar datos en Neon, migraciones destructivas en producción, cambiar secretos o configuración del despliegue) siempre se consulta con Nacho antes.
- Commits chicos y descriptivos, en español.
- **Sin marcas de Claude** (decisión de Nacho, 02/11/2026): los commits, PR, comentarios de GitHub, código y documentos no llevan líneas de autoría de Claude (`Co-Authored-By: Claude`, `Claude-Session:`, "Generated with Claude Code" y similares). El uso de Claude Code se declara solo en la carpeta de presentación del TFI.
- **Revisión automática antes de cada PR:** antes de abrir un PR, de pasarlo de borrador a listo o de mergearlo, Claude debe:
  1. Correr las pruebas y el linter de los paquetes que tocó.
  2. Correr la skill `code-review` sobre el diff y corregir lo que encuentre.
  3. Correr la skill `security-review` sobre el diff y corregir lo que encuentre (importa especialmente en auth, sesión, permisos, datos personales y validación).
  4. Mencionar en la descripción del PR qué se revisó y qué hallazgos quedaron sin corregir, con el motivo.
