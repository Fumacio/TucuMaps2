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
- **Sesión:** cookie `tm_sesion` (`httpOnly`, `Secure`, `SameSite=Lax`) con un JWT `{ sub: id, rol, v: token_version }`. Dura 90 días y el servidor la renueva en cada solicitud autenticada. El frontend envía las solicitudes con `credentials: 'include'`.
- **CSRF:** toda solicitud `POST`, `PUT`, `PATCH` o `DELETE` debe llevar el encabezado `X-Requested-With: TucuMaps`; si falta, se responde `403`.
- **Validación:** el cuerpo y los parámetros se validan con `zod`. Los campos desconocidos se descartan.
- **Paginación:** las listas aceptan `?pagina=1&por_pagina=20` (máximo 100) y responden `{ "datos": [...], "pagina": 1, "por_pagina": 20, "total": 57 }`.
- **Rate limiting general:** 100 solicitudes por minuto por IP.

### Niveles de acceso

| Nivel | Significado |
| :--- | :--- |
| **Público** | Sin sesión. |
| **Sesión** | Usuario con sesión válida y no bloqueado. |
| **Verificado** | Sesión + email verificado. |
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

`mensaje` siempre está en español y se puede mostrar tal cual al usuario (RF-21). `detalles` aparece solo en errores de validación.

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
| 409 | `YA_CONFIRMADO` | Segunda confirmación de la misma alerta (RF-19). |
| 409 | `TRANSICION_INVALIDA` | Cambio de estado no permitido (ej. editar un reporte ya aprobado). |
| 429 | `LIMITE_DIARIO` | Se superó el límite de RF-14. |
| 429 | `DEMASIADOS_INTENTOS` | 5 logins fallidos en 15 minutos, o rate limiting general. Incluye el encabezado `Retry-After`. |
| 500 | `ERROR_INTERNO` | Error no previsto (el detalle solo va al log del servidor). |

---

## 2. Autenticación y cuenta

| Método y ruta | Acceso | Descripción | RF |
| :--- | :--- | :--- | :--- |
| `POST /api/auth/registro` | Público | Crea un usuario `ciudadano` y envía el email de verificación. | 01, 12, 13 |
| `POST /api/auth/login` | Público | Inicia sesión y setea la cookie. | 01 |
| `POST /api/auth/logout` | Sesión | Borra la cookie. | 01 |
| `POST /api/auth/logout-todos` | Sesión | Cierra la sesión en todos los dispositivos (incrementa `token_version`). | 01 |
| `GET /api/auth/me` | Sesión | Devuelve el usuario actual. | 01 |
| `POST /api/auth/verificar-email` | Público | Confirma el email con el token del enlace. | 12 |
| `POST /api/auth/reenviar-verificacion` | Sesión | Reenvía el enlace (máximo 3 por hora). | 12 |
| `POST /api/auth/recuperar` | Público | Envía el enlace de recuperación. | 12 |
| `POST /api/auth/restablecer` | Público | Cambia la contraseña con el token del enlace. | 12 |
| `PATCH /api/cuenta/password` | Sesión | Cambia la contraseña (pide la actual). | 01 |
| `DELETE /api/cuenta` | Sesión | Da de baja la cuenta (pide la contraseña). | 23 |

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

**`POST /api/auth/recuperar`** `{ "email": "..." }` → siempre **200** `{ "ok": true }`, exista o no el email (no se revela qué cuentas existen).

**`POST /api/auth/restablecer`** `{ "token": "...", "password": "..." }` → **200**. Incrementa `token_version` (cierra las otras sesiones). Error 400 `TOKEN_INVALIDO`.

**`DELETE /api/cuenta`** `{ "password": "..." }` → **204** y borra la cookie. Sus reportes y eventos quedan sin autor (RF-23).

---

## 3. Contenido público del mapa

