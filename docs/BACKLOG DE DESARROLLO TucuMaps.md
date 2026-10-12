---
tags:
  - facultad
  - tfi
  - tucumaps
  - backlog
  - scrum
  - plan
fecha: 2026-09-28
materia: Trabajo Final Integrador
tipo: plan-desarrollo
---

# 📋 Backlog de Desarrollo — TucuMaps

> [!info] Documentación Relacionada
> - **Proyecto General:** [[TucuMaps|TucuMaps - Hub Principal]]
> - **Requerimientos Formales:** [[SRS preliminar|SRS Preliminar (Historias de Usuario)]]
> - **Arquitectura:** [[Tecnologias TucuMaps|Stack Tecnológico]]
> - **Cronograma:** [[Cronograma TucuMaps|Cronograma de Sprints (entrega 17/11)]]
> - **API:** [[API TucuMaps|Especificación de la API REST]]

---

## 📊 Estado General del Proyecto

```
[ Fase 1: Backend Auth ]  ===>  EN CURSO (documentación lista, programación pendiente)
[ Fase 2: Core Datos   ]  ===>  PENDIENTE
[ Fase 3: Seguridad    ]  ===>  PENDIENTE
[ Fase 4: Frontend UI  ]  ===>  PENDIENTE
[ Fase 5: Cierre & QA  ]  ===>  PENDIENTE
[ Fase 6: IA (evolutiva)]  ===>  PENDIENTE
[ Fase 7: Evolutivas    ]  ===>  PENDIENTE
```

---

> [!note] Fases y sprints
> Las fases agrupan el trabajo por tema; el [[Cronograma TucuMaps|Cronograma]] reparte ese trabajo en 5 sprints semanales: Fase 1 → Sprint 1, Fase 2 y Fase 4 (mapa) → Sprint 2, Fase 3 → Sprints 3 y 4, Fase 4 (panel) → Sprint 4, Fase 5 → Sprint 5. Las Fases 6 y 7 quedan fuera de la entrega.

## 🛠️ Fase 1: Infraestructura y Autenticación (documentación lista, programación pendiente ⏳)

- [x] **SRS Evolutivo:** Definición de MVP y alcance por Sprints.
- [x] **Especificación de la API:** Endpoints, accesos, validaciones y errores ([[API TucuMaps|API]]).
- [x] **Diagramas de estado:** Reportes, eventos y usuarios ([[Modelo de datos TucuMaps|Modelo de Datos]]).
- [x] **Términos y política de privacidad:** Borradores redactados; falta completar datos y revisión profesional.
- [x] **Modelo de Datos:** Script SQL (`schema.sql`) y Diagrama ERD (`img/ERD_TucuMaps.png`) en PostgreSQL, con estado de usuario (bloqueado), estado `resuelto` en reportes, campos de moderación e IA, y vistas públicas `reportes_activos` y `eventos_vigentes`.
- [x] **Repositorio:** Rama `main` estable; trabajo en ramas por funcionalidad con Pull Request.
- [x] **Setup del Servidor:** Estructura en capas en Express, variables `.env` validadas, conexión `pg`, migraciones con `node-pg-migrate`.
- [x] **Módulo de Usuarios:** Registro y Login con hashing de contraseñas (`bcrypt`), política de contraseñas y sesión JWT en cookie `httpOnly` de 90 días renovable (RF-01).
- [x] **Límite de intentos de login:** 5 fallidos cada 15 minutos (RF-01).
- [ ] **Primer despliegue:** Render + Vercel (con rewrite de `/api`) + Neon desde el Sprint 1.
- [x] **Verificación de email y recuperación de contraseña:** Correos con tokens de un solo uso y vencimiento (RF-03).
- [x] **Términos y privacidad:** Aceptación obligatoria al registrarse (RF-04).
- [x] **Primer administrador:** Creado manualmente en la base de datos; el registro público solo crea usuarios Ciudadano.
- [x] **Middleware de Seguridad:** Verificación del token, de `token_version` y del bloqueo en cada solicitud; verificación de rol; encabezado anti-CSRF.

---

## 🗺️ Fase 2: Core de Datos — Turismo y Eventos

- [ ] **Modelos de Datos:** Programación de `lugaresModel.js` y `eventosModel.js`.
- [ ] **API de Lectura (Público):** Endpoints para consumo del mapa (`GET /api/lugares`, `GET /api/eventos`).
- [ ] **API de Escritura (Privado):** Rutas para creación/edición de lugares (Admin) y envío de propuestas de eventos (Usuario registrado), con revisión administrativa antes de publicar.
- [ ] **Catálogos:** `GET /api/catalogos` con tipos de reporte, categorías y modalidades.
- [ ] **Carga inicial (seed):** Script con los 20 lugares de [[Seed lugares TucuMaps|Seed de Lugares]] y su contenido histórico; eventos de demostración (hasta 10) opcionales.
- [ ] **Pruebas de Integración:** Validación completa de endpoints mediante Postman / Thunder Client.

---

## 🚨 Fase 3: Módulo de Seguridad y Confirmaciones Comunitarias

