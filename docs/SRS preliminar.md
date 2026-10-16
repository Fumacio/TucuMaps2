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
> - **Diseño UML:** [[Diagrama de casos de uso TucuMaps|Diagrama de Casos de Uso]] · [[Diagramas de clases y despliegue TucuMaps|Diagramas de Clases, Componentes y Despliegue]]
> - **Contrato de la API:** [[API TucuMaps|Especificación de la API REST]]
> - **Modelo de datos y estados:** [[Modelo de datos TucuMaps|Modelo de Datos y Diagramas de Estado]]
> - **Legales:** [[Terminos de uso TucuMaps|Términos de Uso]] · [[Politica de privacidad TucuMaps|Política de Privacidad]]
> - **Cronograma:** [[Cronograma TucuMaps|Cronograma de Sprints]]

---
### 1. MARCO DE TRABAJO (AGILE)

#### 1.1 Metodología de Desarrollo
TucuMaps se desarrolla bajo una metodología **Ágil**, priorizando la **entrega de valor constante**. El proyecto no se concibe como un bloque estático, sino como una serie de iteraciones (Sprints) que permiten adaptar el sistema basándose en el feedback y la viabilidad técnica.

#### 1.2 Definición del MVP (Producto Mínimo Viable)
Para garantizar la viabilidad del proyecto, se define el **MVP** como el conjunto de funcionalidades críticas que permiten que la aplicación sea operativa y útil desde la primera entrega:
- **Core del Mapa:** Consulta de lugares turísticos e históricos, eventos y reportes de seguridad aprobados, dentro de Tucumán. Se alterna entre las vistas Turismo/Eventos y Seguridad.
- **Contenido mínimo:** Al menos 20 lugares históricos con su contenido histórico. Las imágenes se cargan como URL (sin subida de archivos). La carga inicial de eventos (hasta 10, a modo de demostración) es opcional.
- **Autenticación Básica:** Registro con verificación de email, inicio de sesión y recuperación de contraseña, para reportar incidentes y proponer eventos.
- **Flujo de Alertas:** Envío de reportes por usuarios registrados y moderación administrativa antes de su publicación. Las confirmaciones comunitarias son complementarias.
- **Gestión Admin:** Alta y edición de puntos de interés, revisión/aprobación de reportes y propuestas de eventos, y bloqueo de usuarios reincidentes.

Cualquier funcionalidad adicional se considerará una **Mejora Evolutiva**. Quedan fuera del alcance actual, para un futuro lejano: soporte multi-idioma y accesibilidad avanzada.

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
  - **Cómo:** Contraseñas con `bcrypt`. La sesión es un JWT guardado en una cookie `httpOnly`, `Secure` y `SameSite=Lax` (ver 4.2). La sesión no vence mientras el usuario use la aplicación: el token dura 90 días y se renueva automáticamente con cada uso, por lo que solo se cierra tras 90 días sin entrar, al cerrar sesión o al cambiar la contraseña. En cada solicitud el servidor verifica en la base que el usuario exista, no esté bloqueado y que la versión del token (`token_version`) coincida.
  - **Política de contraseñas:** mínimo 8 caracteres, con al menos una letra y un número.
  - **Intentos de login:** máximo 5 intentos fallidos cada 15 minutos por IP y email; superado el límite se responde con un mensaje claro y se espera.
  - **Criterio de Aceptación:** El usuario puede entrar a su cuenta y no necesita volver a iniciar sesión mientras use la aplicación al menos una vez cada 90 días. Una contraseña que no cumple la política es rechazada; el sexto intento fallido dentro de 15 minutos es rechazado aunque la contraseña sea correcta.

- **RF-02: Mapa y consulta de contenido**
  - **Qué:** Mapa centrado en Tucumán que permite consultar los contenidos mínimos definidos en el MVP (sección 1.2) y alternar entre Turismo/Eventos y Seguridad.
  - **Cómo:** Integración de React-Leaflet y API de Lugares, con mapa base de OpenStreetMap y su atribución visible. La carga inicial de lugares está en [[Seed lugares TucuMaps|Seed de Lugares Históricos]].
  - **Criterio de Aceptación:** Se pueden localizar y consultar individualmente los contenidos mínimos; los marcadores visibles corresponden a la vista seleccionada.

