---
tags:
  - facultad
  - tfi
  - tucumaps
  - stack-tecnologico
  - arquitectura
fecha: 2026-09-28
materia: Trabajo Final Integrador
tipo: arquitectura
---

# 🛠️ Stack Tecnológico — TucuMaps

> [!info] Navegación del Proyecto
> - **Proyecto Central:** [[TucuMaps|TucuMaps - Hub Principal]]
> - **Especificación:** [[SRS preliminar|SRS Preliminar]]
> - **Planificación:** [[BACKLOG DE DESARROLLO TucuMaps|Backlog de Desarrollo]]

---

## 🏛️ Arquitectura General del Sistema

El desarrollo de la **"Plataforma Web Integrada de Turismo y Prevención Ciudadana"** se fundamenta en una arquitectura **cliente-servidor** con frontend en React y backend en Node.js/Express, conectado a PostgreSQL. Esta separación permite mantener los componentes de interfaz, lógica de negocio y persistencia de datos de forma modular.

---

## 💻 1. Frontend (Interfaz de Usuario)

| Tecnología | Rol en el Proyecto | Implementación y Justificación |
| :--- | :--- | :--- |
| **React** | SPA Library | Construcción de interfaz mediante componentes reutilizables. El *Virtual DOM* optimiza la renderización reactiva de marcadores en el mapa. |
| **HTML5 / CSS3 / JS** | Base Web | Estructuración semántica y diseño responsive adaptable a dispositivos móviles y ordenadores de escritorio. |
| **React-Leaflet** | Mapas Interactivos | Envoltura de Leaflet.js para React. Procesa coordenadas geográficas (lat/lng) y renderiza capas de marcadores personalizados (turismo vs. riesgo). |

---

## ⚙️ 2. Backend (Servidor y Lógica de Negocio)

| Tecnología | Rol en el Proyecto | Implementación y Justificación |
| :--- | :--- | :--- |
| **Node.js** | Runtime Asíncrono | Entorno de ejecución basado en eventos no bloqueantes, ideal para alta concurrencia de consultas geográficas. |
| **Express.js** | Framework REST API | Enrutamiento de peticiones HTTP (`GET`, `POST`, `PUT`, `DELETE`), middlewares de validación y control de accesos. |

---

## 🗄️ 3. Persistencia de Datos

* **PostgreSQL (RDBMS):** Base de datos relacional para asegurar la integridad referencial y transaccional mediante claves foráneas entre entidades: `Usuarios`, `Reportes`, `Validaciones`, `Lugares_Turisticos` y `Eventos`. Los reportes y eventos propuestos deben contemplar estados de revisión administrativa (`pendiente`, `aprobado`, `rechazado` y, para alertas solucionadas, `resuelto`), junto con campos de auditoría (`revisado_por`, `revisado_en`, `motivo_rechazo`) y, para la pre-validación con IA, `ia_veredicto`, `ia_confianza`, `ia_motivo`, `ia_analizado_en`. Los usuarios contemplan un estado de bloqueo. Opcionalmente se puede habilitar la extensión **PostGIS** para consultas geográficas (ej. reportes cercanos).
* **Driver `pg` (node-postgres):** Conector para Node.js con soporte nativo de promesas (`async/await`) y consultas parametrizadas contra inyecciones SQL.

---

> [!note] Prototipo visual
> El prototipo visual de TucuMaps fue armado con Firestore solo como maqueta de interfaz. La arquitectura definitiva es la descrita en este documento.

---

## 🔒 4. Seguridad y Autenticación

* **JSON Web Tokens (JWT):** Generación de tokens cifrados para la gestión de sesiones sin estado (*stateless*). Permite validar la identidad ciudadana antes de admitir reportes de seguridad.
* **Bcrypt:** Algoritmo de hashing criptográfico unidireccional con sal (*salt*) para resguardo seguro de contraseñas de usuarios.
* **CORS & Rate Limiting:** Políticas para restringir orígenes permitidos en la API y limitar ráfagas excesivas de solicitudes (prevención de spam y ataques DDoS).

---

## 📦 5. Utilidades y Servicios Complementarios

* **Multer y Cloudinary:** Multer procesa las cargas `multipart/form-data` y Cloudinary almacena y entrega las imágenes adjuntas a reportes, si se habilita esa evidencia en la implementación.
* **n8n (evolutivo):** Plataforma de automatización de flujos. Recibe un webhook del backend cuando se envía un reporte o evento, consulta a un modelo de IA para sugerir si es broma o spam, devuelve el veredicto a la API (`ia_veredicto`, `ia_confianza`, `ia_motivo`) y registra el resultado en Google Sheets. La IA solo sugiere; la decisión final es del administrador.
* **Google Sheets (bitácora):** Registro de auditoría de los análisis de la IA. No es la base de datos principal: la fuente de verdad es PostgreSQL.
* **Nodemailer:** Servicio de envío asíncrono de correos electrónicos transaccionales (confirmación de cuenta, recuperación de clave y notificaciones).
