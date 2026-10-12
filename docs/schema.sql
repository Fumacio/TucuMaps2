-- =====================================================================
-- TucuMaps — Esquema de base de datos (PostgreSQL)
-- Basado en el SRS v1.8. Los números RF-xx y RNF-xx referencian ese documento.
-- En el desarrollo este archivo se traduce a la primera migración
-- (node-pg-migrate); los cambios posteriores se hacen con nuevas migraciones.
-- =====================================================================

-- ---------- Tipos ----------
CREATE TYPE rol_usuario     AS ENUM ('ciudadano', 'admin');
-- Eventos: 'cancelado' lo pone el autor mientras está pendiente (RF-07);
-- 'retirado' lo pone el admin sobre un evento ya publicado (RF-13).
CREATE TYPE estado_revision AS ENUM ('pendiente', 'aprobado', 'rechazado', 'cancelado', 'retirado');
CREATE TYPE estado_reporte  AS ENUM ('pendiente', 'aprobado', 'rechazado', 'resuelto', 'cancelado', 'retirado');
CREATE TYPE veredicto_ia    AS ENUM ('probable_real', 'dudoso', 'probable_broma_o_spam');
CREATE TYPE tipo_token      AS ENUM ('verificar_email', 'recuperar_password');

-- ---------- Usuarios (RF-01, RF-16, RF-03, RF-04, RF-24) ----------
-- El primer administrador se inserta manualmente con rol = 'admin'.
-- La política de contraseñas (mín. 8 caracteres, al menos una letra y un número)
-- se valida en el backend antes de calcular el hash.
CREATE TABLE usuarios (
  id                    BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  nombre                VARCHAR(80)  NOT NULL,
  email                 VARCHAR(255) NOT NULL UNIQUE,       -- se guarda en minúsculas
  password_hash         VARCHAR(100) NOT NULL,              -- bcrypt
  rol                   rol_usuario  NOT NULL DEFAULT 'ciudadano',
  email_verificado      BOOLEAN      NOT NULL DEFAULT FALSE,
  bloqueado             BOOLEAN      NOT NULL DEFAULT FALSE,
  -- Se incrementa al cambiar la contraseña o al "cerrar sesión en todos los
  -- dispositivos"; los tokens emitidos con una versión anterior dejan de valer.
  token_version         INTEGER      NOT NULL DEFAULT 0,
  terminos_version      VARCHAR(20)  NOT NULL,              -- versión de términos aceptada
  terminos_aceptados_en TIMESTAMPTZ  NOT NULL,
  creado_en             TIMESTAMPTZ  NOT NULL DEFAULT now()
);

-- Tokens de un solo uso con vencimiento (RF-03):
-- verificar_email vence a las 24 hs, recuperar_password a la hora.
CREATE TABLE tokens_usuario (
  id          BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  usuario_id  BIGINT       NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  tipo        tipo_token   NOT NULL,
  token_hash  VARCHAR(100) NOT NULL UNIQUE,                 -- se guarda el hash, no el token
  expira_en   TIMESTAMPTZ  NOT NULL,
  usado_en    TIMESTAMPTZ,
  creado_en   TIMESTAMPTZ  NOT NULL DEFAULT now()            -- límite de reenvíos por hora
);

