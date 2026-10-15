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

> [!warning] Propuesta para que Nacho confirme
> Los roles de abajo son una propuesta. Cuando Nacho los confirme, se borra este aviso y se actualiza el [[Cronograma TucuMaps|Cronograma]] si cambia algo.

| Persona | Rol Scrum | Qué hace en la práctica |
| :--- | :--- | :--- |
| **Nacho** | **Product Owner** | Decide qué entra en cada sprint y en qué orden; acepta o rechaza lo entregado en la revisión del domingo; mantiene ordenado el backlog. |
| **Nacho** | **Scrum Master** | Cuida el proceso: que el tablero esté al día, que el cierre del domingo se haga y que se aplique la mejora elegida; destraba lo que frena a Lourdes (accesos, datos de prueba, dudas de la API). |
| **Nacho** | **Equipo de desarrollo (backend)** | Backend, base de datos, despliegue y pruebas automáticas. |
| **Lourdes** | **Equipo de desarrollo (frontend y diseño)** | Frontend en React, diseño en Figma, textos y fotos de los lugares, pruebas en celular y capturas para el manual. |

En un equipo de dos, que una misma persona sea Product Owner y Scrum Master es una adaptación habitual; se aclara en el informe del TFI. Claude funciona como una herramienta del equipo de desarrollo (programa, revisa y abre PRs), no como un rol.

## Registro de sprints

*(Se completa en cada cierre de domingo.)*
