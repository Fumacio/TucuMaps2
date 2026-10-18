---
tags:
  - facultad
  - tfi
  - tucumaps
  - contenido
  - seed
fecha: 2026-10-12
materia: Trabajo Final Integrador
tipo: contenido
---

# 📍 Seed de Lugares Históricos — TucuMaps

> [!info] Documentación Relacionada
> - **Requerimiento:** [[SRS preliminar|SRS Preliminar]] — sección 1.2 (MVP: al menos 20 lugares históricos) y RF-02
> - **Modelo:** tabla `lugares` en `schema.sql`

Los 20 lugares de la carga inicial: el núcleo histórico de la capital (caminable) más sus alrededores cercanos (cerro San Javier, Yerba Buena y Tafí Viejo). Combina lo que motiva una visita con lo que conecta con la historia de la Independencia y la Batalla de Tucumán.

> [!note] Alcance (decisión de Nacho, 13/10/2026)
> Por ahora la app se enfoca en la **capital y sus alrededores cercanos**. Los sitios del interior que estaban en la primera versión (Ruinas de Lules, Ruinas de Ibatín, Parque de los Menhires, La Banda, Quilmes y Museo de la Pachamama) se reemplazaron. La migración `1760500000000_ocultar-lugares-interior` los oculta del mapa donde ya se habían cargado, sin borrarlos.

> [!note] Coordenadas
> Las del 13/10/2026 se compararon con OpenStreetMap (y algunas las confirmó Nacho en Google Maps). El 18/10/2026 Lourdes las verificó de nuevo; los valores que se cargan están en `backend/seeds/lugares.js`. Los horarios cambian: conviene revisarlos antes de la entrega.