| Método y ruta | Acceso | Descripción | RF |
| :--- | :--- | :--- | :--- |
| `GET /api/lugares` | Público | Lugares activos. Filtro `?categoria=`. | 02 |
| `GET /api/lugares/:id` | Público | Detalle con contenido histórico. | 02 |
| `GET /api/eventos` | Público | Eventos vigentes (`eventos_vigentes`). Filtros `?categoria=&desde=&hasta=`. Ordenados por `inicio`. | 02, 22 |
| `GET /api/eventos/:id` | Público | Detalle de un evento vigente. | 02 |
| `GET /api/reportes` | Público | Alertas activas (`reportes_activos`), con la cantidad de confirmaciones. Nunca incluye al autor. | 02, 16 |
| `GET /api/catalogos` | Público | Valores y etiquetas de los catálogos para armar formularios y filtros. | 15 |

Las listas públicas del mapa no se paginan: devuelven todos los elementos visibles (el volumen es acotado por la vigencia de 24 hs y el clustering resuelve la visualización).

**Ejemplo `GET /api/reportes`**
```json
[{ "id": 31, "tipo": "arrebato_motochorro", "descripcion": "Arrebatos frecuentes en la parada",
   "direccion": "Av. Mate de Luna 2400", "barrio": "Barrio Norte",
   "lat": -26.8235, "lng": -65.2301, "aprobado_en": "2026-10-20T14:05:00-03:00",
   "confirmaciones": 4 }]
```

---

## 4. Envíos del ciudadano

| Método y ruta | Acceso | Descripción | RF |
| :--- | :--- | :--- | :--- |
| `POST /api/reportes` | Verificado | Envía un reporte (queda `pendiente`). | 03, 14, 15 |
| `PUT /api/reportes/:id` | Verificado, autor | Edita mientras está `pendiente`. | 03 |
| `POST /api/reportes/:id/cancelar` | Verificado, autor | Cancela mientras está `pendiente`. | 03 |
| `POST /api/reportes/:id/confirmar` | Verificado | Confirma una alerta activa ajena (una vez). | 19 |
| `POST /api/eventos` | Verificado | Propone un evento (queda `pendiente`). | 03, 14, 15 |
| `PUT /api/eventos/:id` | Verificado, autor | Edita mientras está `pendiente`. | 03 |
| `POST /api/eventos/:id/cancelar` | Verificado, autor | Cancela mientras está `pendiente`. | 03 |
| `GET /api/mis-envios` | Sesión | Reportes y eventos propios con su estado y motivo de rechazo. Filtro `?tipo=reporte|evento`. | 03, 04 |

**`POST /api/reportes`**
```json
{ "tipo": "zona_sin_iluminacion", "descripcion": "Cuadra entera sin luz desde hace una semana",
  "direccion": "San Martín 1500", "barrio": "Centro", "lat": -26.8301, "lng": -65.2150 }
```
- `tipo`: catálogo. `descripcion`: 10 a 500 caracteres. `direccion` y `barrio`: opcionales, hasta 200 y 80. `lat`/`lng`: dentro de la caja de Tucumán.
- **201** `{ "id": 45, "estado": "pendiente" }`.
- Errores: 400, 403 `EMAIL_NO_VERIFICADO`, 429 `LIMITE_DIARIO`.

**`POST /api/eventos`**
```json
{ "nombre": "Peña en el Parque", "categoria": "musica", "modalidad": "a_la_gorra",
  "descripcion": "Peña folclórica abierta", "lugar_nombre": "Anfiteatro del Parque 9 de Julio",
  "direccion": "Av. Soldati s/n", "barrio": "Parque 9 de Julio", "lugar_id": null,
  "lat": -26.8317, "lng": -65.1876,
  "inicio": "2026-11-07T20:00:00-03:00", "fin": "2026-11-07T23:30:00-03:00",
  "flyer_url": "https://...", "etiquetas": ["folclore", "familia"] }
```
- `nombre`: 3 a 150. `descripcion`: 10 a 2000. `inicio`: en el futuro. `fin`: opcional, posterior a `inicio`. `flyer_url`: opcional, `http`/`https`. `etiquetas`: hasta 5, de 2 a 30 caracteres.
- **201** `{ "id": 9, "estado": "pendiente" }`.

**`POST /api/reportes/:id/confirmar`** → **201** `{ "confirmaciones": 5 }`. Errores: 403 `SIN_PERMISO` (reporte propio), 404 (no activo), 409 `YA_CONFIRMADO`.

Editar o cancelar algo que no está `pendiente` devuelve 409 `TRANSICION_INVALIDA`; hacerlo sobre algo ajeno, 403.