- **RF-03: Verificación de email y recuperación de contraseña**
  - **Qué:** Al registrarse, el usuario debe confirmar su email para poder enviar reportes o propuestas. Puede recuperar su contraseña mediante un enlace enviado por correo.
  - **Cómo:** Envío de correos transaccionales (Nodemailer) con tokens de un solo uso y vencimiento: el enlace de verificación vence a las **24 hs** y el de recuperación de contraseña a la **1 h**. Se puede pedir el reenvío del enlace de verificación. Al recuperar la contraseña se cierran las sesiones abiertas en otros dispositivos.
  - **Criterio de Aceptación:** Un usuario con email sin verificar no puede enviar reportes ni propuestas; el enlace de recuperación funciona una sola vez y vence a la hora.

- **RF-04: Términos de uso, privacidad y aviso legal**
  - **Qué:** Términos de uso y política de privacidad aceptados al registrarse, y un aviso visible en la aplicación indicando que TucuMaps no está afiliado a organismos oficiales ni reemplaza a los servicios de emergencia (911). El autor de un reporte no se muestra públicamente.
  - **Cómo:** Pantallas informativas ([[Terminos de uso TucuMaps|Términos de Uso]] y [[Politica de privacidad TucuMaps|Política de Privacidad]]), casilla de aceptación en el registro (se guarda la versión aceptada y la fecha) y aviso fijo en la interfaz. Solo pueden registrarse mayores de 18 años.
  - **Criterio de Aceptación:** No se puede completar el registro sin aceptar los términos y declarar ser mayor de 18 años; el aviso es accesible desde cualquier pantalla del mapa.

- **RF-05: Agrupación de marcadores**
  - **Qué:** Cuando hay muchos marcadores cercanos, el mapa los agrupa en un solo indicador con el total, que se despliega al acercar el zoom.
  - **Cómo:** Plugin de clustering para React-Leaflet.
  - **Criterio de Aceptación:** Con una cantidad elevada de marcadores, el mapa sigue siendo legible y fluido.

- **RF-06: Estados de carga y manejo de errores**
  - **Qué:** La interfaz informa al usuario cuando está cargando, cuando el servidor tarda en responder (ej. servicio "despertando") y cuando ocurre un error, con mensajes claros y opción de reintentar.
  - **Cómo:** Indicadores de carga y manejo centralizado de errores en las llamadas a la API.
  - **Criterio de Aceptación:** Ante una demora o falla del servidor, el usuario ve un mensaje comprensible en lugar de una pantalla en blanco.

#### Sprint 2: Propuestas y reportes (MVP)
- **RF-07: Envío de reportes de seguridad y propuestas de eventos**
  - **Qué:** El usuario registrado puede enviar un reporte geolocalizado de seguridad y proponer un evento. Ambos quedan pendientes de revisión. Mientras siguen `pendiente`, el autor puede **editarlos** o **cancelarlos** (estado `cancelado`); una vez revisados ya no puede modificarlos. Los reportes no llevan fotos en el MVP.
  - **Cómo:** Endpoints de creación, edición y cancelación protegidos por autenticación y vinculados a coordenadas. El usuario ve la lista de sus envíos con su estado.
  - **Criterio de Aceptación:** El usuario recibe confirmación del envío; los elementos pendientes no aparecen en el mapa público; un elemento ya aprobado o rechazado no puede ser editado ni cancelado por su autor. Los cancelados cuentan para el límite diario (RF-09).

