---
tags:
  - facultad
  - tfi
  - tucumaps
  - api
  - backend
fecha: 2026-10-12
materia: Trabajo Final Integrador
tipo: especificacion-api
---

# 🔌 Especificación de la API REST — TucuMaps

> [!info] Documentación Relacionada
> - **Proyecto Central:** [[TucuMaps|TucuMaps - Hub Principal]]
> - **Requerimientos:** [[SRS preliminar|SRS Preliminar]]
> - **Modelo de datos y estados:** [[Modelo de datos TucuMaps|Modelo de Datos]]

---

## 1. Convenciones generales

- **Base:** todas las rutas empiezan con `/api`. En producción el frontend (Vercel) reenvía `/api/*` al backend (Render), así la API y la aplicación comparten dominio.
- **Formato:** JSON en UTF-8. Fechas en ISO 8601 con zona horaria (`2026-10-20T21:00:00-03:00`). Coordenadas como números decimales (`lat`, `lng`).
- **Sesión:** cookie `tm_sesion` (`httpOnly`, `SameSite=Lax` y, solo en producción, `Secure`; en desarrollo y pruebas se usa HTTP en `localhost`) con un JWT `{ sub: id, rol, v: token_version }`. Dura 90 días y el servidor la renueva en cada solicitud autenticada. El frontend envía las solicitudes con `credentials: 'include'`.
- **CSRF:** toda solicitud `POST`, `PUT`, `PATCH` o `DELETE` debe llevar el encabezado `X-Requested-With: TucuMaps`; si falta, se responde `403`.
- **Validación:** el cuerpo y los parámetros se validan con `zod`. Los campos desconocidos se descartan.
- **Paginación:** las listas aceptan `?pagina=1&por_pagina=20` (máximo 100) y responden `{ "datos": [...], "pagina": 1, "por_pagina": 20, "total": 57 }`.
- **Rate limiting general:** 100 solicitudes por minuto por IP.

### Niveles de acceso

| Nivel | Significado |
| :--- | :--- |
| **Público** | Sin sesión. |
| **Sesión** | Usuario con sesión válida y no bloqueado. |
| **Verificado** | Sesión + email verificado + rol `ciudadano`. Un administrador recibe 403 `SIN_PERMISO`: modera y crea eventos desde el panel, pero no envía reportes, no propone eventos ni confirma alertas (decisión del 19/10/2026). |
| **Admin** | Sesión + rol `admin`. |

### Formato de error

```json
{
  "error": {
    "codigo": "LIMITE_DIARIO",
    "mensaje": "Alcanzaste el máximo de 5 reportes en 24 horas. Probá de nuevo más tarde.",
    "detalles": [{ "campo": "lat", "mensaje": "La ubicación debe estar dentro de Tucumán" }]
  }
}
```

`mensaje` siempre está en español y se puede mostrar tal cual al usuario (RF-06). `detalles` aparece solo en errores de validación.

| HTTP | `codigo` | Cuándo |
| :--- | :--- | :--- |
| 400 | `DATOS_INVALIDOS` | Falla la validación (incluye coordenadas fuera de Tucumán y valores fuera de catálogo). |
| 400 | `TOKEN_INVALIDO` | Enlace de email inexistente, usado o vencido. |
| 401 | `NO_AUTENTICADO` | Falta la sesión o venció. |
| 401 | `CREDENCIALES_INVALIDAS` | Email o contraseña incorrectos (mismo mensaje para ambos). |
| 403 | `USUARIO_BLOQUEADO` | La cuenta está bloqueada. |
| 403 | `EMAIL_NO_VERIFICADO` | Acción que requiere email verificado. |
| 403 | `SIN_PERMISO` | Falta el rol, el recurso es de otro usuario o falta el encabezado CSRF. |
| 404 | `NO_ENCONTRADO` | El recurso no existe o no es visible para quien consulta. |
| 409 | `EMAIL_EN_USO` | Registro con un email ya existente. |
| 409 | `YA_CONFIRMADO` | Segunda confirmación de la misma alerta (RF-14). |
| 409 | `ULTIMO_ADMIN` | El único administrador intenta darse de baja (RF-24). |
| 409 | `TRANSICION_INVALIDA` | Cambio de estado no permitido (ej. editar un reporte ya aprobado). |
| 429 | `LIMITE_DIARIO` | Se superó el límite de RF-09. Incluye `Retry-After` con los segundos que faltan para que se libere el próximo cupo. |
| 429 | `DEMASIADOS_INTENTOS` | Se superó alguno de estos límites: login, 5 fallidos en 15 minutos por IP y por email (RF-01); cambio de contraseña, 5 fallidos en 15 minutos por IP (cuenta cualquier respuesta con error, también una contraseña nueva inválida o una llamada sin sesión); registro, 20 por hora por IP; recuperación de contraseña, 5 por hora por IP; reenvío de verificación, 3 por hora por usuario (RF-03); rate limiting general, 100 solicitudes por minuto por IP. Incluye el encabezado `Retry-After`. |
| 500 | `ERROR_INTERNO` | Error no previsto (el detalle solo va al log del servidor). |

