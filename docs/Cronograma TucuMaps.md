---
tags:
  - facultad
  - tfi
  - tucumaps
  - scrum
  - cronograma
fecha: 2026-10-12
materia: Trabajo Final Integrador
tipo: plan-desarrollo
---

# 📅 Cronograma de Sprints — TucuMaps

> [!info] Documentación Relacionada
> - **Backlog:** [[BACKLOG DE DESARROLLO TucuMaps|Backlog de Desarrollo]]
> - **Requerimientos:** [[SRS preliminar|SRS Preliminar]]

**Entrega final:** martes 17 de noviembre de 2026.
**Tiempo disponible:** 5 semanas (del lunes 12/10 al domingo 15/11), más el lunes 16/11 de reserva.

## Equipo y roles

| Persona | Rol Scrum | Responsabilidades |
| :--- | :--- | :--- |
| **Nacho** | Desarrollo + Product Owner | Backend, base de datos, despliegue y pruebas automáticas. |
| **Lourdes** (prima de Nacho) | Desarrollo frontend + diseño y contenido | Frontend en React (pantallas, mapa, formularios y panel de administración); diseño de pantallas (Figma), paleta, íconos de marcadores y logo; textos, fotos y fuentes de los 20 lugares; pruebas manuales en celular; capturas para el manual. |

Scrum Master: rol compartido (se rota o lo cumple Nacho). Nacho programa el backend y Lourdes el frontend; el diseño y el contenido también los lleva Lourdes para no frenar la programación del backend.

## Duración de los sprints: 1 semana

Con 5 semanas, sprints de **1 semana** dan 5 entregas y permiten detectar atrasos a tiempo; con sprints de 2 semanas habría solo 2 revisiones antes de la entrega.

- **Lunes:** planificación (30 min): se eligen las historias de la semana.
- **Durante la semana:** un mensaje diario de 3 líneas (qué hice, qué hago, qué me traba).
- **Domingo:** revisión (se prueba lo hecho en el celular) y retrospectiva (15 min).

## Plan

| Sprint | Fechas | Desarrollo (backend: Nacho; frontend: Lourdes) | Diseño y contenido (Lourdes) | Entregable |
| :-: | :--- | :--- | :--- | :--- |
| **1** | 12/10 – 18/10 | Cierre de la documentación. Repositorio (`main`), Express, migraciones, conexión a Neon. Registro, login, sesión en cookie, verificación de email y recuperación de contraseña (RF-01, RF-03, RF-04). **Primer despliegue** en Render + Vercel. CI con GitHub Actions. | Wireframes de todas las pantallas, paleta, tipografía e íconos de marcadores. Lista final de los 20 lugares. | Registro y login funcionando en la URL pública. |
| **2** | 19/10 – 25/10 | API pública de lugares, eventos y alertas; catálogos; seed. Frontend: mapa, marcadores, agrupación, selector Turismo/Seguridad, detalle de lugar, agenda, estados de carga (RF-02, RF-05, RF-06, RF-12). | Diseño final en Figma. Textos, fuentes y fotos de los 20 lugares. | Mapa público con los 20 lugares navegable en el celular. |
| **3** | 26/10 – 01/11 | Envío, edición y cancelación de reportes y eventos; límites diarios; validación; "Mis envíos"; confirmaciones; vigencia de 24 hs (RF-07, RF-09, RF-10, RF-11, RF-14). Aviso legal y pantallas de términos y privacidad. | Pruebas manuales de los formularios en distintos celulares. Revisión de textos de la interfaz. | Un ciudadano puede reportar y proponer eventos. |
| **4** | 02/11 – 08/11 | Panel `/admin`: cola de pendientes, aprobar, rechazar, resolver, retirar, ABM de lugares y eventos, usuarios y bloqueo (RF-08, RF-13, RF-16, RF-15). Baja de cuenta y retención (RF-24). | Pruebas del panel. Datos de demostración (reportes y eventos de ejemplo). | Ciclo completo de moderación funcionando. |
| **5** | 09/11 – 15/11 | Completar pruebas automáticas (70 % backend), corrección de errores, `helmet` y revisión de seguridad, copias de seguridad, rendimiento. **Sin funcionalidades nuevas.** | Manual de usuario con capturas, presentación y guion de la demostración. | Versión final congelada el domingo 15/11. |
| — | 16/11 | Reserva para imprevistos. Ensayo de la demo (despertar el backend antes). | Ensayo de la presentación. | — |

## Fuera del alcance de la entrega

Quedan como **mejoras evolutivas** documentadas, sin implementar antes del 17/11: modo nocturno (RF-17), gastronomía (RF-18), contenido histórico ampliado (RF-19), pre-validación con IA (RF-20), notificaciones (RF-21) y estadísticas (RF-22). Si sobra tiempo en el Sprint 5, se puede sumar el modo nocturno, que es el más chico.

## Riesgos

| Riesgo | Mitigación |
| :--- | :--- |
| Una sola persona por área (backend y frontend): cualquier imprevisto frena esa parte. | Alcance limitado al MVP; día de reserva; las tareas que no son código las hace Lourdes. |
| Envío de emails falla en producción (SMTP gratuito). | Probarlo en el Sprint 1 con el despliegue real. |
| Cambios en los planes gratuitos de Render, Vercel o Neon. | Desplegar desde el Sprint 1, no al final. |
| Atrasos acumulados. | Revisión cada domingo: si un sprint no cerró, se recorta alcance del siguiente, no se corre la entrega. |
| Contenido de los 20 lugares sin terminar. | Lista cerrada en el Sprint 1 y textos listos al final del Sprint 2. |
