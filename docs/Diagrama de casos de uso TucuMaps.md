---
tags:
  - facultad
  - tfi
  - tucumaps
  - uml
  - casos-de-uso
fecha: 2026-09-28
materia: Trabajo Final Integrador
tipo: diseno-uml
---

# 📐 Diagrama de Casos de Uso — TucuMaps

> [!info] Documentación Relacionada
> - **Proyecto Central:** [[TucuMaps|TucuMaps - Hub Principal]]
> - **Especificación de Requerimientos:** [[SRS preliminar|SRS Preliminar]]

---

## 👥 1. Definición de Actores del Sistema

1. **Usuario Anónimo (Turista):**
   * Perfil sin credenciales. Su interacción es puramente de consulta e informativa.
2. **Usuario Registrado (Ciudadano):**
   * Cuenta activa. Puede consultar información, enviar reportes de seguridad, proponer eventos y confirmar alertas publicadas como aporte comunitario.
3. **Administrador del Sistema:**
   * Rol privilegiado responsable de la gobernanza, moderación del contenido y mantenimiento de datos maestros.

---

## 📊 2. Diagrama de Casos de Uso (UML)

```mermaid
flowchart LR
    subgraph Actores
        Anonimo["👤 Turista (Anónimo)"]
        Ciudadano["👤 Ciudadano (Registrado)"]
        Admin["🛡️ Administrador"]
    end

    subgraph TucuMaps["Límite del Sistema: TucuMaps"]
        CU1["Visualizar Mapa y Zonas"]
        CU2["Consultar Detalle Turístico"]
        CU3["Ver Próximos Eventos"]
        CU4["Iniciar Sesión / Registro"]
        CU5["Enviar Reporte de Seguridad"]
        CU6["Confirmar Alerta Comunitaria"]
        CU7["Dar de Alta Punto Turístico"]
        CU8["Moderar / Eliminar Alertas"]
        CU9["Gestionar / Bloquear Usuarios"]
        CU10["Revisar propuestas de eventos"]
        CU11["Proponer evento"]
        CU12["Acceder al panel de administración"]
        CU13["Ver sugerencia de la IA (evolutivo)"]
        CU14["Recuperar contraseña / verificar email"]
        CU15["Editar o cancelar envío pendiente"]
        CU16["Dar de baja la cuenta"]
        CU17["Crear / editar / retirar eventos"]
    end

    %% Relaciones de actores
    Anonimo --> CU1
    Anonimo --> CU2
    Anonimo --> CU3
    Anonimo --> CU4
    Anonimo --> CU14

    Ciudadano --> CU1
    Ciudadano --> CU2
    Ciudadano --> CU3
    Ciudadano --> CU5
    Ciudadano --> CU6
    Ciudadano --> CU11
    Ciudadano --> CU15
    Ciudadano --> CU16

    Admin --> CU7
    Admin --> CU8
    Admin --> CU9
    Admin --> CU10
    Admin --> CU12
    Admin --> CU13
    Admin --> CU17
```

Los reportes de seguridad y las propuestas de eventos enviados por usuarios quedan pendientes de revisión. Solo el administrador puede aprobarlos para su publicación; las confirmaciones comunitarias no reemplazan esta aprobación.

---

## 📋 3. Matriz de Permisos y Casos de Uso

| Caso de Uso | Turista (Anónimo) | Ciudadano (Registrado) | Administrador |
| :--- | :---: | :---: | :---: |
| **Visualizar Mapa Interactivo** | ✅ | ✅ | ✅ |
| **Consultar Puntos Turísticos y Eventos** | ✅ | ✅ | ✅ |
| **Registrarse e Iniciar Sesión** | ✅ | — | — |
| **Verificar Email y Recuperar Contraseña** | ✅ | ✅ | ✅ |
| **Enviar Reportes de Seguridad** | ❌ | ✅ | ❌ |
| **Confirmar Alertas Comunitarias Publicadas** | ❌ | ✅ | — |
| **Proponer Eventos** | ❌ | ✅ | — |
| **Editar o Cancelar Envíos Pendientes Propios** | ❌ | ✅ | — |
| **Dar de Baja la Propia Cuenta** | ❌ | ✅ | — |
| **Crear, Editar y Retirar Eventos** | ❌ | ❌ | ✅ |
| **Revisar y aprobar propuestas de eventos** | ❌ | ❌ | ✅ |
| **Alta y Edición de Sitios Turísticos** | ❌ | ❌ | ✅ |
| **Moderar y Descartar Reportes Falsos** | ❌ | ❌ | ✅ |
| **Bloquear Usuarios Reincidentes** | ❌ | ❌ | ✅ |
| **Acceder al Panel de Administración** | ❌ | ❌ | ✅ |
| **Ver Sugerencia de la IA (evolutivo)** | ❌ | ❌ | ✅ |
