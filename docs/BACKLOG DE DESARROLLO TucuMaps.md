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
```

---

## 🛠️ Fase 1: Infraestructura y Autenticación (SRS listo, modelo de datos y programación pendientes ⏳)

- [x] **SRS Evolutivo:** Definición de MVP y alcance por Sprints.
- [ ] **Modelo de Datos:** Script SQL y Diagrama ERD (Entidad-Relación), adaptados a PostgreSQL e incluyendo estado de usuario (bloqueado) y estado `resuelto` en reportes.
- [ ] **Setup del Servidor:** Estructura en Express, variables `.env`, conexión `db.js`.
- [ ] **Módulo de Usuarios:** Registro y Login con hashing de contraseñas (`bcrypt`) y emisión de tokens (`JWT`).
- [ ] **Middleware de Seguridad:** Filtro interceptor para verificación de tokens en rutas protegidas.

---

## 🗺️ Fase 2: Core de Datos — Turismo y Eventos

- [ ] **Modelos de Datos:** Programación de `lugaresModel.js` y `eventosModel.js`.
- [ ] **API de Lectura (Público):** Endpoints para consumo del mapa (`GET /api/lugares`, `GET /api/eventos`).
- [ ] **API de Escritura (Privado):** Rutas para creación/edición de lugares (Admin) y envío de propuestas de eventos (Usuario registrado), con revisión administrativa antes de publicar.
- [ ] **Pruebas de Integración:** Validación completa de endpoints mediante Postman / Thunder Client.

---

## 🚨 Fase 3: Módulo de Seguridad y Validaciones Comunitarias

- [ ] **API de Reportes:** Endpoint para registrar incidentes y alertas de peligro geolocalizadas (`POST /api/reportes`).
- [ ] **Moderación de reportes:** Revisión administrativa para aprobar o rechazar reportes antes de mostrarlos en el mapa.
- [ ] **Confirmación comunitaria complementaria:** Registrar confirmaciones de usuarios para alertas publicadas, sin que reemplacen la aprobación administrativa.
- [ ] **Gestión de Estados:** Transición de estados de alerta (`pendiente` $\rightarrow$ `aprobado` / `rechazado`; y si la alerta aprobada ya fue solucionada, `resuelto`).
- [ ] **Gestión y bloqueo de usuarios:** Endpoint de administrador para bloquear/desbloquear usuarios; el login y el middleware rechazan a los bloqueados.
- [ ] **Moderación de eventos:** Aprobar o rechazar las propuestas de eventos enviadas por usuarios antes de publicarlas.

---

## 🎨 Fase 4: Frontend — Interfaz Interactiva en React

- [ ] **Setup Base:** Inicialización de React + React-Leaflet y centrado automático en el mapa de Tucumán.
- [ ] **Conexión con la API:** Renderizado dinámico de lugares, eventos y reportes de seguridad aprobados desde la base de datos PostgreSQL.
- [ ] **UI/UX y Modales:** Panel de información deslizable, formularios intuitivos y switch de *"Modo Seguridad"*.
- [ ] **Autenticación en Frontend:** Vistas de Login/Registro, gestión del estado de sesión y almacenamiento seguro de tokens.

---

## 🚀 Fase 5: Pulido, Documentación y Entrega Final

- [ ] **Modo Nocturno (Dark Mode):** Alternancia de estilos de mapa e interfaz para visualización con poca luz.
- [ ] **Manual de Entrega:** Ampliación del SRS con diagramas finales, capturas de pantalla y manual de usuario.
- [ ] **QA y Testing Final:** Depuración de errores, validación de carga y optimización de rendimiento.