- **RF-08: Moderación y publicación**
  - **Qué:** El administrador revisa reportes y propuestas de eventos, y puede aprobarlos o rechazarlos. Las confirmaciones comunitarias aportan información, pero no sustituyen la aprobación administrativa. Un reporte aprobado cuya alerta fue solucionada pasa al estado `resuelto`.
  - **Cómo:** Acciones restringidas por rol y registro del estado de revisión según los diagramas de estado de [[Modelo de datos TucuMaps|Modelo de Datos]]: `pendiente` → `aprobado` / `rechazado` / `cancelado`; `aprobado` → `resuelto` (solo reportes) / `retirado`. Los estados `rechazado`, `resuelto`, `cancelado` y `retirado` son **finales**: no se reabren; si hace falta, el usuario envía uno nuevo. El rechazo exige motivo.
  - **Criterio de Aceptación:** Solo los reportes y eventos aprobados se muestran públicamente; los rechazados, resueltos, cancelados y retirados permanecen fuera del mapa. Cualquier transición no prevista en el diagrama es rechazada por el servidor.

- **RF-09: Límites de envío por usuario**
  - **Qué:** Cada usuario puede enviar una cantidad máxima de reportes y propuestas de eventos cada 24 hs (valores iniciales: 5 reportes y 3 propuestas).
  - **Cómo:** Control en el backend por usuario y ventana de tiempo, sumado al rate limiting general. Los valores se configuran con las variables de entorno `LIMITE_REPORTES_DIA` y `LIMITE_EVENTOS_DIA`.
  - **Criterio de Aceptación:** Superado el límite, el sistema rechaza el envío con un mensaje claro.

- **RF-10: Validación de datos y ubicación**
  - **Qué:** Todo dato enviado se valida en el servidor, y las coordenadas de reportes y eventos deben caer dentro de Tucumán.
  - **Cómo:** Validación de esquema con `zod` en el backend, límites geográficos y catálogos cerrados (sección 3.1). El límite geográfico es una caja rectangular aproximada de la provincia (latitud −28,0 a −26,0; longitud −66,5 a −64,5); se acepta que incluye franjas de provincias vecinas.
  - **Criterio de Aceptación:** Los envíos con datos inválidos, valores fuera de catálogo o ubicación fuera de la caja de Tucumán son rechazados.

- **RF-11: Vigencia de las alertas**
  - **Qué:** Un reporte aprobado se muestra como alerta activa durante 24 hs desde su aprobación; luego deja de mostrarse en el mapa y queda en el historial del panel de administración.
  - **Cómo:** Filtro por fecha de aprobación en las consultas del mapa.
  - **Criterio de Aceptación:** Pasadas 24 hs desde su aprobación, el reporte no aparece en la vista de Seguridad.

- **RF-12: Archivo automático de eventos**
  - **Qué:** Un evento se archiva cuando pasan 24 hs desde que sucedió (desde su fecha y hora de finalización o, si no se indica, de inicio). Los eventos archivados dejan de mostrarse en el mapa y en la agenda, y quedan en el historial del panel de administración.
  - **Cómo:** Filtro por fecha en las consultas públicas de eventos; no requiere borrar datos.
  - **Criterio de Aceptación:** Pasadas 24 hs desde que sucedió, el evento no aparece en el mapa ni en la agenda pública.

#### Sprint 3: Gestión de contenidos (MVP)
- **RF-13: Administración de lugares y contenidos publicados**
  - **Qué:** El administrador da de alta, edita y desactiva lugares; crea eventos directamente (nacen `aprobado`, sin pasar por la cola); edita eventos aprobados (por ejemplo un cambio de horario), que siguen publicados; y puede **retirar** reportes o eventos publicados (estado `retirado`, sin motivo obligatorio), por ejemplo un evento suspendido.
  - **Cómo:** Endpoints restringidos por rol de Administrador. El retiro registra quién lo hizo y cuándo (`retirado_por`, `retirado_en`).
  - **Criterio de Aceptación:** Los cambios administrativos se reflejan en el contenido consultable del sistema; un elemento retirado deja de verse en el mapa y queda en el historial del panel.

- **RF-14: Confirmación comunitaria**
  - **Qué:** Un usuario registrado puede confirmar una alerta publicada como aporte comunitario, una sola vez por alerta y no sobre sus propios reportes.
  - **Cómo:** Endpoint protegido por autenticación y restricción de unicidad por usuario y reporte en la base de datos.
  - **Criterio de Aceptación:** Un segundo intento de confirmar la misma alerta es rechazado; la confirmación no modifica el estado de moderación.

