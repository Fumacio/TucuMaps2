---
tags:
  - facultad
  - tfi
  - tucumaps
  - srs
  - requerimientos
  - agile
fecha: 2026-09-23
materia: Trabajo Final Integrador
tipo: srs
---

# Especificación de Requerimientos Evolutiva (SRS) — TucuMaps
## Plataforma Web Integrada de Turismo y Prevención Ciudadana

> [!info] Documentación del Grafo
> - **Proyecto Central:** [[TucuMaps|TucuMaps - Hub Principal]]
> - **Arquitectura Técnica:** [[Tecnologias TucuMaps|Stack Tecnológico]]
> - **Cronograma y Fases:** [[BACKLOG DE DESARROLLO TucuMaps|Backlog de Desarrollo]]
> - **Diseño UML:** [[Diagrama de casos de uso TucuMaps|Diagrama de Casos de Uso]]
> - **Fundamentos Teóricos:** [[Gestión Parcial|Gestión de Desarrollo — Ingeniería de Requerimientos]]

---
### 1. MARCO DE TRABAJO (AGILE)

#### 1.1 Metodología de Desarrollo
TucuMaps se desarrolla bajo una metodología **Ágil**, priorizando la **entrega de valor constante**. El proyecto no se concibe como un bloque estático, sino como una serie de iteraciones (Sprints) que permiten adaptar el sistema basándose en el feedback y la viabilidad técnica.

#### 1.2 Definición del MVP (Producto Mínimo Viable)
Para garantizar la viabilidad del proyecto, se define el **MVP** como el conjunto de funcionalidades críticas que permiten que la aplicación sea operativa y útil desde la primera entrega:
- **Core del Mapa:** Consulta de lugares turísticos e históricos, eventos y reportes de seguridad aprobados, dentro de Tucumán. Se alterna entre las vistas Turismo/Eventos y Seguridad.
- **Contenido mínimo:** Al menos 20 lugares turísticos o históricos y 10 eventos; al menos 10 de esos lugares incluyen contenido histórico.
- **Autenticación Básica:** Registro e inicio de sesión para reportar incidentes y proponer eventos.
- **Flujo de Alertas:** Envío de reportes por usuarios registrados y moderación administrativa antes de su publicación. Las confirmaciones comunitarias son complementarias.
- **Gestión Admin:** Alta y edición de puntos de interés, revisión/aprobación de reportes y propuestas de eventos, y bloqueo de usuarios reincidentes.

Cualquier funcionalidad adicional se considerará una **Mejora Evolutiva**.

---

### 2. DESCRIPCIÓN GENERAL

#### 2.1 Visión del Producto
TucuMaps es una herramienta de apoyo ciudadano y turístico. El enfoque principal es la **usabilidad extrema**, eliminando fricciones para usuarios con baja alfabetización tecnológica.

#### 2.2 Actores y Flujos de Valor
| Actor | Valor Percibido | Acceso |
| :--- | :--- | :--- |
| **Usuario Anónimo** | "Quiero saber dónde ir y qué evitar sin complicaciones". | Lectura de mapa y detalles. |
| **Usuario Registrado** | "Quiero contribuir a la seguridad de mi ciudad y proponer eventos". | Todo lo anterior + Envío de reportes y propuestas de eventos; confirmación comunitaria complementaria. |
| **Administrador** | "Quiero mantener la calidad de la información y moderar el contenido". | Gestión de lugares, revisión/aprobación de reportes y propuestas de eventos, y bloqueo/desbloqueo de usuarios. |

---

### 3. ESPECIFICACIONES FUNCIONALES (BACKLOG)

Dividimos los requerimientos en **Sprints** para asegurar la entrega de valor.

#### Sprint 1: Infraestructura, Acceso y Mapa (MVP)
- **RF-01: Autenticación Segura**
  - **Qué:** Registro y Log in de usuarios.
  - **Cómo:** Implementación de JWT y Bcrypt.
  - **Criterio de Aceptación:** El usuario puede entrar a su cuenta y el token persiste durante la sesión.

- **RF-02: Mapa y consulta de contenido**
  - **Qué:** Mapa centrado en Tucumán que permite consultar los contenidos mínimos definidos en el MVP (sección 1.2) y alternar entre Turismo/Eventos y Seguridad.
  - **Cómo:** Integración de React-Leaflet y API de Lugares.
  - **Criterio de Aceptación:** Se pueden localizar y consultar individualmente los contenidos mínimos; los marcadores visibles corresponden a la vista seleccionada.

#### Sprint 2: Propuestas y reportes (MVP)
- **RF-03: Envío de reportes de seguridad y propuestas de eventos**
  - **Qué:** El usuario registrado puede enviar un reporte geolocalizado de seguridad y proponer un evento. Ambos quedan pendientes de revisión.
  - **Cómo:** Endpoints de creación protegidos por autenticación y vinculados a coordenadas.
  - **Criterio de Aceptación:** El usuario recibe confirmación del envío; los elementos pendientes no aparecen en el mapa público.

