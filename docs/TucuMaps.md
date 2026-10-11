---
tags:
  - facultad
  - tfi
  - tucumaps
  - proyecto
  - fullstack
fecha: 2026-09-28
materia: Trabajo Final Integrador
tipo: proyecto-hub
---

# 🗺️ TucuMaps — Plataforma Web Integrada de Turismo y Prevención Ciudadana

> [!abstract] Resumen Ejecutivo del Proyecto
> **TucuMaps** es una aplicación web interactiva que centraliza la localización de puntos de interés turístico y eventos culturales en la provincia de Tucumán, complementada con un sistema colaborativo de reporte y visualización de zonas de riesgo y seguridad ciudadana.
> 
> Diseñada bajo principios de alta usabilidad y accesibilidad para reducir la brecha digital en usuarios de todas las edades.

---

## 📂 Documentación Central del Proyecto (Grafo TFI)

```
                       [ TucuMaps (Hub) ]
                                |
        +---------------+-------+-------+---------------+
        |               |               |               |
        v               v               v               v
[[SRS preliminar]] [[Tecnologias]] [[BACKLOG]] [[Diagrama Casos Uso]]
```

* 📋 **Especificación de Requerimientos:** [[SRS preliminar|SRS Preliminar (Metodología Ágil)]]
* 🛠️ **Arquitectura y Stack:** [[Tecnologias TucuMaps|Stack Tecnológico y Librerías]]
* ⏱️ **Planificación y Estado:** [[BACKLOG DE DESARROLLO TucuMaps|Backlog de Desarrollo por Fases]]
* 📐 **Modelado UML:** [[Diagrama de casos de uso TucuMaps|Diagrama de Casos de Uso y Actores]]
* 🏉 **Aplicación de Scrum:** [[TP Scrum - Aplicación a TucuMaps|Trabajo Práctico y Carpeta Técnica para Presentación]]
* 🔗 **Articulación Académica:** [[11-09 Metodología II|Metodología II (UML)]] · [[Gestión Parcial|Gestión de Desarrollo (IR y PMI)]]

---

## 💡 Mecanismo de Funcionamiento

1. **Capa Turística y Cultural:**
   * Mapa interactivo centrado en Tucumán con marcadores georreferenciados para sitios históricos, paisajes y actividades recreativas.
   * Ventana emergente (*display/modal*) con detalles de cada punto, horarios, fotos y eventos próximos asociados.
   * Formulario para que usuarios registrados propongan eventos culturales, sujetos a revisión administrativa antes de su publicación.
2. **Capa de Seguridad y Prevención Colaborativa:**
   * Reporte comunitario de zonas de riesgo o alertas de delitos recientes con geolocalización precisa.
   * Los reportes quedan pendientes de moderación y solo se muestran públicamente cuando un administrador los aprueba; las confirmaciones comunitarias pueden complementar esa revisión, pero no publicar reportes por sí solas.
   * Capas independientes: switch de interfaz para alternar entre la vista *"Turismo/Eventos"* y la vista *"Seguridad"* para no abrumar al usuario con información cruzada.

---

## 🚀 Banco de Ideas y Mejoras Evolutivas

> [!tip] Ideas para Próximas Versiones (Post-MVP)
> - **Asistente de IA (RF-11):** Flujo en n8n que sugiere si un reporte o evento es broma o spam y deja el resultado visible en el panel de administración; no determina por sí solo si un delito ocurrió ni publica o rechaza contenido.
> - **Integración Institucional:** Canal directo de derivación de reportes validados a centros de monitoreo policial.
> - **Puntos Gastronómicos:** Subcategoría dedicada para gastronomía regional (empanadas, sánguches de milanesa, bodegas).
> - **Reseña Histórica Dinámica:** Audio-guías o cápsulas históricas de monumentos emblemáticos (Casa Histórica, San Javier, Tafí del Valle).