- **RF-15: Panel de administración**
  - **Qué:** Sección `/admin` de la aplicación, visible solo para administradores, con: cola de reportes y propuestas de eventos pendientes (con detalle, ubicación en mini-mapa y confirmaciones), acciones de aprobar, rechazar (con motivo) y marcar como `resuelto`, alta/edición de lugares, y lista de usuarios con opción de bloquear/desbloquear.
  - **Cómo:** Rutas de React protegidas por rol, consumiendo endpoints del backend que validan el rol de Administrador en el servidor. Cada revisión registra quién la hizo y cuándo (`revisado_por`, `revisado_en`, `motivo_rechazo`).
  - **Criterio de Aceptación:** Un usuario sin rol de Administrador no puede acceder al panel ni a sus endpoints; el administrador puede completar el ciclo de moderación desde el panel, y cada decisión queda registrada.

- **RF-16: Gestión y bloqueo de usuarios**
  - **Qué:** El administrador puede bloquear y desbloquear usuarios reincidentes (ej. que envían reportes falsos).
  - **Cómo:** Endpoint restringido por rol de Administrador y campo de estado en el usuario, verificado en el login y en cada solicitud autenticada. Al bloquear, sus reportes y propuestas `pendiente` se rechazan automáticamente con el motivo "Usuario bloqueado". Un administrador no puede bloquearse a sí mismo.
  - **Criterio de Aceptación:** Un usuario bloqueado pierde la sesión en su siguiente solicitud, no puede iniciar sesión ni enviar reportes o propuestas, y sus pendientes pasan a `rechazado`; al desbloquearlo recupera el acceso (lo rechazado no se reabre).

- **RF-24: Retención de datos y baja de cuenta**
  - **Qué:** El usuario puede eliminar su cuenta. Los datos se conservan solo el tiempo necesario: los reportes se borran al cumplir **1 año** desde su creación, y los eventos se conservan como historial pero se desvinculan de su autor al año.
  - **Cómo:** Endpoint de baja que pide la contraseña y borra el usuario; sus reportes y eventos quedan sin autor (`usuario_id` / `propuesto_por` en `NULL`) y sus confirmaciones se borran. Una tarea diaria aplica la retención de 1 año y limpia tokens vencidos. Los registros técnicos (IP, navegador) y las copias de seguridad se conservan 30 días. Los plazos se informan en la [[Politica de privacidad TucuMaps|Política de Privacidad]].
  - **Criterio de Aceptación:** Tras la baja, el email queda libre para registrarse de nuevo y ningún dato del panel permite identificar al ex usuario; un reporte de más de 1 año no existe en la base.

#### 3.1 Catálogos de valores
Los valores se guardan como texto con restricción `CHECK` en la base; agregar uno requiere una migración.

| Catálogo | Valores |
| :--- | :--- |
| **Tipo de reporte** | `robo_hurto` (Robo o hurto), `arrebato_motochorro` (Arrebato / motochorro), `zona_sin_iluminacion` (Zona sin iluminación), `zona_peligrosa` (Zona peligrosa), `accidente_transito` (Accidente de tránsito), `otro` |
| **Categoría de lugar** | `historico` (Histórico), `cultural_museo` (Cultural / museo), `natural_paisaje` (Natural / paisaje), `religioso` (Religioso), `recreativo` (Recreativo) (gastronomía queda para RF-18) |
| **Categoría de evento** | `musica` (Música), `teatro` (Teatro), `feria` (Feria), `gastronomia` (Gastronomía), `deporte` (Deporte), `cultural` (Cultural), `otro` (Otro) |
| **Modalidad de evento** | `gratuita` (Gratuita), `con_entrada` (Con entrada), `a_la_gorra` (A la gorra) |

Las imágenes de lugares y eventos se cargan como URL (`http`/`https`); no hay subida de archivos en el MVP.

