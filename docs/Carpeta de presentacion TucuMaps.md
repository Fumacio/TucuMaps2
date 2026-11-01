---
tags:
  - facultad
  - tfi
  - tucumaps
  - carpeta
  - apa
fecha: 2026-10-30
materia: Trabajo Final Integrador
tipo: plan-entrega
---

# 📁 Carpeta de presentación del TFI — TucuMaps

> [!info] Documentación Relacionada
> - **Proyecto General:** [[TucuMaps|TucuMaps - Hub Principal]]
> - **Cronograma:** [[Cronograma TucuMaps|Cronograma de Sprints]] (la carpeta va en el Sprint 5)
> - **Backlog:** [[BACKLOG DE DESARROLLO TucuMaps|Backlog de Desarrollo]] (Fase 5)

Checklist de la carpeta de presentación según la *Guía para la Carpeta de Presentación del Proyecto PPS/TFI* de la UTN FRT (Tecnicatura Universitaria en Programación). Para cada una de las 12 secciones de la guía indica de dónde sale el contenido y qué falta escribir. Las guías originales (PDF) están en la bóveda de Obsidian de Nacho, en `raw/pdfs/`.

**Estado al 30/10/2026:** la carpeta no está empezada. Se escribe en el Sprint 5 (09/11 – 15/11) y se termina el domingo 15/11 junto con la versión congelada. Las secciones que no dependen del cierre del desarrollo (4, 5, 6, 7, 8 y 9) se pueden adelantar.

## Decisiones (Nacho, 30/10/2026)

1. Las secciones van **numeradas del 1 al 12, como pide la guía de la UTN**, aunque APA 7 recomienda no numerar los títulos. El resto del formato (citas, referencias, tablas y figuras) sigue **APA 7.ª edición**.
2. En Metodología o Recursos se **declara el uso de Claude Code** como herramienta del equipo de desarrollo (programa, revisa y abre PRs), no como integrante.
3. El **tutor/a académico/a** queda pendiente.
4. Responsables: Nacho escribe la carpeta y Lourdes aporta las capturas y los diagramas (ver [[Cronograma TucuMaps|Cronograma]]).

## Checklist

Leyenda: ✅ el material ya existe · 🟡 hay material parcial · ❌ falta escribirlo.