---

## 2. Autenticación y cuenta

| Método y ruta | Acceso | Descripción | RF |
| :--- | :--- | :--- | :--- |
| `POST /api/auth/registro` | Público | Crea un usuario `ciudadano` y envía el email de verificación. | 01, 03, 04 |
| `POST /api/auth/login` | Público | Inicia sesión y setea la cookie. | 01 |
| `POST /api/auth/logout` | Sesión | Borra la cookie. Responde **204** sin cuerpo. | 01 |
| `POST /api/auth/logout-todos` | Sesión | Cierra la sesión en todos los dispositivos (incrementa `token_version`). Responde **204** sin cuerpo. | 01 |
| `GET /api/auth/me` | Sesión | Devuelve el usuario actual. | 01 |
| `POST /api/auth/verificar-email` | Público | Confirma el email con el token del enlace. | 03 |
| `POST /api/auth/reenviar-verificacion` | Sesión | Reenvía el enlace (máximo 3 por hora). Responde **200** `{ "ok": true }`. | 03 |
| `POST /api/auth/recuperar` | Público | Envía el enlace de recuperación. | 03 |
| `POST /api/auth/restablecer` | Público | Cambia la contraseña con el token del enlace. | 03 |
| `PATCH /api/cuenta/password` | Sesión | Cambia la contraseña (pide la actual). | 01 |
| `PATCH /api/cuenta/nombre` | Sesión | Cambia el nombre. | 25 |
| `POST /api/cuenta/email` | Sesión | Pide cambiar el email (pide la contraseña): manda un enlace al email nuevo y un aviso al actual. | 25 |
| `POST /api/cuenta/confirmar-email` | Público | Confirma el email nuevo con el token del enlace. | 25 |
| `DELETE /api/cuenta` | Sesión | Da de baja la cuenta (pide la contraseña). Un administrador solo puede si queda otro administrador. | 24 |

**`POST /api/auth/registro`**
```json
{ "nombre": "Ana Pérez", "email": "ana@mail.com", "password": "clave1234",
  "acepta_terminos": true, "mayor_de_edad": true }
```
- `nombre`: 2 a 80 caracteres. `email`: formato válido, se guarda en minúsculas. `password`: mínimo 8 caracteres con al menos una letra y un número. `acepta_terminos` y `mayor_de_edad` deben ser `true`.
- **201** `{ "usuario": { "id": 12, "nombre": "Ana Pérez", "email": "ana@mail.com", "rol": "ciudadano", "email_verificado": false } }` y setea la cookie (queda con sesión iniciada).
- Errores: 400, 409 `EMAIL_EN_USO`.

**`POST /api/auth/login`** `{ "email": "...", "password": "..." }`
- **200** `{ "usuario": { ... } }` y setea la cookie.
- Errores: 401 `CREDENCIALES_INVALIDAS`, 403 `USUARIO_BLOQUEADO`, 429 `DEMASIADOS_INTENTOS`.