> [!success] Contenido cargado (18/10/2026)
> Lourdes preparó textos, fuentes, horarios, precios de entrada, fotos y coordenadas verificadas de los 20 lugares (issue #24); están en `backend/seeds/lugares.js`. Faltan las fotos de Museo Avellaneda, Teatro San Martín, Reserva Horco Molle y Museo Iramain. San Francisco conserva la coordenada confirmada por Nacho.

## Lista propuesta

### San Miguel de Tucumán — centro histórico

| # | Lugar | Categoría | Por qué está | Lat, Lng aprox. |
| :-: | :--- | :--- | :--- | :--- |
| 1 | **Casa Histórica de la Independencia** | `historico` | Allí se declaró la Independencia el 9 de julio de 1816. Monumento Histórico Nacional y museo. | -26.8330, -65.2035 |
| 2 | **Plaza Independencia** | `historico` | Plaza fundacional de la ciudad; tiene la estatua de la Libertad de Lola Mora. | -26.8306, -65.2038 |
| 3 | **Casa de Gobierno** | `historico` | Edificio de comienzos del siglo XX frente a la plaza, símbolo del Centenario. | -26.8299, -65.2050 |
| 4 | **Catedral de San Miguel de Tucumán** | `religioso` | Catedral del siglo XIX frente a la plaza. | -26.8312, -65.2034 ✔ |
| 5 | **Iglesia y Convento de San Francisco** | `religioso` | Uno de los templos más antiguos de la ciudad, frente a la plaza (25 de Mayo 110). | -26.8295, -65.2045 ✔ |
| 6 | **Basílica de Nuestra Señora de la Merced** | `religioso` | Belgrano nombró a la Virgen de la Merced Generala del Ejército tras la Batalla de Tucumán (1812). | -26.8313, -65.2011 ✔ |
| 7 | **Museo Casa Padilla** | `cultural_museo` | Casona del siglo XIX junto a la Casa de Gobierno, con mobiliario y arte de época. | -26.8300, -65.2049 |
| 8 | **Museo Histórico Provincial Pte. Nicolás Avellaneda** | `cultural_museo` | Casa de la familia del presidente tucumano Nicolás Avellaneda; historia provincial. | -26.8318, -65.2033 |
| 9 | **Museo Folklórico Provincial Gral. Manuel Belgrano** | `cultural_museo` | Casona colonial con instrumentos, textiles y tradiciones del NOA. | -26.8313, -65.2078 |
| 10 | **Teatro San Martín** | `cultural_museo` | Teatro principal de la provincia, de comienzos del siglo XX. | -26.8240, -65.2045 |
| 11 | **Plaza Belgrano (Campo de las Carreras)** | `historico` | Escenario de la Batalla de Tucumán del 24 de septiembre de 1812. | -26.8370, -65.2170 |
| 12 | **Parque 9 de Julio** | `recreativo` | Gran parque urbano de principios del siglo XX, con lago y paseos. | -26.8320, -65.1890 |
| 13 | **Museo Casa del Obispo Colombres** | `cultural_museo` | Dentro del Parque 9 de Julio; recuerda al pionero de la industria azucarera tucumana. | -26.8335, -65.1900 |

### Alrededores cercanos

| # | Lugar | Localidad | Categoría | Por qué está | Lat, Lng aprox. |
| :-: | :--- | :--- | :--- | :--- | :--- |
| 14 | **Cristo Bendicente** | San Javier (Yerba Buena) | `religioso` | Monumento en la cima del cerro San Javier con vista a la ciudad. | -26.7969, -65.3603 ✔ |
| 15 | **Villa Nougués** | Villa Nougués | `natural_paisaje` | Villa veraniega de comienzos del siglo XX en lo alto del cerro San Javier. | -26.8499, -65.3804 |
| 16 | **Reserva Ecológica Horco Molle** | Yerba Buena | `natural_paisaje` | Selva de yungas al pie del cerro San Javier, con senderos. | -26.7930, -65.3164 |
| 17 | **Talleres Ferroviarios de Tafí Viejo** | Tafí Viejo | `historico` | Talleres de comienzos del siglo XX que impulsaron el crecimiento de Tafí Viejo. | -26.7369, -65.2539 |

### Más lugares de la capital

| # | Lugar | Categoría | Por qué está | Lat, Lng aprox. |
| :-: | :--- | :--- | :--- | :--- |
| 18 | **Museo Provincial de Bellas Artes Timoteo Navarro** | `cultural_museo` | Museo de arte del centro, con obras de artistas tucumanos y argentinos (9 de Julio 44). | -26.8316, -65.2048 |
| 19 | **Museo Iramain** | `cultural_museo` | Casa museo del escultor tucumano Juan Carlos Iramain (Entre Ríos 27). | -26.8323, -65.2004 |
| 20 | **Plaza Urquiza** | `recreativo` | Una de las plazas más grandes y arboladas de la ciudad. | -26.8193, -65.2027 |

**Reemplazos posibles** si alguno no convence: Iglesia de Santo Domingo, Cementerio del Oeste (`historico`), Estación Tucumán Mitre (`historico`).

## Contenido de cada lugar

Por cada lugar el seed necesita: `nombre`, `categoria`, `descripcion` (1 o 2 oraciones), `contenido_historico` (150 a 300 palabras), `fuente`, `direccion`, `localidad`, `horarios` (si aplica), `precio_entrada` (si aplica), `imagen_url`, `lat`, `lng`.

**Textos.** Conviene **redactarlos con palabras propias** a partir de las fuentes y citar la fuente en el campo `fuente`. Si se copia texto de Wikipedia hay que indicarlo y respetar su licencia (CC BY-SA 4.0: atribución y compartir igual). Los textos de sitios oficiales de turismo o de museos tienen derechos de autor: se pueden usar como referencia, no copiar.

**Fuentes sugeridas:** Comisión Nacional de Monumentos, de Lugares y de Bienes Históricos (lista de monumentos de Tucumán), sitio del Ente Tucumán Turismo, sitios de cada museo, Wikipedia en español.

**Imágenes.** Usar fotos con licencia libre de Wikimedia Commons (copiar la URL directa de la imagen y anotar autor y licencia en `fuente`) o fotos propias subidas a un servicio con URL pública. No usar imágenes de Google sin permiso.

## Ejemplo de registro

```json
{
  "nombre": "Casa Histórica de la Independencia",
  "categoria": "historico",
  "descripcion": "Casa donde el Congreso de Tucumán declaró la Independencia el 9 de julio de 1816.",
  "contenido_historico": "[Texto propio de 150 a 300 palabras]",
  "fuente": "Texto propio basado en [fuente]. Foto: [autor], Wikimedia Commons, [licencia].",
  "direccion": "Congreso 151",
  "localidad": "San Miguel de Tucumán",
  "barrio": "Centro",
  "horarios": "[verificar]",
  "precio_entrada": "Gratuita",
  "imagen_url": "https://commons.wikimedia.org/wiki/Special:FilePath/[archivo]?width=1024",
  "lat": -26.8330,
  "lng": -65.2035
}
```
