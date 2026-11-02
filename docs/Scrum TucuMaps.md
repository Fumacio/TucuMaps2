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

# 🔁 Scrum en TucuMaps — Tablero, cierre de sprint y roles

> [!info] Documentación Relacionada
> - **Cronograma:** [[Cronograma TucuMaps|Cronograma de Sprints (entrega 17/11)]]
> - **Backlog:** [[BACKLOG DE DESARROLLO TucuMaps|Backlog de Desarrollo]]
> - **Proyecto General:** [[TucuMaps|TucuMaps - Hub Principal]]

El [[Cronograma TucuMaps|Cronograma]] ya fija los sprints de 1 semana y las fechas. Este documento cuenta cómo se lleva cada sprint en el día a día: dónde se ve el trabajo, cómo se cierra la semana y quién hace qué. Es Scrum liviano, pensado para un equipo de dos personas y 5 sprints.

## 1. Tablero

El tablero son los **issues de GitHub** del repositorio, ordenados en tres columnas con etiquetas:

| Columna | Etiqueta | Qué significa |
| :--- | :--- | :--- |
| **Por hacer** | `por-hacer` | Elegido para el sprint (o el próximo), nadie lo empezó. |
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
3. Si algo se traba, se queda en `en-curso` y se cuenta en el mensaje diario o en el cierre del domingo.

> [!note] Por qué etiquetas y no GitHub Projects
> Un tablero de GitHub Projects (vista de columnas) es más visual, pero las herramientas con las que Claude trabaja no pueden crearlo. Si Nacho lo crea a mano desde la pestaña *Projects* del repo, alcanza con agregar los issues y usar las mismas tres columnas; las etiquetas pueden quedar como respaldo.

### Definición de hecho

Un issue está **hecho** cuando:

- El código está mergeado en `main` con su PR (o, si es diseño o contenido, el archivo está entregado donde dice el issue).
- Pasan `npm run lint` y `npm test` del paquete que se tocó, corridos en local mientras GitHub Actions siga bloqueado.
- Si es una pantalla o algo visible, se probó en el celular.
- Si cambió un requerimiento, la API o el modelo de datos, el documento de `docs/` se actualizó en el mismo PR.

## 2. Cierre de sprint (domingo, 30 minutos)

Cada domingo, cuando ya se juntan a probar en el celular, se hace el cierre del sprint. Junta la revisión y la retrospectiva de Scrum, y deja elegido el sprint siguiente, así el lunes se arranca sin otra reunión.

| Parte | Tiempo | Qué se hace |
| :--- | :-: | :--- |
| **Revisión** | 15 min | Se prueba en el celular lo que quedó en `hecho` esta semana, contra el entregable del sprint en el [[Cronograma TucuMaps\|Cronograma]]. Lo que falla vuelve a `por-hacer` o se abre un issue nuevo. |
| **Retrospectiva** | 10 min | Tres preguntas, una línea cada uno: ¿qué salió bien?, ¿qué no se terminó y por qué?, ¿qué cambiamos la semana que viene? Se elige **una sola** mejora concreta. |
| **Próximo sprint** | 5 min | Se eligen los issues del próximo sprint y se les pone `por-hacer`. Lo que no se terminó se pasa o se recorta: si un sprint no cerró, se recorta alcance del siguiente; la fecha de entrega no se mueve. |

Al terminar, se agrega el registro del sprint al final de este documento con la plantilla de abajo (lo escribe Nacho o se lo pide a Claude en el proyecto).

### Plantilla del registro

```markdown
### Sprint N (dd/mm – dd/mm)

- **Entregable del cronograma:** ...
- **Hecho:** #NN, #NN
- **No terminado:** #NN (motivo)
- **Salió bien:** ...
- **A mejorar:** ...
- **Mejora elegida para el próximo sprint:** ...
- **Issues del próximo sprint:** #NN, #NN
```

