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

Propuesta de los 20 lugares de la carga inicial: el núcleo histórico de la capital (caminable) más los sitios emblemáticos del interior. Combina lo que motiva una visita (Casa Histórica, Quilmes, Tafí) con lo que conecta con la historia de la Independencia y la Batalla de Tucumán.

> [!warning] Coordenadas aproximadas
> Las coordenadas son una referencia y **deben verificarse en Google Maps u OpenStreetMap** (clic derecho sobre el lugar → copiar coordenadas) antes de cargarlas en el seed. Lo mismo para horarios, que cambian.

## Lista propuesta

### San Miguel de Tucumán — centro histórico

| # | Lugar | Categoría | Por qué está | Lat, Lng aprox. |
| :-: | :--- | :--- | :--- | :--- |
| 1 | **Casa Histórica de la Independencia** | `historico` | Allí se declaró la Independencia el 9 de julio de 1816. Monumento Histórico Nacional y museo. | -26.8330, -65.2035 |
| 2 | **Plaza Independencia** | `historico` | Plaza fundacional de la ciudad; tiene la estatua de la Libertad de Lola Mora. | -26.8306, -65.2038 |
| 3 | **Casa de Gobierno** | `historico` | Edificio de comienzos del siglo XX frente a la plaza, símbolo del Centenario. | -26.8299, -65.2050 |
| 4 | **Catedral de San Miguel de Tucumán** | `religioso` | Catedral del siglo XIX frente a la plaza. | -26.8313, -65.2030 |
| 5 | **Iglesia y Convento de San Francisco** | `religioso` | Uno de los templos más antiguos de la ciudad, frente a la plaza. | -26.8301, -65.2028 |
| 6 | **Basílica de Nuestra Señora de la Merced** | `religioso` | Belgrano nombró a la Virgen de la Merced Generala del Ejército tras la Batalla de Tucumán (1812). | -26.8296, -65.2068 |
| 7 | **Museo Casa Padilla** | `cultural_museo` | Casona del siglo XIX junto a la Casa de Gobierno, con mobiliario y arte de época. | -26.8300, -65.2049 |
| 8 | **Museo Histórico Provincial Pte. Nicolás Avellaneda** | `cultural_museo` | Casa de la familia del presidente tucumano Nicolás Avellaneda; historia provincial. | -26.8318, -65.2033 |
| 9 | **Museo Folklórico Provincial Gral. Manuel Belgrano** | `cultural_museo` | Casona colonial con instrumentos, textiles y tradiciones del NOA. | -26.8313, -65.2078 |
| 10 | **Teatro San Martín** | `cultural_museo` | Teatro principal de la provincia, de comienzos del siglo XX. | -26.8240, -65.2045 |
| 11 | **Plaza Belgrano (Campo de las Carreras)** | `historico` | Escenario de la Batalla de Tucumán del 24 de septiembre de 1812. | -26.8370, -65.2170 |
| 12 | **Parque 9 de Julio** | `recreativo` | Gran parque urbano de principios del siglo XX, con lago y paseos. | -26.8320, -65.1890 |
| 13 | **Museo Casa del Obispo Colombres** | `cultural_museo` | Dentro del Parque 9 de Julio; recuerda al pionero de la industria azucarera tucumana. | -26.8335, -65.1900 |

### Gran Tucumán e interior

| # | Lugar | Localidad | Categoría | Por qué está | Lat, Lng aprox. |
| :-: | :--- | :--- | :--- | :--- | :--- |
| 14 | **Cristo Bendicente** | San Javier (Yerba Buena) | `religioso` | Monumento en la cima del cerro San Javier con vista a la ciudad. | -26.7870, -65.3600 |
| 15 | **Ruinas de San José de Lules** | Lules | `historico` | Restos de una misión jesuítica de los siglos XVII y XVIII. | -26.9268, -65.3466 |
| 16 | **Ruinas de Ibatín** | Monteros | `historico` | Primer emplazamiento de San Miguel de Tucumán (1565), antes del traslado a su lugar actual. | -27.1700, -65.5800 |
| 17 | **Parque de los Menhires** | El Mollar (Tafí del Valle) | `historico` | Piedras talladas de la cultura Tafí, de hace unos 2000 años. | -26.9370, -65.7070 |
| 18 | **Capilla y Museo Jesuítico La Banda** | Tafí del Valle | `historico` | Estancia jesuítica del siglo XVIII con capilla y museo. | -26.8560, -65.7180 |
| 19 | **Ciudad Sagrada de Quilmes** | Valles Calchaquíes (cerca de Amaicha) | `historico` | Uno de los mayores asentamientos prehispánicos del país, del pueblo Quilmes. | -26.4680, -66.0380 |
| 20 | **Museo de la Pachamama** | Amaicha del Valle | `cultural_museo` | Museo sobre la cultura y la cosmovisión de los Valles Calchaquíes. | -26.5950, -65.9180 |

**Reemplazos posibles** si alguno no convence: Iglesia de Santo Domingo, Ex Ingenio Santa Ana (Río Chico), Dique El Cadillal (`natural_paisaje`), Reserva Horco Molle (`natural_paisaje`).

## Contenido de cada lugar

Por cada lugar el seed necesita: `nombre`, `categoria`, `descripcion` (1 o 2 oraciones), `contenido_historico` (150 a 300 palabras), `fuente`, `direccion`, `localidad`, `horarios` (si aplica), `imagen_url`, `lat`, `lng`.

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
  "imagen_url": "https://upload.wikimedia.org/...",
  "lat": -26.8330,
  "lng": -65.2035
}
```