**`POST /api/auth/verificar-email`** `{ "token": "..." }` → **200** `{ "ok": true }`. Error 400 `TOKEN_INVALIDO`.

**`POST /api/auth/recuperar`** `{ "email": "..." }` → **200** `{ "ok": true }`, exista o no el email (no se revela qué cuentas existen). La única excepción es el límite de 5 pedidos por hora por IP: superado, responde 429 `DEMASIADOS_INTENTOS`.

**`POST /api/auth/restablecer`** `{ "token": "...", "password": "..." }` → **200** `{ "ok": true }`. Incrementa `token_version` (cierra las otras sesiones). Error 400 `TOKEN_INVALIDO`.

**`PATCH /api/cuenta/password`** `{ "password_actual": "...", "password_nueva": "..." }`
- `password_nueva` sigue la misma política que en el registro.
- **200** `{ "ok": true }`. Incrementa `token_version`: cierra las sesiones de los otros dispositivos y renueva la cookie de esta, que sigue abierta.
- Errores: 400 `DATOS_INVALIDOS` (si la contraseña actual no es correcta, con `detalles: [{ "campo": "password_actual", ... }]`), 401 `NO_AUTENTICADO`, 429 `DEMASIADOS_INTENTOS` (5 respuestas con error en 15 minutos, por IP).

**`PATCH /api/cuenta/nombre`** `{ "nombre": "Ana María Pérez" }` → **200** `{ "usuario": { ... } }` con el nombre nuevo. Mismas reglas que en el registro. Errores: 400, 401.

**`POST /api/cuenta/email`** `{ "email_nuevo": "nuevo@mail.com", "password": "..." }`
- **202** `{ "ok": true }`. El email de la cuenta no cambia todavía: se envía un enlace al email nuevo (vence a las 24 hs) y un aviso al actual. Un pedido nuevo anula el enlace anterior, y también lo anulan cambiar o restablecer la contraseña y cerrar la sesión en todos los dispositivos.
- Errores: 400 `DATOS_INVALIDOS` (contraseña incorrecta, con `campo: "password"`, o el mismo email que ya tiene), 401, 409 `EMAIL_EN_USO`, 429 `DEMASIADOS_INTENTOS` (3 pedidos por hora por usuario y 10 por hora por IP; los intentos con error cuentan para el mismo límite de 5 cada 15 minutos por IP que el cambio de contraseña).

**`POST /api/cuenta/confirmar-email`** `{ "token": "..." }` → **200** `{ "ok": true }`. El email nuevo pasa a la cuenta y queda verificado; se anulan los enlaces de recuperación y verificación enviados al anterior. No cierra sesiones. Errores: 400 `TOKEN_INVALIDO`, 403 `USUARIO_BLOQUEADO`, 409 `EMAIL_EN_USO` (otra cuenta lo tomó mientras tanto; el enlace sigue sirviendo si se libera).

**`DELETE /api/cuenta`** `{ "password": "..." }` → **204** y borra la cookie. Sus reportes y eventos quedan sin autor (RF-24). Errores: 400 `DATOS_INVALIDOS` (contraseña incorrecta), 409 `ULTIMO_ADMIN` (es el único administrador).

---

## 3. Contenido público del mapa

| Método y ruta | Acceso | Descripción | RF |
| :--- | :--- | :--- | :--- |
| `GET /api/lugares` | Público | Lugares activos. Filtro `?categoria=`. | 02 |
| `GET /api/lugares/:id` | Público | Detalle con contenido histórico. | 02 |
| `GET /api/eventos` | Público | Eventos vigentes (`eventos_vigentes`). Filtros `?categoria=&desde=&hasta=&lugar_id=`. Ordenados por `inicio`. | 02, 12 |
| `GET /api/eventos/:id` | Público | Detalle de un evento vigente. | 02 |
| `GET /api/reportes` | Público | Alertas activas (`reportes_activos`), con la cantidad de confirmaciones. Nunca incluye al autor. | 02, 11 |
| `GET /api/catalogos` | Público | Valores y etiquetas de los catálogos para armar formularios y filtros. | 10 |