- **RF-04: Moderación y publicación**
  - **Qué:** El administrador revisa reportes y propuestas de eventos, y puede aprobarlos o rechazarlos. Las confirmaciones comunitarias aportan información, pero no sustituyen la aprobación administrativa. Un reporte aprobado cuya alerta fue solucionada pasa al estado `resuelto`.
  - **Cómo:** Acciones restringidas por rol y registro del estado de revisión (`pendiente` → `aprobado` / `rechazado`; `aprobado` → `resuelto`).
  - **Criterio de Aceptación:** Solo los reportes y eventos aprobados se muestran públicamente; los rechazados y los resueltos permanecen fuera de las alertas activas del mapa.

#### Sprint 3: Gestión de contenidos (MVP)
- **RF-05: Administración de lugares y contenidos publicados**
  - **Qué:** El administrador da de alta o edita lugares y puede retirar reportes o eventos publicados que deban corregirse.
  - **Cómo:** Endpoints restringidos por rol de Administrador.
  - **Criterio de Aceptación:** Los cambios administrativos se reflejan en el contenido consultable del sistema.

- **RF-10: Panel de administración**
  - **Qué:** Sección `/admin` de la aplicación, visible solo para administradores, con: cola de reportes y propuestas de eventos pendientes (con detalle, ubicación en mini-mapa y confirmaciones), acciones de aprobar, rechazar (con motivo) y marcar como `resuelto`, alta/edición de lugares, y lista de usuarios con opción de bloquear/desbloquear.
  - **Cómo:** Rutas de React protegidas por rol, consumiendo endpoints del backend que validan el rol de Administrador en el servidor. Cada revisión registra quién la hizo y cuándo (`revisado_por`, `revisado_en`, `motivo_rechazo`).
  - **Criterio de Aceptación:** Un usuario sin rol de Administrador no puede acceder al panel ni a sus endpoints; el administrador puede completar el ciclo de moderación desde el panel, y cada decisión queda registrada.

- **RF-09: Gestión y bloqueo de usuarios**
  - **Qué:** El administrador puede bloquear y desbloquear usuarios reincidentes (ej. que envían reportes falsos).
  - **Cómo:** Endpoint restringido por rol de Administrador y campo de estado en el usuario, verificado en el login y en el middleware de autenticación.
  - **Criterio de Aceptación:** Un usuario bloqueado no puede iniciar sesión ni enviar reportes o propuestas; al desbloquearlo recupera el acceso.

#### Sprint 4: Experiencia de Usuario y Valor Agregado (Evolutivos)
- **RF-06: Modo Nocturno y UX Adaptativa** $\rightarrow$ Mejora de visibilidad y contraste.
- **RF-07: Categorización Gastronómica** $\rightarrow$ Separación detallada de turismo vs comida.
- **RF-08: Contenido histórico ampliado** $\rightarrow$ Información cultural enriquecida más allá del mínimo del MVP.
- **RF-11: Pre-validación asistida por IA** $\rightarrow$ Al recibirse un reporte o propuesta de evento, un flujo automatizado (n8n) consulta a un modelo de IA que sugiere si el contenido es probable broma, spam o contenido dudoso. El resultado (`ia_veredicto`, `ia_confianza`, `ia_motivo`) se guarda en el registro y se muestra al administrador en el panel, y se deja una bitácora en Google Sheets. **La IA solo sugiere: nunca aprueba, rechaza ni publica por sí sola.** Si el flujo falla, el elemento queda `pendiente` con la etiqueta "sin analizar". La comunicación entre el backend y n8n se protege con un secreto compartido.

---

### 4. ESPECIFICACIONES TÉCNICAS (IMPLEMENTACIÓN)

#### 4.1 Stack Tecnológico (Justificación de Valor)
- **Frontend (React):** Elegido por su capacidad de crear interfaces fluidas (SPA), evitando recargas de página que frustran al usuario.
- **Backend (Node.js/Express):** Seleccionado por su alta eficiencia en el manejo de múltiples peticiones asíncronas (mapa interactivo).
- **Base de Datos (PostgreSQL):** Garantiza que la relación entre usuarios, reportes y validaciones sea consistente y segura.
- **Mapas (React-Leaflet):** Visualización de información georreferenciada en las vistas del sistema.
- **Imágenes (Cloudinary):** Almacenamiento y entrega de imágenes asociadas al contenido, si se habilitan en la implementación.

#### 4.2 Seguridad y Calidad
- **Protección de Datos:** Uso de hashing para contraseñas y tokens firmados para sesiones.
- **Validación de Datos:** Implementación de filtros en el servidor para evitar inyecciones SQL y datos basura.

---

### 5. CONTROL DE EVOLUCIÓN (HISTORIAL)

| Versión | Fecha | Cambio Principal | Motivo |
| :--- | :--- | :--- | :--- |
| v1.0 | 2026-09-23 | Definición inicial. | Base del proyecto. |
| v1.1 | 2026-09-23 | Cambio a Metodología Ágil y MVP. | Optimización de entrega de valor y adaptabilidad. |
| v1.2 | 2026-10-10 | Base de datos MySQL → PostgreSQL; se agrega RF-09 (bloqueo de usuarios); se define el estado `resuelto` de las alertas. | Coherencia con el diagrama de casos de uso y decisión de stack. |
| v1.3 | 2026-10-11 | Se agrega RF-10 (panel de administración) y RF-11 (pre-validación con IA, evolutivo). | Definir la interfaz de moderación y la mejora asistida por IA. |
