---
tags:
  - facultad
  - tfi
  - tucumaps
  - stack-tecnologico
  - arquitectura
fecha: 2026-09-28
materia: Trabajo Final Integrador
tipo: arquitectura
---

# 🛠️ Stack Tecnológico — TucuMaps

> [!info] Navegación del Proyecto
> - **Proyecto Central:** [[TucuMaps|TucuMaps - Hub Principal]]
> - **Especificación:** [[SRS preliminar|SRS Preliminar]]
> - **Planificación:** [[BACKLOG DE DESARROLLO TucuMaps|Backlog de Desarrollo]]
> - **Contrato de la API:** [[API TucuMaps|Especificación de la API REST]]
> - **Modelo de datos:** [[Modelo de datos TucuMaps|Modelo de Datos y Diagramas de Estado]]

---

## 🏛️ Arquitectura General del Sistema

El desarrollo de la **"Plataforma Web Integrada de Turismo y Prevención Ciudadana"** se fundamenta en una arquitectura **cliente-servidor** con frontend en React y backend en Node.js/Express, conectado a PostgreSQL. Esta separación permite mantener los componentes de interfaz, lógica de negocio y persistencia de datos de forma modular.

---

## 💻 1. Frontend (Interfaz de Usuario)

| Tecnología | Rol en el Proyecto | Implementación y Justificación |
| :--- | :--- | :--- |
| **Vite + React (JavaScript)** | SPA Library | Vite como herramienta de construcción y servidor de desarrollo. |
| **React** | Componentes | Construcción de interfaz mediante componentes reutilizables. El *Virtual DOM* optimiza la renderización reactiva de marcadores en el mapa. |
| **HTML5 / CSS3 / JS** | Base Web | Estructuración semántica y diseño responsive adaptable a dispositivos móviles y ordenadores de escritorio. |
| **React-Leaflet** | Mapas Interactivos | Envoltura de Leaflet.js para React. Procesa coordenadas geográficas (lat/lng) y renderiza capas de marcadores personalizados (turismo vs. riesgo). Con un plugin de clustering (`react-leaflet-cluster`) se agrupan los marcadores cuando hay muchos. |

---

## ⚙️ 2. Backend (Servidor y Lógica de Negocio)

| Tecnología | Rol en el Proyecto | Implementación y Justificación |
| :--- | :--- | :--- |
| **Node.js** | Runtime Asíncrono | Entorno de ejecución basado en eventos no bloqueantes, ideal para alta concurrencia de consultas geográficas. |
| **Express.js** | Framework REST API | Enrutamiento de peticiones HTTP (`GET`, `POST`, `PUT`, `PATCH`, `DELETE`), middlewares de validación y control de accesos. |
| **zod** | Validación | Esquemas de validación de los datos de entrada. Se eligió sobre `express-validator` porque el mismo esquema define tipos, mensajes y valores por defecto en un solo lugar, es independiente de Express y puede reutilizarse en el frontend para validar formularios con las mismas reglas. |

### Estructura del backend

Arquitectura en capas: **rutas** (definen URL y middlewares) → **controladores** (leen la solicitud y arman la respuesta) → **servicios** (reglas de negocio: estados, límites, permisos) → **modelos** (consultas SQL con `pg`).

```
backend/
  src/
    app.js              # Express, helmet, cors, rate limit, rutas
    server.js           # arranque
    config/env.js       # lectura y validación de variables de entorno
    db/pool.js          # conexión pg
    middlewares/        # auth, requireRol, validar(zod), manejo de errores
    routes/  controllers/  services/  models/
    schemas/            # esquemas zod
    jobs/retencion.js   # tarea diaria RF-24
  migrations/           # node-pg-migrate
  seeds/                # 20 lugares históricos
  tests/                # Jest + Supertest
```

### Variables de entorno