### Fechas de cierre

| Sprint | Cierre |
| :-: | :--- |
| 1 | domingo 18/10 |
| 2 | domingo 25/10 |
| 3 | domingo 01/11 |
| 4 | domingo 08/11 |
| 5 | domingo 15/11 (versión final congelada) |

## 3. Roles

> [!success] Roles confirmados por Nacho el 16/10/2026

| Persona | Rol Scrum | Qué hace en la práctica |
| :--- | :--- | :--- |
| **Nacho** | **Product Owner** | Decide qué entra en cada sprint y en qué orden; acepta o rechaza lo entregado en la revisión del domingo; mantiene ordenado el backlog. |
| **Nacho** | **Scrum Master** | Cuida el proceso: que el tablero esté al día, que el cierre del domingo se haga y que se aplique la mejora elegida; destraba lo que frena a Lourdes (accesos, datos de prueba, dudas de la API). |
| **Nacho** | **Equipo de desarrollo (backend)** | Backend, base de datos, despliegue y pruebas automáticas. |
| **Lourdes** | **Equipo de desarrollo (frontend y diseño)** | Frontend en React, diseño en Figma, textos y fotos de los lugares, pruebas en celular y capturas para el manual. |

En un equipo de dos, que una misma persona sea Product Owner y Scrum Master es una adaptación habitual; se aclara en el informe del TFI. Claude funciona como una herramienta del equipo de desarrollo (programa, revisa y abre PRs), no como un rol.

## Registro de sprints

*(Se completa en cada cierre de domingo.)*

### Sprint 1 (12/10 – 18/10)