**Ejemplo `GET /api/lugares`** (ordenados por nombre; `?categoria=` con un valor fuera del catálogo responde 400)
```json
[{ "id": 2, "nombre": "Casa Histórica de la Independencia", "categoria": "historico",
   "descripcion": "...", "direccion": "Congreso 151", "localidad": "San Miguel de Tucumán",
   "barrio": "Centro", "horarios": "...", "precio_entrada": "Gratuita",
   "imagen_url": "https://commons.wikimedia.org/wiki/Special:FilePath/Tucuman-CasaIndependencia2.jpg?width=1024",
   "lat": -26.833132, "lng": -65.203841 }]
```
`GET /api/lugares/:id` devuelve lo mismo más `contenido_historico` y `fuente`. Un id inexistente o de un lugar inactivo responde 404 `NO_ENCONTRADO`; un id que no es un entero positivo, 400 `DATOS_INVALIDOS`.

**Ejemplo `GET /api/eventos?categoria=musica&desde=2026-11-07&hasta=2026-11-08`** (ordenados por `inicio`; nunca incluye al autor)
```json
[{ "id": 9, "nombre": "Peña en el Parque", "categoria": "musica", "modalidad": "a_la_gorra",
   "descripcion": "Peña folclórica abierta", "lugar_nombre": "Anfiteatro del Parque 9 de Julio",
   "direccion": "Av. Soldati s/n", "barrio": "Parque 9 de Julio", "lat": -26.8317, "lng": -65.1876,
   "inicio": "2026-11-07T23:00:00.000Z", "fin": "2026-11-08T02:30:00.000Z",
   "flyer_url": null, "etiquetas": ["folclore", "familia"], "lugar_id": 12 }]
```
- `desde` y `hasta` aceptan un día (`2026-11-07`, tomado en hora de Tucumán: `desde` arranca a las 00:00 y `hasta` incluye el día entero) o una fecha y hora **con zona** (`2026-11-07T20:00:00-03:00`). Sin zona responde 400.
- Devuelven los eventos que se cruzan con el rango: los que no terminaron antes de `desde` y empezaron hasta `hasta`. Un evento sin `fin` cuenta como un instante en su `inicio`; para "lo que está pasando ahora" se pide la lista sin `desde` (la vista ya mantiene los eventos 24 hs, RF-12).
- `lugar_id` es la sede opcional del evento: el `id` de uno de los lugares del mapa, o `null`. Con `?lugar_id=12` se piden los próximos eventos de ese lugar para su ficha.
- Un parámetro vacío equivale a no mandarlo. Una categoría fuera del catálogo, un `lugar_id` que no es un entero positivo, una fecha mal formada o `hasta` anterior a `desde` responden 400 `DATOS_INVALIDOS`.
- `GET /api/eventos/:id` devuelve el mismo objeto. Un evento inexistente, no aprobado o ya archivado responde 404 `NO_ENCONTRADO`.

**Ejemplo `GET /api/catalogos`** (las etiquetas son las de la sección 3.1 del SRS; se puede guardar en caché 5 minutos)
```json
{ "tipos_reporte": [{ "valor": "robo_asalto", "etiqueta": "Robos, asaltos y entraderas" }, ...],
  "categorias_lugar": [{ "valor": "historico", "etiqueta": "Histórico" }, ...],
  "categorias_evento": [{ "valor": "musica", "etiqueta": "Música" }, ...],
  "modalidades_evento": [{ "valor": "a_la_gorra", "etiqueta": "A la gorra" }, ...] }
```

Las listas públicas del mapa no se paginan: devuelven todos los elementos visibles (el volumen es acotado por la vigencia de 24 hs y el clustering resuelve la visualización).

**Ejemplo `GET /api/reportes`** (la alerta aprobada más recientemente primero; nunca incluye al autor ni al moderador)
```json
[{ "id": 31, "tipo": "robo_asalto", "descripcion": "Arrebatos frecuentes en la parada",
   "direccion": "Av. Mate de Luna 2400", "barrio": "Barrio Norte",
   "lat": -26.8235, "lng": -65.2301, "aprobado_en": "2026-10-20T17:05:00.000Z",
   "confirmaciones": 4 }]
```