| Variable | Uso |
| :--- | :--- |
| `DATABASE_URL` | Conexión a PostgreSQL (Neon). En local se usa la rama `desarrollo` de Neon; en Render, la rama `production`. |
| `TEST_DATABASE_URL` | Base solo para las pruebas (rama `tests` de Neon en local, PostgreSQL del CI en GitHub Actions). Se vacía en cada corrida. |
| `TRUST_PROXY` | Cantidad de proxies delante del backend (0 en local); necesario para que el rate limiting vea la IP real detrás de Vercel y Render. |
| `JWT_SECRET` | Firma de los tokens de sesión. |
| `FRONTEND_URL` | Origen permitido por CORS y base de los enlaces de los correos. |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `MAIL_FROM` | Envío de correos (Nodemailer). |
| `LIMITE_REPORTES_DIA`, `LIMITE_EVENTOS_DIA` | Límites de RF-09 (por defecto 5 y 3). |
| `TERMINOS_VERSION` | Versión vigente de los términos (RF-04). |
| `N8N_WEBHOOK_URL`, `N8N_SECRET` | Pre-validación con IA (evolutivo). |
| `NODE_ENV`, `PORT` | Entorno de ejecución. |

### Estructura del frontend

```
frontend/src/
  api/          # cliente HTTP (fetch con credentials y manejo de errores RF-06)
  context/      # AuthContext: usuario actual (GET /api/auth/me)
  pages/        # Mapa, Agenda, Login, Registro, MisEnvios, Perfil, Legales, admin/*
  components/   # Mapa, Marcadores, Panel de detalle, Formularios, AvisoLegal
```

Pantallas: mapa con selector Turismo/Eventos ↔ Seguridad, detalle de lugar, agenda de eventos, formulario de reporte, formulario de evento, login, registro, verificar email, recuperar contraseña, mis envíos, perfil (cambio de contraseña y baja de cuenta), términos y privacidad, y panel `/admin` (pendientes, publicados, historial, lugares, eventos, usuarios).

---

## 🗄️ 3. Persistencia de Datos

* **PostgreSQL (RDBMS):** Base de datos relacional para asegurar la integridad referencial y transaccional mediante claves foráneas entre las tablas `usuarios`, `tokens_usuario`, `lugares`, `eventos`, `reportes` y `confirmaciones` (ver [[Modelo de datos TucuMaps|Modelo de Datos]] y `schema.sql`). Los reportes y eventos propuestos contemplan estados de revisión administrativa (`pendiente`, `aprobado`, `rechazado`, `cancelado`, `retirado` y, para alertas solucionadas, `resuelto`), junto con campos de auditoría (`revisado_por`, `revisado_en`, `motivo_rechazo`) y, para la pre-validación con IA, `ia_veredicto`, `ia_confianza`, `ia_motivo`, `ia_analizado_en`. Los usuarios incluyen `email_verificado` y los reportes la fecha de aprobación (`aprobado_en`) para calcular la vigencia de 24 hs; los eventos incluyen fecha y hora de inicio y, opcionalmente, de finalización, para calcular su archivo. Los usuarios contemplan un estado de bloqueo. Opcionalmente se puede habilitar la extensión **PostGIS** para consultas geográficas (ej. reportes cercanos).
* **Driver `pg` (node-postgres):** Conector para Node.js con soporte nativo de promesas (`async/await`) y consultas parametrizadas contra inyecciones SQL.
* **`node-pg-migrate`:** Migraciones versionadas del esquema, escritas para PostgreSQL. Cada cambio en la base queda registrado y se aplica igual en desarrollo, en CI y en Neon.

---

## 🔒 4. Seguridad y Autenticación

