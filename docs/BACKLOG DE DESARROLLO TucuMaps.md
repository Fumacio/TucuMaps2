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
> - **Metodología:** [[Gestión Parcial|Gestión de Proyectos (Ciclo de Vida y Entregables)]]

---

## 📊 Estado General del Proyecto

```
[ Fase 1: Backend Auth ]  ===>  EN CURSO (SRS listo, modelo de datos y programación pendientes)
[ Fase 2: Core Datos   ]  ===>  PENDIENTE
[ Fase 3: Seguridad    ]  ===>  PENDIENTE
[ Fase 4: Frontend UI  ]  ===>  PENDIENTE
[ Fase 5: Cierre & QA  ]  ===>  PENDIENTE
[ Fase 6: IA (evolutiva)]  ===>  PENDIENTE
[ Fase 7: Evolutivas    ]  ===>  PENDIENTE
```

---

## 🛠️ Fase 1: Infraestructura y Autenticación (SRS listo, modelo de datos y programación pendientes ⏳)

- [x] **SRS Evolutivo:** Definición de MVP y alcance por Sprints.
- [x] **Modelo de Datos:** Script SQL (`schema.sql`) y Diagrama ERD (`ERD_TucuMaps.html`, `img/ERD_TucuMaps_*.png`) en PostgreSQL, con estado de usuario (bloqueado), estado `resuelto` en reportes, campos de moderación e IA, y vistas públicas `reportes_activos` y `eventos_vigentes`.
- [ ] **Setup del Servidor:** Estructura en Express, variables `.env`, conexión `db.js`.
- [ ] **Módulo de Usuarios:** Registro y Login con hashing de contraseñas (`bcrypt`) y emisión de tokens (`JWT`).
- [ ] **Verificación de email y recuperación de contraseña:** Correos con tokens de un solo uso y vencimiento (RF-12).
- [ ] **Términos y privacidad:** Aceptación obligatoria al registrarse (RF-13).
- [ ] **Primer administrador:** Creado manualmente en la base de datos; el registro público solo crea usuarios Ciudadano.
- [ ] **Middleware de Seguridad:** Filtro interceptor para verificación de tokens en rutas protegidas.

---

## 🗺️ Fase 2: Core de Datos — Turismo y Eventos

- [ ] **Modelos de Datos:** Programación de `lugaresModel.js` y `eventosModel.js`.
- [ ] **API de Lectura (Público):** Endpoints para consumo del mapa (`GET /api/lugares`, `GET /api/eventos`).
- [ ] **API de Escritura (Privado):** Rutas para creación/edición de lugares (Admin) y envío de propuestas de eventos (Usuario registrado), con revisión administrativa antes de publicar.
- [ ] **Carga inicial (seed):** Script con al menos 20 lugares históricos y su contenido histórico; eventos de demostración (hasta 10) opcionales.
- [ ] **Pruebas de Integración:** Validación completa de endpoints mediante Postman / Thunder Client.

---

## 🚨 Fase 3: Módulo de Seguridad y Validaciones Comunitarias

- [ ] **API de Reportes:** Endpoint para registrar incidentes y alertas de peligro geolocalizadas (`POST /api/reportes`).
- [ ] **Moderación de reportes:** Revisión administrativa para aprobar o rechazar reportes antes de mostrarlos en el mapa.
- [ ] **Confirmación comunitaria complementaria:** Registrar confirmaciones de usuarios para alertas publicadas, sin que reemplacen la aprobación administrativa. Una sola confirmación por usuario y alerta, y no sobre los propios reportes (RF-19).
- [ ] **Gestión de Estados:** Transición de estados de alerta (`pendiente` $\rightarrow$ `aprobado` / `rechazado`; y si la alerta aprobada ya fue solucionada, `resuelto`).
- [ ] **Límites de envío:** Máximo de reportes y propuestas por usuario cada 24 hs (RF-14).
- [ ] **Validación de datos y ubicación:** Validación en servidor y coordenadas dentro de Tucumán (RF-15).
- [ ] **Vigencia de alertas:** Las alertas aprobadas se muestran 24 hs desde su aprobación (RF-16).
- [ ] **Archivo de eventos:** Los eventos dejan de mostrarse 24 hs después de que suceden y quedan en el historial del panel (RF-22).
- [ ] **Auditoría de moderación:** Registrar `revisado_por`, `revisado_en` y `motivo_rechazo` en cada decisión.
- [ ] **Gestión y bloqueo de usuarios:** Endpoint de administrador para bloquear/desbloquear usuarios; el login y el middleware rechazan a los bloqueados.
- [ ] **Moderación de eventos:** Aprobar o rechazar las propuestas de eventos enviadas por usuarios antes de publicarlas.

---

## 🎨 Fase 4: Frontend — Interfaz Interactiva en React

- [ ] **Setup Base:** Inicialización de React + React-Leaflet y centrado automático en el mapa de Tucumán.
- [ ] **Conexión con la API:** Renderizado dinámico de lugares, eventos y reportes de seguridad aprobados desde la base de datos PostgreSQL.
- [ ] **UI/UX y Modales:** Panel de información deslizable, formularios intuitivos y switch de *"Modo Seguridad"*.
- [ ] **Panel de administración (`/admin`):** Cola de pendientes con aprobar/rechazar (con motivo) y marcar `resuelto`, alta/edición de lugares, lista de usuarios con bloqueo/desbloqueo. Acceso restringido por rol.
- [ ] **Agrupación de marcadores:** Clustering en React-Leaflet para mantener el mapa legible (RF-20).
- [ ] **Estados de carga y errores:** Indicadores de carga, mensajes ante demoras del servidor y reintento (RF-21).
- [ ] **Aviso legal y privacidad:** Aviso fijo de que TucuMaps no está afiliado a organismos oficiales ni reemplaza al 911, y pantallas de términos y política de privacidad (RF-13).
- [ ] **Autenticación en Frontend:** Vistas de Login/Registro, gestión del estado de sesión y almacenamiento seguro de tokens.

---

## 🚀 Fase 5: Pulido, Documentación y Entrega Final

- [ ] **Modo Nocturno (Dark Mode):** Alternancia de estilos de mapa e interfaz para visualización con poca luz.
- [ ] **Manual de Entrega:** Ampliación del SRS con diagramas finales, capturas de pantalla y manual de usuario.
- [ ] **Endurecimiento de seguridad:** HTTPS, `helmet` y validación de protocolos `http`/`https` en URL de imágenes.
- [ ] **Pruebas automatizadas:** Backend (Jest + Supertest) y frontend básico, ejecutadas en GitHub Actions. Se escriben desde la Fase 1 y aquí se completa la cobertura.
- [ ] **Despliegue gratuito:** Vercel/Netlify (frontend), Render (backend), Neon (PostgreSQL), con variables de entorno.
- [ ] **Copias de seguridad:** `pg_dump` periódico de la base.
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

- [ ] **Notificaciones al usuario:** Aviso cuando su reporte o propuesta es aprobado o rechazado (RF-17).
- [ ] **Estadísticas y filtros avanzados del panel:** Métricas, historial detallado de decisiones y filtros avanzados (RF-18).