---

## 4. Envíos del ciudadano

| Método y ruta | Acceso | Descripción | RF |
| :--- | :--- | :--- | :--- |
| `POST /api/reportes` | Verificado | Envía un reporte (queda `pendiente`). | 07, 09, 10 |
| `PUT /api/reportes/:id` | Verificado, autor | Edita mientras está `pendiente`. | 07 |
| `POST /api/reportes/:id/cancelar` | Verificado, autor | Cancela mientras está `pendiente`. | 07 |
| `POST /api/reportes/:id/confirmar` | Verificado | Confirma una alerta activa ajena (una vez). | 14 |
| `POST /api/eventos` | Verificado | Propone un evento (queda `pendiente`). | 07, 09, 10 |
| `PUT /api/eventos/:id` | Verificado, autor | Edita mientras está `pendiente`. | 07 |
| `POST /api/eventos/:id/cancelar` | Verificado, autor | Cancela mientras está `pendiente`. | 07 |
| `GET /api/mis-envios` | Sesión | Reportes y eventos propios con su estado y motivo de rechazo. Filtro `?tipo=reporte|evento`. | 07, 08 |

**`POST /api/reportes`**
```json
{ "tipo": "riesgo_comunitario", "descripcion": "Cuadra entera sin luz desde hace una semana",
  "direccion": "San Martín 1500", "barrio": "Centro", "lat": -26.8301, "lng": -65.2150 }
```
- `tipo`: catálogo. `descripcion`: 10 a 500 caracteres. `direccion` y `barrio`: opcionales, hasta 200 y 80. `lat`/`lng`: dentro de la caja de Tucumán.
- **201** `{ "id": 45, "estado": "pendiente" }`. No aparece en `GET /api/reportes` hasta que un administrador lo aprueba.
- Límite (RF-09): `LIMITE_REPORTES_DIA` envíos en 24 horas (5 por defecto). Cuentan todos los del usuario en esa ventana, también los cancelados o ya revisados.
- Errores: 400 `DATOS_INVALIDOS`, 401 `NO_AUTENTICADO`, 403 `EMAIL_NO_VERIFICADO`, 403 `SIN_PERMISO` (administrador o falta el encabezado CSRF), 403 `USUARIO_BLOQUEADO`, 429 `LIMITE_DIARIO`.

**`POST /api/eventos`**
```json
{ "nombre": "Peña en el Parque", "categoria": "musica", "modalidad": "a_la_gorra",
  "descripcion": "Peña folclórica abierta", "lugar_nombre": "Anfiteatro del Parque 9 de Julio",
  "direccion": "Av. Soldati s/n", "barrio": "Parque 9 de Julio", "lugar_id": null,
  "lat": -26.8317, "lng": -65.1876,
  "inicio": "2026-11-07T20:00:00-03:00", "fin": "2026-11-07T23:30:00-03:00",
  "flyer_url": "https://...", "etiquetas": ["folclore", "familia"] }
```
- `nombre`: 3 a 150. `categoria` y `modalidad`: catálogos. `descripcion`: 10 a 2000. `lugar_nombre` (3 a 150), `direccion` (3 a 200) y `barrio` (2 a 80): obligatorios. `lugar_id`: opcional; si viene, tiene que ser un lugar activo del mapa. `lat`/`lng`: dentro de la caja de Tucumán. `inicio`: fecha y hora con zona, en el futuro y dentro del próximo año. `fin`: opcional, posterior a `inicio` y hasta 31 días después. `flyer_url`: opcional, `http`/`https`. `etiquetas`: hasta 5 distintas, de 2 a 30 caracteres; las repetidas (sin distinguir mayúsculas) se juntan.
- **201** `{ "id": 9, "estado": "pendiente" }`. No aparece en `GET /api/eventos` hasta que un administrador la aprueba.
- Límite (RF-09): `LIMITE_EVENTOS_DIA` propuestas en 24 horas (3 por defecto), aparte del de reportes. Cuentan también las canceladas o ya revisadas.
- Errores: los mismos que `POST /api/reportes`. Un `lugar_id` inexistente o inactivo responde 400 `DATOS_INVALIDOS` con `campo: "lugar_id"`.