#### Sprint 4: Experiencia de Usuario y Valor Agregado (Evolutivos)
- **RF-17: Modo Nocturno y UX Adaptativa** $\rightarrow$ Mejora de visibilidad y contraste.
- **RF-18: Categorización Gastronómica** $\rightarrow$ Separación detallada de turismo vs comida.
- **RF-19: Contenido histórico ampliado** $\rightarrow$ Información cultural enriquecida más allá del mínimo del MVP.
- **RF-20: Pre-validación asistida por IA** $\rightarrow$ Al recibirse un reporte o propuesta de evento, un flujo automatizado (n8n) consulta a un modelo de IA que sugiere si el contenido es probable broma, spam o contenido dudoso. El resultado (`ia_veredicto`, `ia_confianza`, `ia_motivo`) se guarda en el registro y se muestra al administrador en el panel, y se deja una bitácora en Google Sheets. **La IA solo sugiere: nunca aprueba, rechaza ni publica por sí sola.** Si el flujo falla, el elemento queda `pendiente` con la etiqueta "sin analizar". La comunicación entre el backend y n8n se protege con un secreto compartido.

- **RF-21: Notificaciones al usuario** $\rightarrow$ Aviso al usuario cuando su reporte o propuesta es aprobado o rechazado.
- **RF-22: Estadísticas y filtros avanzados del panel** $\rightarrow$ Métricas de moderación, historial detallado de decisiones y filtros avanzados en el panel de administración.
- **RF-23: Subida de imágenes** $\rightarrow$ Carga de archivos de imagen (fotos de lugares, flyers de eventos y, si se habilita, evidencia de reportes) con Multer y almacenamiento en Cloudinary, en lugar de ingresar solo una URL.

---

### 3.2 REQUERIMIENTOS NO FUNCIONALES

| ID | Requerimiento | Métrica |
| :--- | :--- | :--- |
| **RNF-01 Rendimiento** | El mapa con sus marcadores carga rápido en un celular. | Menos de 3 s con conexión 4G, sin contar el "despertar" del backend en el plan gratuito. Las consultas de la API responden en menos de 500 ms con la base cargada con el seed. |
| **RNF-02 Compatibilidad** | Diseño *mobile first*. | Chrome, Firefox, Safari y Edge de los últimos 2 años; pantallas desde 360 px de ancho. |
| **RNF-03 Usabilidad** | Uso sin capacitación. | Enviar un reporte en 3 pasos o menos desde el mapa; textos en español claro; botones de al menos 44 px en celular. |
| **RNF-04 Escalabilidad del mapa** | El mapa sigue legible y fluido con mucho contenido. | Al menos 500 marcadores simultáneos con agrupación (RF-05). |
| **RNF-05 Disponibilidad** | Se acepta la limitación del plan gratuito. | El backend puede tardar hasta ~1 min en responder tras inactividad; la interfaz lo informa (RF-06). |
| **RNF-06 Seguridad** | Ver sección 4.2. | Contraseñas con bcrypt, cookies `httpOnly`, HTTPS, validación en servidor, ningún secreto en el repositorio. |
| **RNF-07 Privacidad** | Cumplimiento de la Ley 25.326. | El autor de un reporte nunca se expone; retención según RF-24. |
| **RNF-08 Mantenibilidad** | Código y base versionados. | Cambios de esquema por migraciones; pruebas automáticas en cada push (sección 4.4). |

---

### 4. ESPECIFICACIONES TÉCNICAS (IMPLEMENTACIÓN)

#### 4.1 Stack Tecnológico (Justificación de Valor)
- **Frontend (React):** Elegido por su capacidad de crear interfaces fluidas (SPA), evitando recargas de página que frustran al usuario.
- **Backend (Node.js/Express):** Seleccionado por su alta eficiencia en el manejo de múltiples peticiones asíncronas (mapa interactivo).
- **Base de Datos (PostgreSQL):** Garantiza que la relación entre usuarios, reportes y confirmaciones sea consistente y segura.
- **Mapas (React-Leaflet):** Visualización de información georreferenciada en las vistas del sistema.
- **Imágenes (MVP: solo URL):** Lugares y eventos guardan la dirección de una imagen ya publicada (`imagen_url`, `flyer_url`); el MVP no sube archivos al servidor. La subida de imágenes con Multer y Cloudinary queda como mejora evolutiva (RF-23).

