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

# 📅 Cronograma — TucuMaps (Sprint 0 y Sprint 1)

> [!info] Documentación Relacionada
> - **Backlog:** [[BACKLOG DE DESARROLLO TucuMaps|Backlog de Desarrollo]]
> - **Requerimientos:** [[SRS TucuMaps|SRS]]
> - **Scrum:** [[Scrum TucuMaps|Sprints, tablero, eventos y roles]]

**Presentación final del TFI:** todavía sin fecha; antes hay entrevistas con la cátedra. La exportación a Excel y la [[Carpeta de presentacion TucuMaps|carpeta de presentación]] (#102) se terminan para esa presentación.
**Sprints:** Sprint 0 de análisis (23/09 – 11/10) y Sprint 1 de desarrollo (lunes 12/10 – domingo 15/11, 5 semanas), más el lunes 16/11 de reserva.

## Equipo y roles

| Persona | Rol Scrum | Responsabilidades |
| :--- | :--- | :--- |
| **Nacho** | Product Owner + Scrum Master + desarrollo backend | Backend, base de datos, despliegue y pruebas automáticas. |
| **Lourdes** (prima de Nacho) | Desarrollo frontend + diseño y contenido | Frontend en React (pantallas, mapa, formularios y panel de administración); diseño de pantallas (Figma), paleta, íconos de marcadores y logo; textos, fotos y fuentes de los 20 lugares; pruebas manuales en celular; capturas para el manual. |

Scrum Master: lo cumple Nacho (ver [[Scrum TucuMaps]]). Nacho programa el backend y Lourdes el frontend; el diseño y el contenido también los lleva Lourdes para no frenar la programación del backend.

## Dos sprints: Sprint 0 y Sprint 1

- **Sprint 0 (23/09 – 11/10), análisis:** SRS, contrato de la API, modelo de datos y diagramas, antes de programar.
- **Sprint 1 (12/10 – 15/11), desarrollo:** un único sprint para todo el MVP, con un Sprint Planning al empezar (12/10) y una Sprint Review y una Sprint Retrospective al terminar (15/11). Detalle en [[Scrum TucuMaps]].
- **Durante el Sprint 1:** un mensaje diario de 3 líneas (qué hice, qué hago, qué me traba) y el tablero de issues al día. Para detectar atrasos a tiempo, el Sprint Backlog se ordenó en **cinco semanas con un hito verificable por semana** (H1 a H5).

## Plan del Sprint 1, por semana

| Semana | Fechas | Desarrollo (backend: Nacho; frontend: Lourdes) | Diseño y contenido (Lourdes) | Hito |
| :-: | :--- | :--- | :--- | :--- |
| **1** | 12/10 – 18/10 | Cierre de la documentación. Repositorio (`main`), Express, migraciones, conexión a Neon. Registro, login, sesión en cookie, verificación de email y recuperación de contraseña (RF-01, RF-03, RF-04). **Primer despliegue** en Render + Vercel. CI con GitHub Actions. **Resultado:** backend de la Fase 1 y la Fase 2 terminado antes de lo previsto; Render + Neon desplegados. El despliegue en Vercel y las pantallas de login y registro pasan a las semanas 2 y 3. El CI con GitHub Actions se reemplaza por correr lint y pruebas en local antes de cada merge (cuenta bloqueada por facturación). | Wireframes de todas las pantallas, paleta, tipografía e íconos de marcadores. Lista final de los 20 lugares. | H1: registro y login funcionando en la URL pública. |
| **2** | 19/10 – 25/10 | API pública de lugares, eventos y alertas; catálogos; seed. Frontend: mapa, marcadores, agrupación, selector Turismo/Seguridad, detalle de lugar, agenda, estados de carga (RF-02, RF-05, RF-06, RF-12); primer despliegue en Vercel con *rewrite* de `/api` (junto con #25). | Diseño final en Figma. Textos, fuentes y fotos de los 20 lugares. | H2: mapa público con los 20 lugares navegable en el celular. |
| **3** | 26/10 – 01/11 | Envío, edición y cancelación de reportes y eventos; límites diarios; validación; "Mis aportes"; confirmaciones; vigencia de 24 hs (RF-07, RF-09, RF-10, RF-11, RF-14). Aviso legal y pantallas de términos y privacidad. Frontend: pantallas de login, registro, verificación de email, recuperación de contraseña y perfil (RF-01, RF-03); formularios de reporte y evento, "Mis aportes" y confirmar alertas. | Pruebas manuales de los formularios en distintos celulares. Revisión de textos de la interfaz. | H3: un ciudadano puede reportar y proponer eventos. |
| **4** | 02/11 – 08/11 | Backend de moderación y administración; frontend del panel `/admin`: cola de pendientes, aprobar, rechazar, resolver, retirar, ABM de lugares y eventos, usuarios y bloqueo (RF-08, RF-13, RF-16, RF-15). Baja de cuenta y retención (RF-24). | Pruebas del panel. Datos de demostración (reportes y eventos de ejemplo). | H4: ciclo completo de moderación funcionando. |
| **5** | 09/11 – 15/11 | Completar pruebas automáticas (70 % backend), corrección de errores, revisión de seguridad (`helmet` ya está desde la semana 1), copias de seguridad, rendimiento. **Sin funcionalidades nuevas.** [[Carpeta de presentacion TucuMaps\|Carpeta de presentación]] del TFI según la guía de la UTN FRT, con referencias en APA 7 (Nacho; las secciones que no dependen del cierre se pueden adelantar). | Manual de usuario con capturas, presentación y guion de la demostración. Capturas y diagramas para la carpeta. | H5: versión del MVP congelada el domingo 15/11, con Sprint Review y Sprint Retrospective. La carpeta y el manual con capturas se terminan para la presentación final, que todavía no tiene fecha. |
| — | 16/11 | Reserva para imprevistos. Ensayo de la demo (despertar el backend antes). | Ensayo de la presentación. | — |

> [!note] Después del Sprint 1
> La exportación a Excel (RF-26) no estaba en el Sprint Backlog. La clase orientativa del TFI la marcó como requisito excluyente y el 26/11 Nacho decidió sumarla para la presentación final, que todavía no tiene fecha: el backend se hizo el 26/11 y el botón del panel queda para Lourdes.

## Fuera del alcance de la entrega

Quedan como **mejoras evolutivas** documentadas, sin implementar antes de la entrega: modo nocturno (RF-17), gastronomía (RF-18), contenido histórico ampliado (RF-19), pre-validación con IA (RF-20), notificaciones (RF-21), estadísticas (RF-22) y subida de imágenes (RF-23). Si sobra tiempo en la última semana del Sprint 1, se puede sumar el modo nocturno, que es el más chico.

## Riesgos

| Riesgo | Mitigación |
| :--- | :--- |
| Una sola persona por área (backend y frontend): cualquier imprevisto frena esa parte. | Alcance limitado al MVP; día de reserva; las tareas que no son código las hace Lourdes. |
| Envío de emails falla en producción (SMTP gratuito). | Probarlo en la primera semana con el despliegue real. |
| Cambios en los planes gratuitos de Render, Vercel o Neon. | Desplegar desde la primera semana, no al final. |
| Atrasos acumulados. | Control semanal de los hitos: si una semana no llegó a su hito, se recorta alcance de lo que sigue; no se corre la fecha de fin del sprint. |
| Contenido de los 20 lugares sin terminar. | Lista cerrada en la semana 1 y textos listos al final de la semana 2. |