**`POST /api/reportes/:id/confirmar`** (sin cuerpo) → **201** `{ "confirmaciones": 5 }`, con el total actualizado. No cambia el estado de moderación del reporte (RF-14).
- Errores: 404 `NO_ENCONTRADO` (inexistente, pendiente, rechazado, resuelto, retirado o aprobado hace más de 24 hs), 403 `SIN_PERMISO` (reporte propio, administrador o falta el encabezado CSRF), 409 `YA_CONFIRMADO` (también si llegan dos solicitudes a la vez), 401 `NO_AUTENTICADO`, 403 `EMAIL_NO_VERIFICADO`, 403 `USUARIO_BLOQUEADO`.

**`PUT /api/reportes/:id`** y **`PUT /api/eventos/:id`** reciben el mismo cuerpo y las mismas reglas que el alta (reemplazo completo) y responden **200** `{ "id": 45, "estado": "pendiente" }`. **`POST /api/reportes/:id/cancelar`** y **`POST /api/eventos/:id/cancelar`** no llevan cuerpo y responden **200** `{ "id": 45, "estado": "cancelado" }`.
- Editar o cancelar algo que no está `pendiente` devuelve 409 `TRANSICION_INVALIDA` (`cancelado` es final: no se edita ni se reabre); hacerlo sobre algo ajeno, 403 `SIN_PERMISO`; sobre algo que no existe, 404 `NO_ENCONTRADO`.
- Editar no cuenta como envío nuevo para el límite diario y cancelar no libera cupo (RF-09). Editar borra la pre-validación con IA, si la había (RF-20).
- Errores además: los de `POST /api/reportes` y `POST /api/eventos` (salvo el 429).

**`GET /api/mis-envios?tipo=reporte&pagina=1&por_pagina=20`** (Sesión; del más nuevo al más viejo)
```json
{ "datos": [{ "tipo": "reporte", "id": 45, "estado": "rechazado", "motivo_rechazo": "Falta la dirección",
              "creado_en": "2026-10-20T15:00:00.000Z", "actualizado_en": "2026-10-20T16:10:00.000Z",
              "contenido": { "tipo": "riesgo_comunitario", "descripcion": "Cuadra entera sin luz desde hace una semana",
                             "direccion": "San Martín 1500", "barrio": "Centro", "lat": -26.8301, "lng": -65.215 } }],
  "pagina": 1, "por_pagina": 20, "total": 1 }
```
- `tipo` es `reporte` o `evento`. `contenido` tiene los mismos campos que el formulario de alta de cada uno, para precargarlo al editar.
- Solo devuelve lo del usuario de la sesión. `?tipo=` fuera de `reporte`/`evento` responde 400 `DATOS_INVALIDOS`; vacío equivale a no filtrar.

---

## 5. Administración (`/api/admin`, acceso Admin)

### Reportes
| Método y ruta | Descripción | RF |
| :--- | :--- | :--- |
| `GET /api/admin/reportes` | Lista paginada. Filtros `?estado=&tipo=&ia_veredicto=&desde=&hasta=`. Incluye autor (id y nombre), confirmaciones y datos de IA. | 15 |
| `GET /api/admin/reportes/:id` | Detalle completo. | 15 |
| `POST /api/admin/reportes/:id/aprobar` | `pendiente` → `aprobado`. | 08 |
| `POST /api/admin/reportes/:id/rechazar` | `pendiente` → `rechazado`. Cuerpo `{ "motivo": "..." }` (5 a 300 caracteres, obligatorio). | 08 |
| `POST /api/admin/reportes/:id/resolver` | `aprobado` → `resuelto`. | 08 |
| `POST /api/admin/reportes/:id/retirar` | `aprobado` → `retirado`. Sin cuerpo. | 13 |