---

## 5. Administración (`/api/admin`, acceso Admin)

### Reportes
| Método y ruta | Descripción | RF |
| :--- | :--- | :--- |
| `GET /api/admin/reportes` | Lista paginada. Filtros `?estado=&tipo=&ia_veredicto=&desde=&hasta=`. Incluye autor (id y nombre), confirmaciones y datos de IA. | 10 |
| `GET /api/admin/reportes/:id` | Detalle completo. | 10 |
| `POST /api/admin/reportes/:id/aprobar` | `pendiente` → `aprobado`. | 04 |
| `POST /api/admin/reportes/:id/rechazar` | `pendiente` → `rechazado`. Cuerpo `{ "motivo": "..." }` (5 a 300 caracteres, obligatorio). | 04 |
| `POST /api/admin/reportes/:id/resolver` | `aprobado` → `resuelto`. | 04 |
| `POST /api/admin/reportes/:id/retirar` | `aprobado` → `retirado`. Sin cuerpo. | 05 |

### Eventos
| Método y ruta | Descripción | RF |
| :--- | :--- | :--- |
| `GET /api/admin/eventos` | Lista paginada. Filtros `?estado=&categoria=&archivado=true|false&ia_veredicto=`. | 10, 22 |
| `GET /api/admin/eventos/:id` | Detalle completo. | 10 |
| `POST /api/admin/eventos` | Crea un evento ya `aprobado`. Mismo cuerpo que la propuesta. | 05 |
| `PUT /api/admin/eventos/:id` | Edita un evento `pendiente` o `aprobado`; sigue en su estado. | 05 |
| `POST /api/admin/eventos/:id/aprobar` | `pendiente` → `aprobado`. | 04 |
| `POST /api/admin/eventos/:id/rechazar` | `pendiente` → `rechazado` con `{ "motivo": "..." }`. | 04 |
| `POST /api/admin/eventos/:id/retirar` | `aprobado` → `retirado`. | 05 |

### Lugares
| Método y ruta | Descripción | RF |
| :--- | :--- | :--- |
| `GET /api/admin/lugares` | Lista paginada, incluye inactivos. | 05 |
| `POST /api/admin/lugares` | Alta. | 05 |
| `PUT /api/admin/lugares/:id` | Edición. | 05 |
| `PATCH /api/admin/lugares/:id/activo` | `{ "activo": false }` para ocultarlo del mapa sin borrarlo. | 05 |

### Usuarios
| Método y ruta | Descripción | RF |
| :--- | :--- | :--- |
| `GET /api/admin/usuarios` | Lista paginada. Filtros `?bloqueado=&q=` (nombre o email). Incluye cantidad de envíos y de rechazos. | 09 |
| `POST /api/admin/usuarios/:id/bloquear` | Bloquea y rechaza sus pendientes con motivo "Usuario bloqueado". No se puede sobre uno mismo. | 09 |
| `POST /api/admin/usuarios/:id/desbloquear` | Desbloquea. | 09 |

### Resumen
| Método y ruta | Descripción | RF |
| :--- | :--- | :--- |
| `GET /api/admin/resumen` | Contadores para el panel: pendientes de reportes y de eventos, alertas activas, usuarios bloqueados. | 10 |

---

## 6. Integración con n8n (evolutivo, RF-11)

| Método y ruta | Acceso | Descripción |
| :--- | :--- | :--- |
| `POST /api/ia/resultado` | Encabezado `X-N8N-Secret` igual a `N8N_SECRET` | n8n devuelve `{ "tipo": "reporte"|"evento", "id": 45, "veredicto": "dudoso", "confianza": 0.62, "motivo": "..." }`. Solo guarda los campos `ia_*`; nunca cambia el estado. |

El backend llama a `N8N_WEBHOOK_URL` después de crear un reporte o evento, sin esperar la respuesta. Si la llamada falla, el elemento queda "sin analizar" (`ia_veredicto` en `NULL`).

---

## 7. Salud del servicio

`GET /api/salud` (Público) → **200** `{ "ok": true }`. Lo usa el frontend para detectar si el backend está "despertando" (RF-21) y sirve para despertarlo antes de una demostración.
