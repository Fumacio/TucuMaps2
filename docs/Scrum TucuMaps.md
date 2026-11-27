---
tags:
  - facultad
  - tfi
  - tucumaps
  - scrum
  - plan
fecha: 2026-10-15
materia: Trabajo Final Integrador
tipo: plan-desarrollo
---

# 🔁 Scrum en TucuMaps — Sprints, tablero, eventos y roles

> [!info] Documentación Relacionada
> - **Cronograma:** [[Cronograma TucuMaps|Cronograma de Sprints]]
> - **Backlog:** [[BACKLOG DE DESARROLLO TucuMaps|Backlog de Desarrollo]]
> - **Proyecto General:** [[TucuMaps|TucuMaps - Hub Principal]]

El [[Cronograma TucuMaps|Cronograma]] fija los dos sprints del proyecto y sus fechas. Este documento cuenta cómo se llevó el trabajo en el día a día: dónde se ve, qué eventos de Scrum se hicieron y quién hace qué. Es Scrum liviano, pensado para un equipo de dos personas.

## 0. Los dos sprints

| Sprint | Fechas | Objetivo |
| :-: | :--- | :--- |
| **Sprint 0** (análisis) | 23/09 – 11/10 | Cerrar los requerimientos (SRS), el contrato de la API y el modelo de datos antes de programar. |
| **Sprint 1** (desarrollo) | lunes 12/10 – domingo 15/11 (5 semanas), más el lunes 16/11 de reserva | MVP de TucuMaps completo y publicado: un visitante recorre el mapa con los 20 lugares, la agenda y las alertas; un ciudadano registrado reporta y propone eventos; el administrador modera. Versión congelada el 15/11. |

El Sprint 1 es un único sprint con un solo Sprint Planning, una sola Sprint Review y una sola Sprint Retrospective. Para detectar atrasos a tiempo, el plan del sprint se ordenó en **cinco semanas con un hito verificable por semana** (H1 a H5, ver [[Cronograma TucuMaps|Cronograma]]). Las semanas no son sprints: son el orden del Sprint Backlog.

> [!note] Duración del Sprint 1
> La Guía Scrum pide sprints de un mes o menos. El Sprint 1 duró cinco semanas (35 días) porque el MVP se planificó como un único incremento; los hitos semanales cumplieron la función de inspección que darían sprints más cortos.

## 1. Tablero

El tablero son los **issues de GitHub** del repositorio, ordenados en tres columnas con etiquetas:

| Columna | Etiqueta | Qué significa |
| :--- | :--- | :--- |
| **Por hacer** | `por-hacer` | Está en el Sprint Backlog y nadie lo empezó. |
| **En curso** | `en-curso` | Alguien lo está haciendo ahora. Cada persona tiene como máximo 2 en curso a la vez. |
| **Hecho** | `hecho` | Cumple la definición de hecho (abajo) y el issue está cerrado. |

Enlaces directos para ver cada columna:

- Por hacer: <https://github.com/Fumacio/TucuMaps2/issues?q=is%3Aissue+label%3Apor-hacer>
- En curso: <https://github.com/Fumacio/TucuMaps2/issues?q=is%3Aissue+label%3Aen-curso>
- Hecho: <https://github.com/Fumacio/TucuMaps2/issues?q=is%3Aissue+label%3Ahecho>

Se agregan filtros a la búsqueda para ver solo lo propio (`assignee:Fumacio`, `assignee:lourAndrada707`) o solo un área (`label:backend`, `label:frontend`).

**Cómo se mueve una tarjeta:**

1. Al empezar un issue, se le saca `por-hacer` y se le pone `en-curso`.
2. Al terminar (PR mergeado o entrega aceptada), se le pone `hecho` y se cierra el issue. Un PR con `Closes #NN` en la descripción cierra el issue solo al mergearse; la etiqueta `hecho` se agrega a mano o la agrega Claude.
3. Si algo se traba, se queda en `en-curso` y se cuenta en el mensaje diario.

> [!note] Por qué etiquetas y no GitHub Projects
> Un tablero de GitHub Projects (vista de columnas) es más visual, pero no se puede crear desde las herramientas que se usan para el repo. Si Nacho lo crea a mano desde la pestaña *Projects* del repo, alcanza con agregar los issues y usar las mismas tres columnas; las etiquetas pueden quedar como respaldo.