- **Lista y detalle** devuelven cada reporte con todos sus campos: `id`, `tipo`, `descripcion`, `direccion`, `barrio`, `lat`, `lng`, `estado`, `activa` (si hoy se ve en el mapa: aprobado hace menos de 24 hs, RF-11), `autor` (`{ "id", "nombre" }`, o `null` si borró su cuenta; nunca el email), `confirmaciones`, `creado_en`, `actualizado_en`, `aprobado_en`, `resuelto_en`, `revisado_por` y `retirado_por` (`{ "id", "nombre" }` o `null`), `revisado_en`, `motivo_rechazo`, `retirado_en` y los campos `ia_veredicto`, `ia_confianza`, `ia_motivo`, `ia_analizado_en` (en `null` hasta la Fase 6).
- La lista va del más nuevo al más viejo. `desde` y `hasta` filtran por la fecha de envío (`creado_en`), con el mismo formato que en `GET /api/eventos`. Un filtro vacío equivale a no mandarlo; un valor fuera de la lista responde 400.
- Las acciones no llevan cuerpo (salvo el `motivo` del rechazo) y responden **200** con el reporte actualizado, en el mismo formato que el detalle. Aprobar registra `revisado_por`, `revisado_en` y `aprobado_en` (desde ahí corren las 24 hs del mapa); rechazar, `revisado_por`, `revisado_en` y `motivo_rechazo`; resolver, `resuelto_en`; retirar, `retirado_por` y `retirado_en`. Una alerta aprobada que ya venció también se puede resolver o retirar.
- Errores: 400 `DATOS_INVALIDOS` (motivo ausente o fuera de 5 a 300 caracteres, id inválido), 404 `NO_ENCONTRADO`, 409 `TRANSICION_INVALIDA` (la acción no vale desde el estado actual; también si dos admins actúan a la vez sobre el mismo reporte).

### Eventos
| Método y ruta | Descripción | RF |
| :--- | :--- | :--- |
| `GET /api/admin/eventos` | Lista paginada. Filtros `?estado=&categoria=&archivado=true|false&ia_veredicto=`. | 15, 12 |
| `GET /api/admin/eventos/:id` | Detalle completo. | 15 |
| `POST /api/admin/eventos` | Crea un evento ya `aprobado`. Mismo cuerpo que la propuesta. | 13 |
| `PUT /api/admin/eventos/:id` | Edita un evento `pendiente` o `aprobado`; sigue en su estado. | 13 |
| `POST /api/admin/eventos/:id/aprobar` | `pendiente` → `aprobado`. | 08 |
| `POST /api/admin/eventos/:id/rechazar` | `pendiente` → `rechazado` con `{ "motivo": "..." }`. | 08 |
| `POST /api/admin/eventos/:id/retirar` | `aprobado` → `retirado`. | 13 |

- **Lista y detalle** devuelven cada evento con los campos de la propuesta (`nombre`, `categoria`, `modalidad`, `descripcion`, `lugar_nombre`, `direccion`, `barrio`, `lugar_id`, `lat`, `lng`, `inicio`, `fin`, `flyer_url`, `etiquetas`) más `id`, `estado`, `vigente` (si hoy se ve en la agenda), `archivado` (pasaron 24 hs desde que sucedió, RF-12, en cualquier estado), `autor` (`{ "id", "nombre" }` o `null`), `creado_en`, `actualizado_en`, `revisado_por` y `retirado_por` (`{ "id", "nombre" }` o `null`), `revisado_en`, `motivo_rechazo`, `retirado_en` y los campos `ia_*`. La lista va del más nuevo al más viejo; un filtro vacío equivale a no mandarlo.
- **`POST`** valida igual que `POST /api/eventos` (también que el `lugar_id` sea un lugar activo), no pasa por el límite diario y responde **201** con el evento, que nace `aprobado` con el admin como `autor` y `revisado_por`.
- **`PUT`** es un reemplazo completo con las mismas reglas, salvo que un evento `aprobado` que ya empezó se puede guardar con su mismo `inicio` en el pasado (para corregirlo mientras sucede). No cambia el estado ni el autor y borra la pre-validación con IA. Sobre un evento `rechazado`, `cancelado`, `retirado` o archivado responde 409 `TRANSICION_INVALIDA`.
- Aprobar una propuesta que ya está archivada (pasaron 24 hs desde que sucedió) responde 409 `TRANSICION_INVALIDA`: hay que rechazarla.
- Las acciones responden **200** con el evento actualizado. Aprobar y rechazar registran `revisado_por` y `revisado_en` (y el `motivo_rechazo`, de 5 a 300 caracteres); retirar, `retirado_por` y `retirado_en`, también sobre un evento ya archivado. Los eventos no tienen `resuelto`.
- Errores: los mismos que en reportes (400, 404, 409 `TRANSICION_INVALIDA`).