- [ ] **API de Reportes:** Endpoint para registrar incidentes y alertas de peligro geolocalizadas (`POST /api/reportes`).
- [ ] **Edición y cancelación de pendientes:** El autor edita o cancela mientras está `pendiente`; "Mis envíos" (RF-07).
- [ ] **Moderación de reportes:** Revisión administrativa para aprobar o rechazar reportes antes de mostrarlos en el mapa.
- [ ] **Confirmación comunitaria complementaria:** Registrar confirmaciones de usuarios para alertas publicadas, sin que reemplacen la aprobación administrativa. Una sola confirmación por usuario y alerta, y no sobre los propios reportes (RF-14).
- [ ] **Gestión de Estados:** Transiciones según los diagramas de estado: `pendiente` → `aprobado` / `rechazado` / `cancelado`; `aprobado` → `resuelto` / `retirado`. Estados finales no reabribles (RF-08, RF-13).
- [ ] **Límites de envío:** Máximo de reportes y propuestas por usuario cada 24 hs (RF-09).
- [ ] **Validación de datos y ubicación:** Validación en servidor y coordenadas dentro de Tucumán (RF-10).
- [ ] **Vigencia de alertas:** Las alertas aprobadas se muestran 24 hs desde su aprobación (RF-11).
- [ ] **Archivo de eventos:** Los eventos dejan de mostrarse 24 hs después de que suceden y quedan en el historial del panel (RF-12).
- [ ] **Auditoría de moderación:** Registrar `revisado_por`, `revisado_en` y `motivo_rechazo` en cada decisión.
- [ ] **Gestión y bloqueo de usuarios:** Endpoint de administrador para bloquear/desbloquear usuarios; el login y el middleware rechazan a los bloqueados y sus pendientes se rechazan automáticamente (RF-16).
- [ ] **Moderación de eventos:** Aprobar o rechazar las propuestas de eventos; el admin también crea y edita eventos directamente (RF-13).
- [ ] **Baja de cuenta y retención:** Endpoint de baja y tarea de retención de 1 año dentro del backend (`jobs/retencion.js`, al iniciar el servidor y cada 24 horas; RF-24).

---

## 🎨 Fase 4: Frontend — Interfaz Interactiva en React

- [ ] **Setup Base:** Inicialización de React + React-Leaflet y centrado automático en el mapa de Tucumán.
- [ ] **Conexión con la API:** Renderizado dinámico de lugares, eventos y reportes de seguridad aprobados desde la base de datos PostgreSQL.
- [ ] **UI/UX y Modales:** Panel de información deslizable, formularios intuitivos y switch de *"Modo Seguridad"*.
- [ ] **Panel de administración (`/admin`):** Cola de pendientes con aprobar/rechazar (con motivo) y marcar `resuelto`, alta/edición de lugares, lista de usuarios con bloqueo/desbloqueo. Acceso restringido por rol.
- [ ] **Agrupación de marcadores:** Clustering en React-Leaflet para mantener el mapa legible (RF-05).
- [ ] **Estados de carga y errores:** Indicadores de carga, mensajes ante demoras del servidor y reintento (RF-06).
- [ ] **Aviso legal y privacidad:** Aviso fijo de que TucuMaps no está afiliado a organismos oficiales ni reemplaza al 911, y pantallas de [[Terminos de uso TucuMaps|términos]] y [[Politica de privacidad TucuMaps|política de privacidad]] (RF-04).
- [ ] **Autenticación en Frontend:** Vistas de Login/Registro, verificación de email, recuperación de contraseña, perfil (cambio de contraseña y baja) y estado de sesión con `GET /api/auth/me`.

---

## 🚀 Fase 5: Pulido, Documentación y Entrega Final

- [ ] **Modo Nocturno (Dark Mode, opcional):** Alternancia de estilos de mapa e interfaz; solo si sobra tiempo.
- [x] **Borrador del manual de usuario:** [[Manual de usuario TucuMaps|Manual de Usuario]] con los textos para visitantes, usuarios y administradores.
- [ ] **Manual de Entrega:** Ampliación del SRS con diagramas finales, revisión del manual contra la versión final y capturas de pantalla.
- [ ] **Endurecimiento de seguridad:** HTTPS, `helmet` y validación de protocolos `http`/`https` en URL de imágenes.
- [ ] **Pruebas automatizadas:** Backend (Jest + Supertest) y frontend básico, ejecutadas en GitHub Actions (bloqueado por facturación desde el 12/10; mientras tanto, en local antes de cada merge). Se escriben desde la Fase 1 y aquí se completa la cobertura (objetivo 70 % en el backend, un caso por criterio de aceptación).
- [ ] **Despliegue gratuito:** Vercel (frontend, con rewrite de `/api` al backend), Render (backend), Neon (PostgreSQL), con variables de entorno.
- [ ] **Copias de seguridad:** snapshots programados de Neon en `production` y `pg_dump` periódico desde la compu de Nacho (`npm run backup` con el Programador de tareas de Windows), conservado 30 días. Sin GitHub Actions.
- [ ] **QA y Testing Final:** Depuración de errores, validación de carga y optimización de rendimiento.

---

## 🤖 Fase 6: Pre-validación con IA (Mejora evolutiva)

- [ ] **Campos en base de datos:** `ia_veredicto`, `ia_confianza`, `ia_motivo`, `ia_analizado_en` en reportes y eventos.
- [ ] **Endpoints seguros:** Disparo del análisis hacia n8n y endpoint de retorno del resultado, ambos protegidos con secreto compartido.
- [ ] **Workflow en n8n:** Webhook → consulta a la IA → guardado del veredicto → fila en Google Sheets.
- [ ] **Tolerancia a fallos:** Si n8n o la IA fallan, el elemento queda `pendiente` con etiqueta "sin analizar".
- [ ] **Panel de administración:** Mostrar la etiqueta de la IA y permitir filtrar por ella. La IA solo sugiere; no aprueba ni rechaza.

---

## 🌱 Fase 7: Mejoras evolutivas adicionales

- [ ] **Notificaciones al usuario:** Aviso cuando su reporte o propuesta es aprobado o rechazado (RF-21).
- [ ] **Estadísticas y filtros avanzados del panel:** Métricas, historial detallado de decisiones y filtros avanzados (RF-22).
- [ ] **Subida de imágenes:** Multer + Cloudinary para subir fotos y flyers en lugar de pegar una URL (RF-23).
