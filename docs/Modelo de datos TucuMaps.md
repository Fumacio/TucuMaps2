---
tags:
  - facultad
  - tfi
  - tucumaps
  - base-de-datos
  - uml
fecha: 2026-10-12
materia: Trabajo Final Integrador
tipo: diseno-datos
---

# 🗄️ Modelo de Datos y Diagramas de Estado — TucuMaps

> [!info] Documentación Relacionada
> - **Proyecto Central:** [[TucuMaps|TucuMaps - Hub Principal]]
> - **Requerimientos:** [[SRS preliminar|SRS Preliminar]]
> - **Script SQL:** `schema.sql` (fuente de verdad del modelo)
> - **API:** [[API TucuMaps|Especificación de la API REST]]

---

## 1. Diagrama Entidad-Relación

```mermaid
erDiagram
    usuarios ||--o{ tokens_usuario : "tiene"
    usuarios |o--o{ reportes : "envía"
    usuarios |o--o{ eventos : "propone"
    usuarios |o--o{ lugares : "crea (admin)"
    usuarios ||--o{ confirmaciones : "confirma"
    reportes ||--o{ confirmaciones : "recibe"
    lugares |o--o{ eventos : "sede opcional"

    usuarios {
        bigint id PK
        varchar nombre
        varchar email UK
        varchar password_hash
        rol_usuario rol
        boolean email_verificado
        boolean bloqueado
        int token_version
        varchar terminos_version
        timestamptz terminos_aceptados_en
        timestamptz creado_en
    }
    tokens_usuario {
        bigint id PK
        bigint usuario_id FK
        tipo_token tipo
        varchar token_hash UK
        timestamptz expira_en
        timestamptz usado_en
        timestamptz creado_en
    }
    lugares {
        bigint id PK
        varchar nombre UK
        varchar categoria
        text descripcion
        text contenido_historico
        varchar fuente
        varchar direccion
        varchar localidad
        varchar barrio
        varchar horarios
        varchar precio_entrada
        varchar imagen_url
        numeric lat
        numeric lng
        boolean activo
        bigint creado_por FK
    }
    eventos {
        bigint id PK
        varchar nombre
        varchar categoria
        varchar modalidad
        text descripcion
        varchar lugar_nombre
        varchar direccion
        varchar barrio
        bigint lugar_id FK
        numeric lat
        numeric lng
        timestamptz inicio
        timestamptz fin
        varchar flyer_url
        text_array etiquetas
        estado_revision estado
        bigint propuesto_por FK
        bigint revisado_por FK
        timestamptz revisado_en
        text motivo_rechazo
        bigint retirado_por FK
        timestamptz retirado_en
        veredicto_ia ia_veredicto
    }
    reportes {
        bigint id PK
        bigint usuario_id FK
        varchar tipo
        text descripcion
        varchar direccion
        varchar barrio
        numeric lat
        numeric lng
        estado_reporte estado
        timestamptz aprobado_en
        timestamptz resuelto_en
        bigint revisado_por FK
        timestamptz revisado_en
        text motivo_rechazo
        bigint retirado_por FK
        timestamptz retirado_en
        veredicto_ia ia_veredicto
    }
    confirmaciones {
        bigint id PK
        bigint reporte_id FK
        bigint usuario_id FK
        timestamptz creado_en
    }
```

![ERD TucuMaps](img/ERD_TucuMaps.png)

> [!note] Imagen
> `img/ERD_TucuMaps.png` se generó a partir de este diagrama (v1.7). Las columnas `ia_confianza`, `ia_motivo`, `ia_analizado_en`, `creado_en` y `actualizado_en` se omiten en el gráfico por espacio; el detalle completo está en `schema.sql`.

**Decisiones de diseño**
- `reportes.usuario_id` y `eventos.propuesto_por` admiten `NULL` para poder borrar cuentas y aplicar la retención de 1 año sin perder el historial (RF-24).
- Los catálogos (tipo de reporte, categorías, modalidad) son `CHECK` sobre texto: simples de validar y de mostrar; agregar un valor requiere una migración.
- Las vistas `reportes_activos` y `eventos_vigentes` concentran las reglas de vigencia (RF-11, RF-12) y nunca exponen al autor.
- Las columnas `ia_*` existen desde el inicio aunque la IA sea evolutiva, para no migrar después.

---

## 2. Estados de un reporte de seguridad