-- ---------- Lugares (RF-02, RF-13) ----------
-- Los CHECK de lat/lng son una caja rectangular aproximada de la provincia de
-- Tucumán (RF-10). Es una aproximación aceptada: incluye franjas de provincias vecinas.
CREATE TABLE lugares (
  id                  BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  nombre              VARCHAR(150) NOT NULL,
  categoria           VARCHAR(30)  NOT NULL DEFAULT 'historico'
                      CHECK (categoria IN ('historico', 'cultural_museo', 'natural_paisaje',
                                           'religioso', 'recreativo')),
  descripcion         TEXT,
  contenido_historico TEXT,
  fuente              VARCHAR(300),                         -- origen del texto histórico
  direccion           VARCHAR(200),
  localidad           VARCHAR(80)  NOT NULL DEFAULT 'San Miguel de Tucumán',
  barrio              VARCHAR(80),
  horarios            VARCHAR(200),
  imagen_url          VARCHAR(500) CHECK (imagen_url ~* '^https?://'),
  lat                 NUMERIC(9,6) NOT NULL CHECK (lat BETWEEN -28.0 AND -26.0),
  lng                 NUMERIC(9,6) NOT NULL CHECK (lng BETWEEN -66.5 AND -64.5),
  activo              BOOLEAN      NOT NULL DEFAULT TRUE,
  creado_por          BIGINT REFERENCES usuarios(id) ON DELETE SET NULL,
  creado_en           TIMESTAMPTZ  NOT NULL DEFAULT now(),
  actualizado_en      TIMESTAMPTZ  NOT NULL DEFAULT now()
);

-- ---------- Eventos (RF-07, RF-08, RF-13, RF-20, RF-12) ----------
CREATE TABLE eventos (
  id              BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  nombre          VARCHAR(150) NOT NULL,
  categoria       VARCHAR(20)  NOT NULL
                  CHECK (categoria IN ('musica', 'teatro', 'feria', 'gastronomia',
                                       'deporte', 'cultural', 'otro')),
  modalidad       VARCHAR(20)  NOT NULL
                  CHECK (modalidad IN ('gratuita', 'con_entrada', 'a_la_gorra')),
  descripcion     TEXT         NOT NULL,
  lugar_nombre    VARCHAR(150) NOT NULL,
  direccion       VARCHAR(200) NOT NULL,
  barrio          VARCHAR(80)  NOT NULL,
  lugar_id        BIGINT REFERENCES lugares(id) ON DELETE SET NULL,   -- sede opcional
  lat             NUMERIC(9,6) NOT NULL CHECK (lat BETWEEN -28.0 AND -26.0),
  lng             NUMERIC(9,6) NOT NULL CHECK (lng BETWEEN -66.5 AND -64.5),
  inicio          TIMESTAMPTZ  NOT NULL,
  fin             TIMESTAMPTZ  CHECK (fin IS NULL OR fin > inicio),   -- opcional
  flyer_url       VARCHAR(500) CHECK (flyer_url ~* '^https?://'),
  etiquetas       TEXT[]       NOT NULL DEFAULT '{}',
  estado          estado_revision NOT NULL DEFAULT 'pendiente',
  -- NULL si el autor borró su cuenta o pasó el plazo de retención (RF-24).
  -- Los eventos creados por un admin se guardan con su id y nacen 'aprobado'.
  propuesto_por   BIGINT REFERENCES usuarios(id) ON DELETE SET NULL,
  -- moderación (RF-15)
  revisado_por    BIGINT REFERENCES usuarios(id) ON DELETE SET NULL,
  revisado_en     TIMESTAMPTZ,
  motivo_rechazo  TEXT,
  -- retiro de un evento publicado (RF-13); no lleva motivo
  retirado_por    BIGINT REFERENCES usuarios(id) ON DELETE SET NULL,
  retirado_en     TIMESTAMPTZ,
  -- pre-validación con IA (RF-20); NULL = sin analizar
  ia_veredicto    veredicto_ia,
  ia_confianza    NUMERIC(3,2) CHECK (ia_confianza BETWEEN 0 AND 1),
  ia_motivo       TEXT,
  ia_analizado_en TIMESTAMPTZ,
  creado_en       TIMESTAMPTZ  NOT NULL DEFAULT now(),
  actualizado_en  TIMESTAMPTZ  NOT NULL DEFAULT now()
);