| # | Sección (qué pide la guía) | Estado | De dónde sale | Qué falta |
| :-: | :--- | :-: | :--- | :--- |
| 1 | **Portada:** título, autores, carrera, institución o empresa vinculante, tutor/a, fecha, logos. | 🟡 | Título "TucuMaps — Plataforma Web Integrada de Turismo y Prevención Ciudadana"; Flores Pablo Ignacio y Andrada Romero Lourdes Micaela; TUP, UTN FRT. | Tutor/a, fecha de presentación, logo de la UTN FRT. No hay empresa vinculante. |
| 2 | **Índice** con páginas. | ❌ | Se genera al armar el documento. | Todo. |
| 3 | **Resumen ejecutivo:** descripción, objetivos, metodología, resultados esperados, conclusiones. | 🟡 | Resumen de [[TucuMaps]], MVP ([[SRS TucuMaps|SRS]] §1.2), [[Scrum TucuMaps|Scrum]]. | Resultados y conclusiones (al final). APA: de 150 a 250 palabras, más las palabras clave. |
| 4 | **Introducción:** contexto y antecedentes, justificación, objetivos generales y específicos. | ❌ | Visión del producto y actores ([[SRS TucuMaps|SRS]] §2). | Contexto, justificación y **objetivo general y objetivos específicos**, que no están escritos en ningún documento. |
| 5 | **Estado del arte:** antecedentes, comparativa con soluciones existentes, aporte del proyecto. | 🟡 | Investigación de apps similares del 12/10 (Ushahidi, FixMyStreet, SeeClickFix, BA 147, Citizen, Waze, mapas vecinales, Turismo Tucumán), en la bóveda y en los archivos del proyecto. | Verificar los datos marcados "(inferido)", citar las fuentes en APA y escribir el aporte de TucuMaps: turismo y seguridad en un solo mapa, con moderación antes de publicar. |
| 6 | **Descripción del proyecto:** problemática, solución, alcance y limitaciones. | 🟡 | Funcionamiento ([[TucuMaps]]), alcance solo en la capital y alrededores (decisión del 13/10, PR #34), MVP y evolutivos RF-17 a RF-23 ([[SRS TucuMaps|SRS]]). | Redactar la problemática y las limitaciones: Render gratis se duerme, no hay app nativa, solo cubre la capital y las imágenes van por URL. |
| 7 | **Metodología:** métodos, herramientas, tecnologías, marco teórico. | ✅ | [[Scrum TucuMaps|Scrum]] con sprints semanales, [[Tecnologias TucuMaps|Tecnologías]], pruebas ([[SRS TucuMaps|SRS]] §4.4), Claude Code. | Marco teórico opcional (ingeniería de requerimientos, UML de Metodología de Sistemas II). |
| 8 | **Recursos necesarios:** humanos (roles) y materiales (equipos, software). | 🟡 | Roles de [[Scrum TucuMaps|Scrum]]; servicios gratuitos (GitHub, Render, Neon, Vercel, Brevo). | Equipos de cada integrante, celulares de prueba y el costo (todo en planes gratuitos). |
| 9 | **Plan de trabajo:** cronograma, etapas, entregables, fechas clave. | ✅ | [[Cronograma TucuMaps|Cronograma]], TP4 con el Gantt y los hitos H0 a H6 (archivos del proyecto), registro de sprints en [[Scrum TucuMaps|Scrum]]. | Actualizar el estado de los hitos al cerrar. |
| 10 | **Resultados esperados:** productos y su impacto académico, institucional o social. | 🟡 | Entregables por sprint ([[Cronograma TucuMaps|Cronograma]]), MVP. | Impacto social para vecinos y turistas de Tucumán, e impacto académico. |
| 11 | **Referencias** en APA 7. | ❌ | Leyes de los textos legales (25.326, 11.723, 23.592, 24.240), fuentes de la investigación de apps, documentación de React, Leaflet, OpenStreetMap, Express y PostgreSQL, fotos de Wikimedia Commons ([[Seed lugares TucuMaps|Seed]]). | Armar la lista. |
| 12 | **Anexos:** gráficos, diagramas, tablas. | ✅ | [[Diagramas de clases y despliegue TucuMaps|Clases, componentes y despliegue]], `img/ERD_TucuMaps.png`, [[Diagrama de casos de uso TucuMaps|Casos de uso]], [[API TucuMaps|API]], [[Modelo de datos TucuMaps|Modelo de datos]], [[Pantallas TucuMaps|Pantallas]], [[Manual de usuario TucuMaps|Manual]], [[Terminos de uso TucuMaps|Términos]] y [[Politica de privacidad TucuMaps|Privacidad]], informe de cobertura. | Elegir cuáles van y exportar los diagramas en buena resolución. |

Recomendaciones de la guía: claridad, formato uniforme (misma fuente, tamaño, espaciado y numeración), revisión final de ortografía y datos, y gráficos o diagramas donde ayuden.

## APA 7: lo esencial para la carpeta

- **Página:** márgenes de 2,54 cm; fuente única (Calibri 11, Arial 11, Times New Roman 12 o Georgia 11); interlineado doble; alineación a la izquierda; sangría de 1,27 cm; número de página arriba a la derecha.
- **Títulos:** nivel 1 centrado y en negrita, nivel 2 a la izquierda y en negrita, nivel 3 a la izquierda en negrita y cursiva. La numeración 1 a 12 se mantiene por la decisión 1.
- **Tablas y figuras:** arriba, "**Tabla 1**" o "**Figura 1**" en negrita y el título en cursiva; debajo, una *Nota.* con la fuente. Los diagramas propios se aclaran como elaboración propia.
- **Citas:** (Apellido, año); con tres autores o más, *et al.* desde la primera cita. Las citas textuales de menos de 40 palabras van entre comillas y con la página; las de 40 o más, en un bloque con sangría.
- **Referencias:** página aparte, en orden alfabético y con sangría francesa. Cada una dice quién, cuándo (*s.f.* si no hay fecha), qué y dónde (URL o DOI).