#### 4.2 Seguridad y Calidad
- **Protección de Datos:** Uso de hashing para contraseñas y tokens firmados para sesiones.
- **Validación de Datos:** Implementación de filtros en el servidor para evitar inyecciones SQL y datos basura.
- **Seguridad Web:** Comunicación por HTTPS, cabeceras de seguridad HTTP (`helmet`) y validación de que las URL de imágenes usen solo los protocolos `http` o `https`.
- **Sesión:** JWT en cookie `httpOnly`, `Secure` y `SameSite=Lax`. El frontend reenvía las rutas `/api/*` al backend con los *rewrites* de Vercel, de modo que el navegador ve la API en el mismo dominio que la aplicación: así la cookie no es "de terceros" y Safari no la bloquea. Como protección adicional contra CSRF, los endpoints que modifican datos exigen el encabezado `X-Requested-With: TucuMaps`.
- **Primer administrador:** Se crea manualmente en la base de datos. El registro público siempre crea usuarios con rol Ciudadano.

#### 4.3 Despliegue y operación
- **Objetivo:** costo cero, adecuado para un proyecto universitario.
- **Frontend:** Vercel, que reenvía `/api/*` al backend. **Backend:** Render (plan gratuito). **Base de datos:** Neon (PostgreSQL). Las condiciones de los planes gratuitos deben verificarse al momento del despliegue.
- **Limitación aceptada:** el plan gratuito del backend entra en reposo por inactividad, por lo que la primera consulta puede demorar; se mitiga "despertando" el servicio antes de una demostración.
- **Copias de seguridad:** snapshots programados del proveedor (Neon) y volcados periódicos de la base (`pg_dump`) desde la computadora de un integrante del equipo, conservados 30 días.
- **Secretos:** variables de entorno; nunca se versionan en el repositorio.
- **Cambios en la base:** migraciones con `node-pg-migrate`; `schema.sql` es la referencia del modelo y la primera migración.
- **Zona horaria:** todas las fechas se guardan como `TIMESTAMPTZ` (UTC) y se muestran en hora de Tucumán (`America/Argentina/Tucuman`).
- **Retención:** tarea del propio backend según RF-24, que corre al iniciar el servidor y cada 24 horas.

#### 4.4 Pruebas
- Pruebas automatizadas del backend (autenticación, roles, moderación, límites y validaciones) y pruebas básicas del frontend, ejecutadas en integración continua (GitHub Actions).
- **Plan:** cada criterio de aceptación de los RF del MVP se convierte en al menos un caso de prueba automatizado. Objetivo: 70 % de cobertura de líneas en el backend. Las pruebas del backend corren contra una base PostgreSQL de prueba (servicio de GitHub Actions, o una rama `tests` de Neon al correrlas en local) que se recrea con las migraciones.
- **Pruebas manuales:** recorrido completo en celular y escritorio antes de cada entrega de sprint (registro, reporte, moderación, mapa).
- **Definición de Hecho (DoD):** una historia está terminada cuando su código está en `main` mediante un PR revisado, sus pruebas pasan en CI, cumple su criterio de aceptación y la documentación afectada está actualizada.

---

### 5. CONTROL DE EVOLUCIÓN (HISTORIAL)