### Lugares
| Método y ruta | Descripción | RF |
| :--- | :--- | :--- |
| `GET /api/admin/lugares` | Lista paginada, incluye inactivos. | 13 |
| `POST /api/admin/lugares` | Alta. | 13 |
| `PUT /api/admin/lugares/:id` | Edición. | 13 |
| `PATCH /api/admin/lugares/:id/activo` | `{ "activo": false }` para ocultarlo del mapa sin borrarlo. | 13 |

- **Cuerpo de `POST` y `PUT`:** `nombre` (2 a 150, único) y `categoria` (catálogo `categorias_lugar`) obligatorios; `lat` y `lng` obligatorios y dentro de la caja de Tucumán (RF-10); opcionales `descripcion`, `contenido_historico`, `fuente`, `direccion`, `barrio`, `horarios`, `precio_entrada` (hasta 200) e `imagen_url` (solo `http`/`https`); `localidad` por defecto `San Miguel de Tucumán`. Un texto vacío equivale a no mandarlo.
- `PUT` reemplaza el lugar entero: un campo opcional que no se manda queda en `null`. `activo` solo cambia con el `PATCH`.
- Responden el lugar con todos sus campos más `activo`, `creado_en` y `actualizado_en` (`POST` con **201**). Un nombre repetido responde 400 `DATOS_INVALIDOS` con el detalle en `nombre`; un id inexistente, 404.
- Un lugar desactivado deja de salir en `GET /api/lugares` y en su detalle (404) hasta que se reactiva.

### Usuarios
| Método y ruta | Descripción | RF |
| :--- | :--- | :--- |
| `GET /api/admin/usuarios` | Lista paginada. Filtros `?bloqueado=&q=` (nombre o email). Incluye cantidad de envíos y de rechazos. | 16 |
| `POST /api/admin/usuarios/:id/bloquear` | Bloquea y rechaza sus pendientes con motivo "Usuario bloqueado". No se puede sobre uno mismo. | 16 |
| `POST /api/admin/usuarios/:id/desbloquear` | Desbloquea. | 16 |

### Resumen
| Método y ruta | Descripción | RF |
| :--- | :--- | :--- |
| `GET /api/admin/resumen` | Contadores para el panel: pendientes de reportes y de eventos, alertas activas, usuarios bloqueados. | 15 |

---

## 6. Integración con n8n (evolutivo, RF-20)

| Método y ruta | Acceso | Descripción |
| :--- | :--- | :--- |
| `POST /api/ia/resultado` | Encabezado `X-N8N-Secret` igual a `N8N_SECRET` | n8n devuelve `{ "tipo": "reporte"|"evento", "id": 45, "veredicto": "dudoso", "confianza": 0.62, "motivo": "..." }`. Solo guarda los campos `ia_*`; nunca cambia el estado. |

El backend llama a `N8N_WEBHOOK_URL` después de crear un reporte o evento, sin esperar la respuesta. Si la llamada falla, el elemento queda "sin analizar" (`ia_veredicto` en `NULL`).

---

## 7. Salud del servicio

`GET /api/salud` (Público) → **200** `{ "ok": true }`. Lo usa el frontend para detectar si el backend está "despertando" (RF-06) y sirve para despertarlo antes de una demostración.
