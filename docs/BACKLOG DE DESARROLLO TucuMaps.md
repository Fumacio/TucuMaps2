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
[ Fase 1: Backend Auth ]  ===>  HECHA
[ Fase 2: Core Datos   ]  ===>  BACKEND HECHO (propuestas de eventos pasan a la Fase 3)
[ Fase 3: Seguridad    ]  ===>  BACKEND HECHO (#42 a #49)
[ Fase 4: Frontend UI  ]  ===>  EN CURSO (mapa público y pantallas legales hechos, #25 a #29 y #61; faltan cuenta, formularios, Mis envíos y panel admin, #60 y #62 a #65)
[ Fase 5: Cierre & QA  ]  ===>  PENDIENTE
[ Fase 6: IA (evolutiva)]  ===>  PENDIENTE
[ Fase 7: Evolutivas    ]  ===>  PENDIENTE
```

*Estado actualizado el 30/10/2026.*

---

> [!note] Fases y sprints
> Las fases agrupan el trabajo por tema; el [[Cronograma TucuMaps|Cronograma]] reparte ese trabajo en 5 sprints semanales: Fase 1 → Sprint 1, Fase 2 y Fase 4 (mapa) → Sprint 2, Fase 3 → Sprints 3 y 4, Fase 4 (panel) → Sprint 4, Fase 5 → Sprint 5. Las Fases 6 y 7 quedan fuera de la entrega.

## 🛠️ Fase 1: Infraestructura y Autenticación (hecha ✅)

- [x] **SRS Evolutivo:** Definición de MVP y alcance por Sprints.
- [x] **Especificación de la API:** Endpoints, accesos, validaciones y errores ([[API TucuMaps|API]]).
- [x] **Diagramas de estado:** Reportes, eventos y usuarios ([[Modelo de datos TucuMaps|Modelo de Datos]]).
- [x] **Términos y política de privacidad:** Textos completos (autores, institución, contacto y domicilio); fecha de publicación 30/10/2026, el día que el frontend salió en Vercel (PR #88).
- [x] **Modelo de Datos:** Script SQL (`schema.sql`) y Diagrama ERD (`img/ERD_TucuMaps.png`) en PostgreSQL, con estado de usuario (bloqueado), estado `resuelto` en reportes, campos de moderación e IA, y vistas públicas `reportes_activos` y `eventos_vigentes`.
- [x] **Repositorio:** Rama `main` estable; trabajo en ramas por funcionalidad con Pull Request.
- [x] **Setup del Servidor:** Estructura en capas en Express, variables `.env` validadas, conexión `pg`, migraciones con `node-pg-migrate`.
- [x] **Módulo de Usuarios:** Registro y Login con hashing de contraseñas (`bcrypt`), política de contraseñas y sesión JWT en cookie `httpOnly` de 90 días renovable (RF-01).
- [x] **Límite de intentos de login:** 5 fallidos cada 15 minutos, por IP y por email (RF-01).
- [x] **Primer despliegue:** Render + Neon (backend en `https://tucumaps-api.onrender.com` desde el 12/10) y Vercel con rewrite de `/api` (frontend en `https://tucu-maps2.vercel.app` desde el 30/10, #59).
- [x] **Verificación de email y recuperación de contraseña:** Correos con tokens de un solo uso y vencimiento (RF-03).
- [x] **Términos y privacidad:** Aceptación obligatoria al registrarse (RF-04).
- [x] **Primer administrador:** Se crea a mano con `npm run crear-admin -- email@ejemplo.com`, que convierte en admin a un usuario ya registrado; el registro público solo crea usuarios Ciudadano.
- [x] **Middleware de Seguridad:** Verificación del token, de `token_version` y del bloqueo en cada solicitud; verificación de rol; encabezado anti-CSRF.

---

## 🗺️ Fase 2: Core de Datos — Turismo y Eventos

- [x] **Modelos de Datos:** Modelos de lugares, eventos y reportes.
- [x] **API de Lectura (Público):** `GET /api/lugares`, `GET /api/eventos` y `GET /api/reportes` (alertas activas) para el mapa (#18, #20, #21).
- [x] **API de Escritura (Admin):** Alta, edición y desactivación de lugares (RF-13, #22).
- [x] **Propuestas de eventos (Usuario registrado):** Pasaron a la Fase 3, junto con los reportes, porque comparten límites diarios y validación (RF-09, RF-10); hechas en #43.
- [x] **Catálogos:** `GET /api/catalogos` con tipos de reporte, categorías y modalidades.
- [x] **Carga inicial (seed):** `npm run seed` con los 20 lugares de [[Seed lugares TucuMaps|Seed de Lugares]], de la capital y alrededores (#19). Los eventos de demostración (opcionales) quedan para el Sprint 4.
- [x] **Pruebas de Integración:** Pruebas automáticas con Jest + Supertest en lugar de Postman / Thunder Client.

---

## 🚨 Fase 3: Módulo de Seguridad y Confirmaciones Comunitarias

- [x] **API de Reportes:** Endpoint para registrar incidentes y alertas de peligro geolocalizadas (`POST /api/reportes`, #42).
- [x] **Edición y cancelación de pendientes:** El autor edita o cancela mientras está `pendiente`; "Mis envíos" (RF-07, #44).
- [x] **Edición del perfil:** Cambio de nombre y de email con confirmación por enlace (RF-25, #74).
- [x] **Moderación de reportes:** Revisión administrativa para aprobar o rechazar reportes antes de mostrarlos en el mapa; también resolver y retirar (#46).
- [x] **Confirmación comunitaria complementaria:** Registrar confirmaciones de usuarios para alertas publicadas, sin que reemplacen la aprobación administrativa. Una sola confirmación por usuario y alerta, y no sobre los propios reportes (RF-14, #45).
- [x] **Gestión de Estados:** Transiciones según los diagramas de estado: `pendiente` → `aprobado` / `rechazado` / `cancelado`; `aprobado` → `resuelto` / `retirado`. Estados finales no reabribles (RF-08, RF-13; #46, #47).
- [x] **Límites de envío:** Máximo de reportes y propuestas por usuario cada 24 hs (RF-09; #42, #43).
- [x] **Validación de datos y ubicación:** Validación en servidor y coordenadas dentro de Tucumán (RF-10; #42, #43).
- [x] **Vigencia de alertas:** Las alertas aprobadas se muestran 24 hs desde su aprobación (RF-11) (vista `reportes_activos`, hecha en la Fase 2).
- [x] **Archivo de eventos:** Los eventos dejan de mostrarse 24 hs después de que suceden y quedan en el historial del panel (RF-12) (vista `eventos_vigentes`, hecha en la Fase 2).
- [x] **Auditoría de moderación:** Registrar `revisado_por`, `revisado_en` y `motivo_rechazo` en cada decisión (#46, #47).
- [x] **Gestión y bloqueo de usuarios:** Endpoint de administrador para bloquear/desbloquear usuarios; el login y el middleware rechazan a los bloqueados y sus pendientes se rechazan automáticamente (RF-16, #48). También el resumen del panel (RF-15).
- [x] **Moderación de eventos:** Aprobar o rechazar las propuestas de eventos; el admin también crea y edita eventos directamente (RF-13, #47).
- [x] **Baja de cuenta y retención:** Endpoint de baja y tarea de retención de 1 año dentro del backend (`jobs/retencion.js`, al iniciar el servidor y cada 24 horas; RF-24, #49).

---

## 🎨 Fase 4: Frontend — Interfaz Interactiva en React

- [x] **Setup Base:** Inicialización de React + React-Leaflet y centrado automático en el mapa de Tucumán. Proyecto Vite + React (PR #52) y mapa centrado en Tucumán con los 20 lugares (#25, PRs #55 y #80).
- [x] **Conexión con la API:** Renderizado dinámico de lugares, eventos y reportes de seguridad aprobados desde la base de datos PostgreSQL. Lugares (PR #80), alertas activas (#27, PR #84) y eventos con agenda (#28, PR #85).
- [ ] **UI/UX y Modales:** Panel de información deslizable, formularios intuitivos y switch de *"Modo Seguridad"*. Panel de detalle y botón Seguridad hechos (#27, PR #84); faltan los formularios de reporte y evento (#62).
- [ ] **Panel de administración (`/admin`):** Cola de pendientes con aprobar/rechazar (con motivo) y marcar `resuelto`, alta/edición de lugares, lista de usuarios con bloqueo/desbloqueo. Acceso restringido por rol (#64 y #65).
- [x] **Agrupación de marcadores:** Clustering en React-Leaflet para mantener el mapa legible (RF-05; #26, PR #81).
- [x] **Estados de carga y errores:** Indicadores de carga, mensajes ante demoras del servidor y reintento (RF-06; #29, PR #86).
- [x] **Aviso legal y privacidad:** Aviso fijo de que TucuMaps no está afiliado a organismos oficiales ni reemplaza al 911, y pantallas de [[Terminos de uso TucuMaps|términos]] y [[Politica de privacidad TucuMaps|política de privacidad]] (RF-04; #61, PR #87). La casilla de aceptación ya está hecha; se suma a la pantalla de registro en #60.
- [ ] **Autenticación en Frontend:** Vistas de Login/Registro, verificación de email, recuperación de contraseña, perfil (cambio de contraseña y baja) y estado de sesión con `GET /api/auth/me` (#60).

---

## 🚀 Fase 5: Pulido, Documentación y Entrega Final

- [ ] **Modo Nocturno (Dark Mode, opcional):** Alternancia de estilos de mapa e interfaz; solo si sobra tiempo.
- [x] **Borrador del manual de usuario:** [[Manual de usuario TucuMaps|Manual de Usuario]] con los textos para visitantes, usuarios y administradores.
- [ ] **Carpeta de presentación del TFI:** Las 12 secciones de la guía de la UTN FRT (portada, índice, resumen, introducción, estado del arte, descripción, metodología, recursos, plan de trabajo, resultados, referencias en APA 7 y anexos), con las secciones numeradas como pide la guía y el uso de Claude Code declarado como herramienta. Sprint 5.
- [ ] **Manual de Entrega:** Ampliación del SRS con diagramas finales, revisión del manual contra la versión final y capturas de pantalla.
- [x] **Endurecimiento de seguridad:** HTTPS, `helmet` y validación de protocolos `http`/`https` en URL de imágenes. `helmet` en `app.js`, `urlImagen` en `schemas/comunes.js` y HTTPS de Render; Vercel también sirve por HTTPS. La revisión de seguridad final sigue en el Sprint 5.
- [ ] **Pruebas automatizadas:** Backend (Jest + Supertest) y frontend básico, ejecutadas en GitHub Actions (bloqueado por facturación desde el 12/10; mientras tanto, en local antes de cada merge). Se escriben desde la Fase 1 y aquí se completa la cobertura (objetivo 70 % en el backend, un caso por criterio de aceptación).
- [x] **Despliegue gratuito:** Vercel (frontend, con rewrite de `/api` al backend), Render (backend), Neon (PostgreSQL), con variables de entorno. Los tres en producción desde el 30/10.
- [ ] **Copias de seguridad:** snapshots programados de Neon en `production` y `pg_dump` periódico desde la compu de Nacho (`npm run backup` con el Programador de tareas de Windows), conservado 30 días. Sin GitHub Actions. *Script `npm run backup` listo (24/10); falta programarlo en la compu de Nacho y decidir los snapshots de Neon.*
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