| Versión | Fecha | Cambio Principal | Motivo |
| :--- | :--- | :--- | :--- |
| v1.0 | 2026-09-23 | Definición inicial. | Base del proyecto. |
| v1.1 | 2026-09-23 | Cambio a Metodología Ágil y MVP. | Optimización de entrega de valor y adaptabilidad. |
| v1.2 | 2026-10-10 | Base de datos MySQL → PostgreSQL; se agrega RF-09 (bloqueo de usuarios); se define el estado `resuelto` de las alertas. | Coherencia con el diagrama de casos de uso y decisión de stack. |
| v1.3 | 2026-10-11 | Se agrega RF-10 (panel de administración) y RF-11 (pre-validación con IA, evolutivo). | Definir la interfaz de moderación y la mejora asistida por IA. |
| v1.4 | 2026-10-11 | Se agregan RF-12 a RF-18 (verificación de email, términos y aviso legal, límites de envío, validación de ubicación, vigencia de alertas de 24 hs, notificaciones y estadísticas), secciones de despliegue y pruebas; se ajusta el contenido mínimo del MVP (20 lugares históricos, eventos opcionales). | Completar requisitos para el correcto funcionamiento de la aplicación. |
| v1.5 | 2026-10-11 | Se agregan RF-19 (confirmación comunitaria única), RF-20 (agrupación de marcadores), RF-21 (estados de carga y errores), requisitos de seguridad web y creación manual del primer administrador. | Robustez y seguridad de la aplicación. |
| v1.6 | 2026-10-11 | Se agrega RF-22 (archivo automático de eventos 24 hs después de que suceden). | Evitar eventos pasados en el mapa. |
| v1.7 | 2026-10-12 | Se renumeran los requisitos en orden de sprint (ver tabla de equivalencias); en el MVP las imágenes son solo URL y la subida con Multer/Cloudinary pasa a evolutivo (RF-23); la tabla de apoyo comunitario se llama `confirmaciones` en toda la documentación. | Coherencia entre SRS, Tecnologías, Backlog y `schema.sql`. |
| v1.8 | 2026-10-12 | Se definen sesión, política de contraseñas e intentos de login (RF-01); vencimientos de enlaces (RF-03); edición y cancelación de pendientes (RF-07); estados finales, `cancelado` y `retirado` (RF-08, RF-13); bloqueo con corte inmediato de sesión (RF-16); catálogos (3.1); requerimientos no funcionales (3.2); se agrega RF-24 (retención y baja de cuenta); se quitan las fotos de reportes del MVP; plan de pruebas y DoD. | Cerrar las decisiones pendientes antes de empezar a programar. |

> [!note] Numeración
> Las filas v1.2 a v1.6 usan la numeración anterior a v1.7.

#### 5.1 Equivalencia de numeración (v1.6 → v1.7)

| Requisito | Antes | Ahora |
| :--- | :---: | :---: |
| Autenticación segura | RF-01 | RF-01 |
| Mapa y consulta de contenido | RF-02 | RF-02 |
| Verificación de email y recuperación de contraseña | RF-12 | RF-03 |
| Términos de uso, privacidad y aviso legal | RF-13 | RF-04 |
| Agrupación de marcadores | RF-20 | RF-05 |
| Estados de carga y manejo de errores | RF-21 | RF-06 |
| Envío de reportes y propuestas de eventos | RF-03 | RF-07 |
| Moderación y publicación | RF-04 | RF-08 |
| Límites de envío por usuario | RF-14 | RF-09 |
| Validación de datos y ubicación | RF-15 | RF-10 |
| Vigencia de las alertas | RF-16 | RF-11 |
| Archivo automático de eventos | RF-22 | RF-12 |
| Administración de lugares y contenidos | RF-05 | RF-13 |
| Confirmación comunitaria | RF-19 | RF-14 |
| Panel de administración | RF-10 | RF-15 |
| Gestión y bloqueo de usuarios | RF-09 | RF-16 |
| Modo nocturno | RF-06 | RF-17 |
| Categorización gastronómica | RF-07 | RF-18 |
| Contenido histórico ampliado | RF-08 | RF-19 |
| Pre-validación asistida por IA | RF-11 | RF-20 |
| Notificaciones al usuario | RF-17 | RF-21 |
| Estadísticas y filtros avanzados | RF-18 | RF-22 |
| Subida de imágenes | — | RF-23 |
| Retención de datos y baja de cuenta (v1.8) | — | RF-24 |