-- ---------- Reportes de seguridad (RF-07, RF-08, RF-13, RF-15, RF-20, RF-11) ----------
-- No llevan fotos en el MVP (se evita publicar imágenes de personas).
CREATE TABLE reportes (
  id              BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  -- Nunca se expone públicamente (RF-04). NULL si el autor borró su cuenta.
  usuario_id      BIGINT REFERENCES usuarios(id) ON DELETE SET NULL,
  tipo            VARCHAR(30)  NOT NULL
                  CHECK (tipo IN ('robo_hurto', 'arrebato_motochorro', 'zona_sin_iluminacion',
                                  'zona_peligrosa', 'accidente_transito', 'otro')),
  descripcion     TEXT         NOT NULL,
  direccion       VARCHAR(200),
  barrio          VARCHAR(80),
  lat             NUMERIC(9,6) NOT NULL CHECK (lat BETWEEN -28.0 AND -26.0),
  lng             NUMERIC(9,6) NOT NULL CHECK (lng BETWEEN -66.5 AND -64.5),
  estado          estado_reporte NOT NULL DEFAULT 'pendiente',
  aprobado_en     TIMESTAMPTZ,                              -- inicio de las 24 hs de vigencia
  resuelto_en     TIMESTAMPTZ,
  revisado_por    BIGINT REFERENCES usuarios(id) ON DELETE SET NULL,
  revisado_en     TIMESTAMPTZ,
  motivo_rechazo  TEXT,
  retirado_por    BIGINT REFERENCES usuarios(id) ON DELETE SET NULL,
  retirado_en     TIMESTAMPTZ,
  ia_veredicto    veredicto_ia,
  ia_confianza    NUMERIC(3,2) CHECK (ia_confianza BETWEEN 0 AND 1),
  ia_motivo       TEXT,
  ia_analizado_en TIMESTAMPTZ,
  creado_en       TIMESTAMPTZ  NOT NULL DEFAULT now(),
  actualizado_en  TIMESTAMPTZ  NOT NULL DEFAULT now()
);

-- ---------- Confirmaciones comunitarias (RF-14) ----------
-- Que no se confirme un reporte propio se valida en el backend.
CREATE TABLE confirmaciones (
  id          BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  reporte_id  BIGINT      NOT NULL REFERENCES reportes(id) ON DELETE CASCADE,
  usuario_id  BIGINT      NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  creado_en   TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (reporte_id, usuario_id)                           -- una por usuario y alerta
);

-- ---------- Índices ----------
CREATE INDEX idx_reportes_estado  ON reportes (estado, aprobado_en);
CREATE INDEX idx_reportes_usuario ON reportes (usuario_id, creado_en);   -- límite diario (RF-09)
CREATE INDEX idx_reportes_creado  ON reportes (creado_en);               -- retención (RF-24)
CREATE INDEX idx_eventos_estado   ON eventos  (estado, inicio);
CREATE INDEX idx_eventos_usuario  ON eventos  (propuesto_por, creado_en);
CREATE INDEX idx_tokens_usuario   ON tokens_usuario (usuario_id, tipo, creado_en);  -- reenvíos (RF-03)

-- ---------- Vistas públicas: lo que consume el mapa ----------
-- Alertas activas: aprobadas y con menos de 24 hs desde su aprobación (RF-11).
CREATE VIEW reportes_activos AS
  SELECT id, tipo, descripcion, direccion, barrio, lat, lng, aprobado_en
  FROM reportes
  WHERE estado = 'aprobado'
    AND aprobado_en > now() - interval '24 hours';

-- Eventos vigentes: aprobados y hasta 24 hs después de que sucedieron (RF-12).
CREATE VIEW eventos_vigentes AS
  SELECT id, nombre, categoria, modalidad, descripcion, lugar_nombre, direccion,
         barrio, lat, lng, inicio, fin, flyer_url, etiquetas
  FROM eventos
  WHERE estado = 'aprobado'
    AND COALESCE(fin, inicio) + interval '24 hours' > now();

-- ---------- Retención de datos (RF-24) ----------
-- Tarea diaria (GitHub Actions o al iniciar el servidor):
--   DELETE FROM reportes WHERE creado_en < now() - interval '1 year';
--   UPDATE eventos SET propuesto_por = NULL
--     WHERE propuesto_por IS NOT NULL AND creado_en < now() - interval '1 year';
--   DELETE FROM tokens_usuario WHERE expira_en < now() - interval '7 days';