```mermaid
stateDiagram-v2
    [*] --> pendiente : ciudadano envía
    pendiente --> pendiente : autor edita
    pendiente --> cancelado : autor cancela
    pendiente --> aprobado : admin aprueba
    pendiente --> rechazado : admin rechaza (con motivo)\no se bloquea al autor
    aprobado --> resuelto : admin marca resuelto
    aprobado --> retirado : admin retira
    cancelado --> [*]
    rechazado --> [*]
    resuelto --> [*]
    retirado --> [*]
```

| Transición | Quién | Registra |
| :--- | :--- | :--- |
| → `pendiente` | Ciudadano con email verificado y no bloqueado, dentro del límite diario | `creado_en` |
| `pendiente` → `pendiente` (edición) | Autor | `actualizado_en` |
| `pendiente` → `cancelado` | Autor | `actualizado_en` |
| `pendiente` → `aprobado` | Admin | `revisado_por`, `revisado_en`, `aprobado_en` |
| `pendiente` → `rechazado` | Admin (motivo obligatorio) o el sistema al bloquear al autor ("Usuario bloqueado") | `revisado_por`, `revisado_en`, `motivo_rechazo` |
| `aprobado` → `resuelto` | Admin | `resuelto_en` |
| `aprobado` → `retirado` | Admin (sin motivo) | `retirado_por`, `retirado_en` |

- Un reporte `aprobado` se ve en el mapa solo durante 24 hs desde `aprobado_en` (RF-11); después sigue `aprobado` pero ya no está activo.
- Los estados `cancelado`, `rechazado`, `resuelto` y `retirado` son finales: no se reabren.
- Las confirmaciones comunitarias (RF-14) solo se aceptan sobre reportes activos y no cambian el estado.

---

## 3. Estados de un evento

```mermaid
stateDiagram-v2
    [*] --> pendiente : ciudadano propone
    [*] --> aprobado : admin crea directamente
    pendiente --> pendiente : autor edita
    pendiente --> cancelado : autor cancela
    pendiente --> aprobado : admin aprueba
    pendiente --> rechazado : admin rechaza (con motivo)\no se bloquea al autor
    aprobado --> aprobado : admin edita (sigue publicado)
    aprobado --> retirado : admin retira (ej. suspendido)
    cancelado --> [*]
    rechazado --> [*]
    retirado --> [*]
```

- Un evento `aprobado` se archiva solo, sin cambiar de estado, 24 hs después de `fin` (o de `inicio` si no tiene fin) (RF-12). Retirarlo es para casos excepcionales, como un evento suspendido o con datos incorrectos.
- Los estados `cancelado`, `rechazado` y `retirado` son finales.

---

## 4. Estados de un usuario

```mermaid
stateDiagram-v2
    [*] --> sin_verificar : se registra
    sin_verificar --> activo : confirma el email
    activo --> bloqueado : admin bloquea
    sin_verificar --> bloqueado : admin bloquea
    bloqueado --> activo : admin desbloquea
    activo --> [*] : da de baja su cuenta
    sin_verificar --> [*] : da de baja su cuenta
```

- `sin_verificar` puede iniciar sesión y consultar, pero no enviar reportes, proponer eventos ni confirmar alertas (RF-03).
- Al bloquear: la sesión se corta en la siguiente solicitud y los envíos `pendiente` pasan a `rechazado` (RF-16).
- Un administrador no puede bloquearse ni darse de baja a sí mismo si es el único administrador.

---

## 5. Secuencia: envío y moderación de un reporte

```mermaid
sequenceDiagram
    actor C as Ciudadano
    participant F as Frontend
    participant A as API
    participant DB as PostgreSQL
    actor AD as Administrador
    C->>F: Completa el formulario en el mapa
    F->>A: POST /api/reportes
    A->>DB: Verifica sesión, email verificado, bloqueo y límite diario
    A->>DB: INSERT reporte (pendiente)
    A-->>F: 201 Creado
    F-->>C: "Recibimos tu reporte, lo revisaremos"
    AD->>F: Abre la cola de pendientes en /admin
    F->>A: GET /api/admin/reportes?estado=pendiente
    AD->>F: Aprueba el reporte
    F->>A: POST /api/admin/reportes/:id/aprobar
    A->>DB: estado = aprobado, aprobado_en = now()
    Note over DB: Visible en reportes_activos durante 24 hs
```