### Definición de hecho

Un issue está **hecho** cuando:

- El código está mergeado en `main` con su PR (o, si es diseño o contenido, el archivo está entregado donde dice el issue).
- Pasan `npm run lint` y `npm test` del paquete que se tocó, corridos en local mientras GitHub Actions siga bloqueado.
- Si es una pantalla o algo visible, se probó en el celular.
- Si cambió un requerimiento, la API o el modelo de datos, el documento de `docs/` se actualizó en el mismo PR.

## 2. Eventos del Sprint 1

| Evento | Cuándo | Qué se hizo |
| :--- | :--- | :--- |
| **Sprint Planning** | lunes 12/10 | Objetivo del sprint (el MVP completo y publicado), Sprint Backlog con los issues de las Fases 1 a 5 del [[BACKLOG DE DESARROLLO TucuMaps\|Backlog]] en orden de prioridad y plan de cinco semanas con un hito por semana. |
| **Scrum diario** | todos los días | Sin reunión: un mensaje de 3 líneas (qué hice, qué hago, qué me traba) y el tablero al día, con un máximo de 2 issues en curso por persona. |
| **Sprint Review** | domingo 15/11 | Prueba en el celular del incremento completo en la URL pública, contra el objetivo y los hitos H1 a H5. Lo no terminado vuelve al Product Backlog. |
| **Sprint Retrospective** | domingo 15/11 | Tres preguntas: ¿qué salió bien?, ¿qué no se terminó y por qué?, ¿qué cambiamos para lo que sigue? |
| **Refinamiento** | al redactar los issues de cada fase | Alcance, criterio de aceptación, dependencias, responsable y prioridad de cada issue. |

**Ajustes del Sprint Backlog durante el sprint.** El equipo reordenó el Sprint Backlog cuando cambió el avance, sin mover la fecha de fin: el backend de las semanas 3 y 4 se adelantó a la semana 2 (19/10 al 21/10); el 01/11 se reordenaron las semanas 4 y 5 con prioridad para los formularios y el panel (PR #98), y el 02/11 Nacho adelantó a la semana 4 su parte de la semana 5 que no dependía del frontend (PR #103). Si una semana no llegaba a su hito, se recortaba alcance de lo que seguía; la fecha de fin del sprint no se movía.

## 3. Roles

> [!success] Roles confirmados por Nacho el 16/10/2026

| Persona | Rol Scrum | Qué hace en la práctica |
| :--- | :--- | :--- |
| **Nacho** | **Product Owner** | Decide qué entra en el sprint y en qué orden; acepta o rechaza lo entregado en la Sprint Review; mantiene ordenado el backlog. |
| **Nacho** | **Scrum Master** | Cuida el proceso: que el tablero esté al día, que se hagan los eventos y que se apliquen los acuerdos; destraba lo que frena a Lourdes (accesos, datos de prueba, dudas de la API). |
| **Nacho** | **Equipo de desarrollo (backend)** | Backend, base de datos, despliegue y pruebas automáticas. |
| **Lourdes** | **Equipo de desarrollo (frontend y diseño)** | Frontend en React, diseño en Figma, textos y fotos de los lugares, pruebas en celular y capturas para el manual. |

En un equipo de dos, que una misma persona sea Product Owner y Scrum Master es una adaptación habitual; se aclara en el informe del TFI. Claude funciona como una herramienta del equipo de desarrollo (programa, revisa y abre PRs), no como un rol.

## Registro de los sprints

### Sprint 0: análisis (23/09 – 11/10)

- **Objetivo:** cerrar los requerimientos, el contrato de la API y el modelo de datos antes de programar.
- **Hecho:** SRS con MVP explícito (v1.7) y decisiones pendientes cerradas en la v1.8; contrato de la API REST; modelo de datos con `schema.sql` y ERD; diagramas de estado; borrador del manual de usuario; backlog de desarrollo (28/09) y cronograma (12/10). PR #1, #2, #3 y #7, mergeados el 12/10.

### Sprint 1: desarrollo del MVP (12/10 – 15/11)

**Sprint Planning (12/10)**

- **Objetivo del sprint:** MVP completo y publicado (registro y login, mapa con los 20 lugares, agenda y alertas, envío de reportes y propuestas, moderación y panel de administración), con pruebas, revisión de seguridad y copias de seguridad, congelado el 15/11.
- **Sprint Backlog:** Fase 1 (cuenta y sesión), #18 a #29, #42 a #49, #53, #59 a #65, #74, #97 y #99 a #102. Durante el sprint se sumaron #109 (04/11, "Mis aportes") y #111 ("Mi ubicación").
- **Plan por semana (hitos):** 1) registro y login en la URL pública (H1); 2) mapa público con los 20 lugares en el celular (H2); 3) un ciudadano reporta y propone eventos (H3); 4) ciclo completo de moderación (H4); 5) pruebas, seguridad, copias de seguridad y versión congelada (H5).