- **Entregable del cronograma:** registro y login funcionando en la URL pública.
- **Hecho:** backend de la Fase 1 (registro, login, sesión, verificación de email, recuperación de contraseña) y de la Fase 2 (#18 a #22), desplegado en Render + Neon; #24 (contenido de los 20 lugares); parte de #23 (paleta, tipografía, íconos y logo).
- **No terminado:** pantallas de login y registro y despliegue en Vercel (pasan a los sprints 3 y 2); diseño final de las pantallas del mapa de #23; wireframes; CI con GitHub Actions (cuenta bloqueada por facturación, se reemplaza por lint y pruebas en local).
- **Salió bien:** el backend avanzó más rápido de lo previsto y quedó desplegado desde la primera semana.
- **A mejorar:** el frontend arrancó tarde y quedan tareas pendientes de Lourdes; el tablero no reflejaba lo que estaba en curso.
- **Mejora elegida para el próximo sprint:** pasar cada issue a `en-curso` al empezarlo, así el tablero muestra el trabajo real.
- **Issues del próximo sprint:** #25 a #29 y #59 (frontend); el diseño final pendiente de #23.


### Sprint 2 (19/10 – 25/10)

- **Entregable del cronograma:** mapa público con los 20 lugares navegable en el celular.
- **Hecho:** frontend del mapa con los 20 lugares (#25), agrupación de marcadores (#26), selector Turismo/Seguridad con alertas activas (#27), agenda de eventos (#28) y estados de carga y errores (#29); fotos propias de los 3 lugares que faltaban (#53). Además se adelantó todo el backend de los Sprints 3 y 4 (#42 a #49), el perfil (RF-25) y el script de copias de seguridad.
- **No terminado:** publicación en Vercel (#59), que salió el 30/10, ya en el Sprint 3.
- **Cierre:** no se hizo la reunión del domingo 25/10, así que no hubo revisión en el celular ni retrospectiva ni mejora elegida. Registro completado el 30/10 a partir de los issues y PRs.
- **Issues del próximo sprint (según el Cronograma, sin reunión):** #59, #60, #61, #62 y #63.

### Sprint 3 (26/10 – 01/11)

- **Entregable del cronograma:** registro, login, aviso legal, envío de reportes y propuestas de eventos, "Mis envíos" y confirmaciones funcionando en la URL pública.
- **Hecho por Lourdes (frontend):** pantallas de Términos y Privacidad, aviso legal en el mapa y casilla de aceptación en el registro (#61, PR #87); pantallas de cuenta: login, registro, verificación del email, recuperación de contraseña y Mi cuenta, con la sesión en toda la app (#60, PR #94); publicación del frontend en Vercel junto con Nacho (#59).
- **Hecho por Nacho (backend, despliegue y documentación):** el backend del sprint ya estaba terminado desde el Sprint 2 (#42 a #45). Publicación en Vercel (#59): `FRONTEND_URL` y `TRUST_PROXY` = 2 en Render y en `render.yaml`, fecha de publicación de los textos legales (30/10, PR #88) y prueba de `TRUST_PROXY` en el celular y la compu (01/11). Documentación: backlog y CLAUDE.md al día (PRs #89 y #90), carpeta de presentación del TFI en el Sprint 5 y su checklist (PRs #91 y #93), registro del Sprint 2 (PR #92), SRS renombrado a "SRS TucuMaps" v1.15 (PR #95). Clase orientativa del TFI (28/10).
- **No terminado:** formularios de reporte y de evento (#62) y "Mis envíos" con confirmaciones (#63), de Lourdes; pasan al Sprint 4.
- **Salió bien:** la app quedó publicada en Vercel con login y registro reales, y el #59 se cerró con la prueba de los límites hecha entre los dos.
- **A mejorar:** el frontend sigue una semana atrasado respecto del cronograma, y el tablero no se movió al cerrar los issues (#59, #60 y #61 quedaron con su label viejo hasta el 01/11).
- **Mejora elegida para el próximo sprint:** al mergear un PR, cerrar su issue y pasarlo a `hecho` en el momento.
- **Issues del próximo sprint:** #62 y #63 primero (sin ellos no hay capa de seguridad en la demo), después #64 y #65; además #97 (datos de demostración, Nacho) y, adelantados del Sprint 5, #99 a #102 (Nacho). Si el 08/11 no están todos, se recorta alcance del #65; la fecha de entrega no se mueve.

### Sprint 4 (02/11 – 08/11) — plan

- **Entregable del cronograma:** ciclo completo de moderación funcionando (un vecino reporta o propone, el admin aprueba o rechaza y se ve en el mapa).
- **Issues, en orden de prioridad:**
  1. #62 Formularios de reporte y de evento (Lourdes), viene del Sprint 3.
  2. #63 Mis envíos y confirmar alertas (Lourdes), viene del Sprint 3.
  3. #64 Panel de administración: moderación de reportes y eventos (Lourdes).
  4. #65 Panel de administración: lugares, usuarios y resumen (Lourdes). Si el 08/11 no llega, se recorta su alcance.
  - En paralelo, Nacho: #97 Datos de demostración, reportes y eventos de ejemplo.
- **Adelantado del Sprint 5 (Nacho, 02/11):** como el backend del sprint ya está hecho desde el Sprint 2 (#46 a #49), Nacho adelanta su parte del Sprint 5 que no depende del frontend de Lourdes ni cambia la API que ella usa: #99 copia diaria de la base y snapshots de Neon, #100 revisión de seguridad del backend, #101 rendimiento del backend y pruebas por criterio de aceptación, y #102 secciones de la carpeta del TFI que no dependen del cierre.
- **Queda para el Sprint 5:** la revisión de seguridad final con el frontend terminado, la corrección de errores, el manual con capturas, el cierre de la carpeta (resumen, plan de trabajo, resultados y anexos) y la demo.
- **Límite de `en-curso`:** Lourdes trabaja como máximo dos a la vez (#62 y #63 primero); Nacho también dos: #97 y uno de #99 a #102.
- **Mejora a aplicar:** al mergear un PR, cerrar su issue y pasarlo a `hecho` en el momento.

