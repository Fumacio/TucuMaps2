---
tags:
  - facultad
  - tfi
  - tucumaps
  - manual
fecha: 2026-10-12
materia: Trabajo Final Integrador
tipo: manual-usuario
---

# 📘 Manual de Usuario — TucuMaps

> [!info] Estado del documento
> Borrador escrito a partir del [[SRS preliminar|SRS]] (v1.8, revisado con la v1.10) y de las pantallas definidas en [[Tecnologias TucuMaps|Tecnologías]]. El backend ya está hecho; las pantallas se están programando. En el Sprint 5 se revisan los textos contra la versión final y se agregan las capturas marcadas como `📷 [Captura: ...]`. Los nombres de botones pueden cambiar con el diseño final.

---

## Índice

1. [Qué es TucuMaps](#1-qué-es-tucumaps)
2. [Usar el mapa sin cuenta](#2-usar-el-mapa-sin-cuenta)
3. [Crear una cuenta e iniciar sesión](#3-crear-una-cuenta-e-iniciar-sesión)
4. [Enviar un reporte de seguridad](#4-enviar-un-reporte-de-seguridad)
5. [Proponer un evento](#5-proponer-un-evento)
6. [Mis envíos](#6-mis-envíos)
7. [Confirmar una alerta](#7-confirmar-una-alerta)
8. [Mi perfil](#8-mi-perfil)
9. [Panel de administración](#9-panel-de-administración)
10. [Preguntas frecuentes y problemas comunes](#10-preguntas-frecuentes-y-problemas-comunes)

---

## 1. Qué es TucuMaps

TucuMaps es un mapa de la provincia de Tucumán con dos vistas:

- **Turismo y Eventos:** lugares históricos y turísticos, y eventos culturales próximos.
- **Seguridad:** alertas enviadas por vecinos y revisadas por un administrador.

Funciona desde el navegador del celular o de la computadora; no hace falta instalar nada.

> [!warning] Importante
> TucuMaps **no es un servicio oficial** y **no reemplaza al 911**. Ante una emergencia llamá al **911** (Policía), **107** (emergencias médicas) o **100** (Bomberos). Enviar un reporte en TucuMaps no es una denuncia.

### Tipos de usuario

| Usuario | Qué puede hacer |
| :--- | :--- |
| **Visitante** (sin cuenta) | Ver el mapa, los lugares, los eventos y las alertas. |
| **Usuario registrado** | Lo anterior, más enviar reportes, proponer eventos y confirmar alertas. |
| **Administrador** | Revisar y publicar lo que envían los usuarios, cargar lugares y eventos, y gestionar usuarios. |

---

## 2. Usar el mapa sin cuenta

📷 [Captura: pantalla principal del mapa en el celular]

### 2.1 Moverse por el mapa
- **Mover:** arrastrá el mapa con el dedo o el mouse.
- **Acercar o alejar:** pellizcá con dos dedos, usá la rueda del mouse o los botones **+** y **−**.
- **Mi ubicación:** tocá el botón de ubicación para centrar el mapa donde estás. El navegador te pedirá permiso; TucuMaps no guarda tu ubicación.

### 2.2 Cambiar de vista
Arriba del mapa hay un selector **Turismo/Eventos ↔ Seguridad**. Cada vista muestra solo sus marcadores, para que el mapa no se llene de información mezclada.

📷 [Captura: selector de vista]

### 2.3 Marcadores agrupados
Cuando hay muchos marcadores juntos, el mapa los muestra como un círculo con un número. Tocalo o acercá el mapa para ver cada marcador por separado.

### 2.4 Ver un lugar
Tocá un marcador de lugar para abrir su ficha: nombre, descripción, historia, dirección, horarios, precio de entrada y foto. Al pie de la ficha se indica la fuente del texto.

📷 [Captura: ficha de un lugar]

### 2.5 Ver eventos
En la vista **Turismo/Eventos** los eventos aparecen en el mapa y en la **Agenda**, ordenados por fecha. Cada evento muestra fecha y hora, lugar, modalidad (gratuita, con entrada o a la gorra) y descripción. Los eventos desaparecen solos 24 horas después de terminar.

> Fechas y precios los define el organizador: confirmalos antes de ir.

📷 [Captura: agenda de eventos]

### 2.6 Ver alertas de seguridad
En la vista **Seguridad** se muestran las alertas aprobadas en las **últimas 24 horas**. Cada alerta indica el tipo (defensa civil y riesgos comunitarios; robos, asaltos y entraderas; disturbios en la calle y marchas; o accidentes de tránsito), una descripción, la hora y cuántos usuarios la confirmaron. Nunca se muestra quién la envió.

📷 [Captura: alerta abierta en la vista Seguridad]

---

## 3. Crear una cuenta e iniciar sesión

### 3.1 Registrarse
1. Tocá **Ingresar** y luego **Crear cuenta**.
2. Completá tu nombre, email y una contraseña de **al menos 8 caracteres, con al menos una letra y un número**.
3. Marcá la casilla que confirma que tenés 18 años o más y que aceptás los Términos y la Política de Privacidad (podés leerlos desde los enlaces).
4. Tocá **Crear cuenta**.

📷 [Captura: formulario de registro]

### 3.2 Verificar el email
Te llega un correo con un enlace. Abrilo dentro de las **24 horas** para activar tu cuenta. Hasta que lo verifiques podés usar el mapa, pero no enviar reportes ni eventos.

¿No llegó? Revisá la carpeta de spam o tocá **Reenviar correo** en el aviso que aparece en la aplicación.

### 3.3 Iniciar sesión
Tocá **Ingresar**, escribí tu email y contraseña. La sesión queda abierta en ese dispositivo y no tenés que volver a ingresar mientras uses TucuMaps al menos una vez cada 90 días.

Por seguridad, después de **5 intentos fallidos** tenés que esperar 15 minutos.

### 3.4 Olvidé mi contraseña
1. En **Ingresar**, tocá **¿Olvidaste tu contraseña?**
2. Escribí tu email. Si tiene cuenta, te llega un enlace.
3. Abrilo dentro de **1 hora** y elegí una contraseña nueva. Por seguridad, se cierra la sesión en tus otros dispositivos.

---

## 4. Enviar un reporte de seguridad

> Necesitás una cuenta con el email verificado.

1. En la vista **Seguridad**, tocá **Reportar**.
2. Marcá el lugar en el mapa (o usá **Mi ubicación**). Tiene que estar dentro de Tucumán.
3. Elegí el **tipo** de reporte.
4. Escribí una **descripción** (entre 10 y 500 caracteres). Opcional: dirección y barrio.
5. Tocá **Enviar**.

📷 [Captura: formulario de reporte]

El reporte queda **pendiente** hasta que un administrador lo revise. No aparece en el mapa hasta que lo aprueben.

**Cómo escribir un buen reporte:** describí la situación y el lugar, no a personas. No incluyas nombres, fotos, patentes, domicilios ni datos que identifiquen a alguien; esos reportes se rechazan.

**Límite:** podés enviar hasta **5 reportes cada 24 horas**.

---

## 5. Proponer un evento

> Necesitás una cuenta con el email verificado.

1. En la vista **Turismo/Eventos**, tocá **Proponer evento**.
2. Completá nombre, categoría (música, teatro, feria, gastronomía, deporte, cultural u otro), modalidad, descripción, nombre del lugar, dirección y barrio.
3. Marcá la ubicación en el mapa.
4. Indicá fecha y hora de inicio y, si sabés, de finalización.
5. Opcional: pegá el enlace de una imagen o flyer (debe empezar con `http` o `https`) y agregá hasta 5 etiquetas.
6. Tocá **Enviar**.

📷 [Captura: formulario de evento]

La propuesta queda **pendiente** hasta que un administrador la revise. Podés proponer hasta **3 eventos cada 24 horas**.

---

## 6. Mis envíos

En **Mis envíos** ves todos tus reportes y propuestas con su estado:

| Estado | Qué significa |
| :--- | :--- |
| **Pendiente** | Todavía no lo revisó un administrador. Lo podés **editar** o **cancelar**. |
| **Aprobado** | Está publicado en el mapa. |
| **Rechazado** | No se publicó. Se muestra el motivo. Si querés, podés enviar uno nuevo corregido. |
| **Resuelto** | (Solo reportes) El administrador indicó que la situación se solucionó. |
| **Cancelado** | Lo cancelaste vos mientras estaba pendiente. |
| **Retirado** | Estaba publicado y el administrador lo quitó (por ejemplo, un evento suspendido). |

📷 [Captura: lista de Mis envíos]

Una vez revisado, un envío ya no se puede editar. Los cancelados cuentan para el límite diario.

---

## 7. Confirmar una alerta

Si viste lo mismo que describe una alerta, abrila y tocá **Yo también lo vi**. Así otros usuarios saben que más gente lo confirma.

- Solo podés confirmar una vez cada alerta.
- No podés confirmar tus propios reportes.
- Confirmar no publica ni cambia la alerta: solo suma al contador.

---

## 8. Mi perfil

Desde **Mi perfil** podés:
- **Cambiar la contraseña** (te pide la actual).
- **Cerrar sesión** en este dispositivo, o **en todos los dispositivos**.
- **Dar de baja la cuenta:** te pide la contraseña. Se borran tu nombre, email y confirmaciones; tus reportes y eventos quedan sin ningún dato tuyo. No se puede deshacer.

📷 [Captura: pantalla de perfil]

---

## 9. Panel de administración

> Solo para usuarios con rol de administrador. Se entra desde el menú, opción **Administración** (`/admin`).

📷 [Captura: resumen del panel]

### 9.1 Resumen
Al entrar se ven los contadores: reportes y eventos pendientes, alertas activas y usuarios bloqueados.

### 9.2 Revisar reportes pendientes
1. Abrí **Reportes → Pendientes**. Cada reporte muestra la descripción, la ubicación en un mini mapa, el autor y, si está activa, la sugerencia de la IA.
2. Elegí una acción:
   - **Aprobar:** se publica en el mapa durante 24 horas.
   - **Rechazar:** escribí el motivo (obligatorio); el usuario lo ve en Mis envíos.

**Criterios para rechazar:** datos que identifican a personas, acusaciones a alguien concreto, contenido ofensivo o discriminatorio, bromas o spam, ubicación absurda, o información que claramente no corresponde.

📷 [Captura: cola de pendientes con un reporte abierto]

### 9.3 Reportes publicados
En **Reportes → Publicados** podés:
- **Marcar como resuelto:** la situación se solucionó; deja de verse en el mapa.
- **Retirar:** quitarlo del mapa sin motivo obligatorio (por ejemplo, si después se detecta que era falso).

Los estados rechazado, resuelto y retirado son definitivos.

### 9.4 Eventos
- **Pendientes:** aprobar o rechazar (con motivo) las propuestas de los usuarios.
- **Nuevo evento:** cargar un evento directamente; se publica sin pasar por la cola.
- **Editar:** cambiar datos de un evento publicado (por ejemplo, el horario); sigue publicado.
- **Retirar:** quitar un evento publicado, por ejemplo si se suspendió.
- **Historial:** los eventos que ya pasaron se archivan solos y quedan acá.

### 9.5 Lugares
- **Nuevo lugar:** nombre, categoría, descripción, contenido histórico, fuente, dirección, localidad, barrio, horarios, precio de entrada, URL de la imagen y ubicación en el mapa.
- **Editar** cualquier dato.
- **Desactivar:** lo oculta del mapa sin borrarlo; se puede volver a activar.

📷 [Captura: formulario de lugar]

### 9.6 Usuarios
- Buscar por nombre o email y ver cuántos envíos y rechazos tiene cada uno.
- **Bloquear:** el usuario pierde la sesión, no puede ingresar ni enviar nada, y sus envíos pendientes se rechazan con el motivo "Usuario bloqueado". No podés bloquearte a vos mismo.
- **Desbloquear:** recupera el acceso; lo rechazado no se reabre.

### 9.7 Pedidos sobre datos personales
Si alguien escribe al email de contacto pidiendo ver, corregir o borrar sus datos, hay que responder en los plazos de la [[Politica de privacidad TucuMaps|Política de Privacidad]]: **10 días corridos** para el acceso y **5 días hábiles** para corregir o borrar. Si alguien denuncia una alerta que lo identifica, se revisa dentro de las 72 horas y, si corresponde, se retira.

---

## 10. Preguntas frecuentes y problemas comunes

**La aplicación tarda en cargar la primera vez.**
El servidor gratuito se "duerme" cuando nadie lo usa y tarda hasta un minuto en despertar. La aplicación muestra un aviso mientras tanto; si falla, tocá **Reintentar**.

**Envié un reporte y no aparece en el mapa.**
Está pendiente de revisión. Fijate su estado en **Mis envíos**.

**Una alerta desapareció.**
Las alertas se muestran solo 24 horas desde que se aprueban, o antes si el administrador las marca como resueltas o las retira.

**No puedo enviar reportes.**
Revisá que hayas verificado tu email y que no hayas llegado al límite de 5 reportes en 24 horas.

**Me dice que la ubicación está fuera de Tucumán.**
El punto marcado tiene que estar dentro de la provincia. Acercá el mapa y marcá de nuevo.

**No me llegan los correos.**
Revisá spam y promociones. Si sigue sin llegar, escribí a tucumaps.app@gmail.com.

**¿Quién ve que yo envié un reporte?**
Solo el administrador. En el mapa nunca se muestra el autor.

**Contacto:** tucumaps.app@gmail.com