**Lo hecho, por semana**

- **Semana 1 (12/10 – 18/10):** backend de la Fase 1 (registro, login, sesión, verificación de email y recuperación de contraseña) y de la Fase 2 (#18 a #22), desplegado en Render + Neon desde el 12/10; #24 (contenido de los 20 lugares); parte de #23 (paleta, tipografía, íconos y logo). El CI con GitHub Actions se reemplazó por lint y pruebas en local (cuenta bloqueada por facturación). H1 cumplido el 13/10.
- **Semana 2 (19/10 – 25/10):** frontend del mapa con los 20 lugares (#25), agrupación (#26), selector Turismo/Seguridad (#27), agenda (#28) y estados de carga (#29); fotos propias de 3 lugares (#53). Se adelantó todo el backend de envíos y moderación (#42 a #49), el perfil (RF-25, #74) y el script de copias de seguridad.
- **Semana 3 (26/10 – 01/11):** Términos, Privacidad y aviso legal (#61, PR #87); pantallas de cuenta (#60, PR #94); frontend publicado en Vercel el 30/10 (#59, H2 con atraso); `TRUST_PROXY` = 2 probado el 01/11. Formularios (#62) y "Mis aportes" (#63) cerrados la noche del 01/11.
- **Semana 4 (02/11 – 08/11):** panel de administración completo el 07/11 (#64, #65; H4); datos de demostración (#97); "Mis envíos" pasa a "Mis aportes" (#109).
- **Semana 5 (09/11 – 15/11):** revisión de seguridad del backend (#100), rendimiento y una prueba por criterio de aceptación (#101, cobertura 97 %, H5), copia diaria de la base (#99).

**Sprint Review (15/11)**

- **Incremento:** el MVP completo funcionando en <https://tucu-maps2.vercel.app> con el backend en Render y la base en Neon. Se cumplió el objetivo del sprint; H2 y H3 se cumplieron con atraso.
- **No terminado (vuelve al Product Backlog):** "Mi ubicación" (#111, terminado el 20/11), la carpeta del TFI (#102) y el manual con capturas.

**Sprint Retrospective (15/11)**

- **Salió bien:** el backend avanzó más rápido de lo previsto, quedó desplegado desde la primera semana y se adelantó dos semanas; la app quedó publicada con login real; el ciclo de moderación funcionó de punta a punta; revisión de seguridad y de rendimiento con cobertura del 97 % y copia diaria de la base.
- **A mejorar:** el frontend, con una sola persona, arrancó tarde y siguió una semana atrasado (H2 y H3 con atraso); el tablero no siempre reflejaba lo que estaba en curso ni se movía al cerrar los issues; el panel se terminó sin margen para probarlo en el celular; "Mi ubicación", el manual y la carpeta dependían del cierre del frontend.
- **Acuerdos aplicados durante el sprint:** pasar cada issue a `en-curso` al empezarlo (desde el 19/10) y, al mergear un PR, cerrar su issue y pasarlo a `hecho` en el momento (desde el 01/11).
- **Mejoras para lo que sigue:** probar cada pantalla en el celular apenas se integra; fijar fechas intermedias para el manual y la carpeta; registrar la revisión y la retrospectiva el mismo día.