* **JSON Web Tokens (JWT):** Tokens firmados guardados en una cookie `httpOnly` (el JavaScript de la página no puede leerlos). Duran 90 días y se renuevan con cada uso, así el usuario no tiene que volver a iniciar sesión. En cada solicitud se verifica en la base que el usuario no esté bloqueado y que `token_version` coincida, lo que permite cortar sesiones al instante (bloqueo, cambio de contraseña).
* **Bcrypt:** Algoritmo de hashing criptográfico unidireccional con sal (*salt*) para resguardo seguro de contraseñas de usuarios.
* **HTTPS y Helmet:** El despliegue usa HTTPS y el backend agrega cabeceras de seguridad con `helmet`. Las URL de imágenes se validan para aceptar solo `http`/`https`.
* **CORS & Rate Limiting:** Políticas para restringir orígenes permitidos en la API y limitar ráfagas excesivas de solicitudes (`express-rate-limit`), incluido el límite de 5 intentos de login fallidos cada 15 minutos.
* **Mismo dominio:** Vercel reenvía `/api/*` al backend en Render (*rewrites*), así la cookie de sesión es del mismo sitio y Safari no la bloquea.

---

## 📦 5. Utilidades y Servicios Complementarios

* **Imágenes (MVP: solo URL):** Lugares y eventos guardan la URL de una imagen ya publicada (`imagen_url`, `flyer_url`), validada para aceptar solo `http`/`https`. No se suben archivos al servidor y los reportes no llevan fotos.
* **Multer y Cloudinary (evolutivo, RF-23):** Para una versión posterior, Multer procesaría las cargas `multipart/form-data` y Cloudinary almacenaría y entregaría las imágenes (fotos, flyers y evidencia de reportes).
* **n8n (evolutivo):** Plataforma de automatización de flujos. Recibe un webhook del backend cuando se envía un reporte o evento, consulta a un modelo de IA para sugerir si es broma o spam, devuelve el veredicto a la API (`ia_veredicto`, `ia_confianza`, `ia_motivo`) y registra el resultado en Google Sheets. La IA solo sugiere; la decisión final es del administrador.
* **Google Sheets (bitácora):** Registro de auditoría de los análisis de la IA. No es la base de datos principal: la fuente de verdad es PostgreSQL.
* **Nodemailer:** (con un SMTP gratuito, por ejemplo Gmail con contraseña de aplicación o el plan gratuito de un servicio como Resend) Servicio de envío asíncrono de correos electrónicos transaccionales (confirmación de cuenta, recuperación de clave y notificaciones).

---

## ☁️ 6. Despliegue (costo cero)

| Componente | Servicio propuesto | Nota |
| :--- | :--- | :--- |
| **Frontend (React)** | Vercel | Despliegue automático desde GitHub; *rewrite* de `/api/*` al backend. |
| **Backend (Express)** | Render (plan gratuito) | Entra en reposo por inactividad; la primera consulta tarda más. |
| **Base de datos** | Neon (PostgreSQL) | Plan gratuito con restauración limitada. |
| **n8n (evolutivo)** | Local o autoalojado | Para la demostración alcanza con correrlo localmente. |

> [!warning] Verificar condiciones
> Los límites de los planes gratuitos cambian; deben revisarse al momento de desplegar.

* **Copias de seguridad:** snapshots programados de Neon sobre la rama `production` (si el plan gratuito lo permite) y un `pg_dump` periódico desde la compu de Nacho (`npm run backup`, programado con el Programador de tareas de Windows), conservado 30 días. No dependen de GitHub Actions.
* **Retención (RF-24):** `jobs/retencion.js` corre dentro del backend al iniciar el servidor y después cada 24 horas. Aunque Render duerma el servidor, la tarea corre en cada arranque, y alcanza porque el plazo es de un año.
* **Secretos:** variables de entorno, nunca en el repositorio.

---

## 🧪 7. Pruebas e integración continua

* **Backend:** Jest + Supertest (autenticación, roles, moderación, límites, validaciones).
* **Frontend:** Vitest + React Testing Library para componentes críticos.
* **CI:** GitHub Actions ejecuta las pruebas en cada push a `main` y en cada PR (`.github/workflows/ci.yml`). Desde el 12/10/2026 Actions está bloqueado por la facturación de la cuenta de GitHub; mientras tanto, las pruebas se corren en local (`npm test`) antes de mergear. Nada del despliegue depende de Actions: Render y Vercel toman el código directo del repositorio.
