-- =====================================================================
-- TucuMaps — Esquema de base de datos (PostgreSQL)
-- Basado en el SRS v1.7. Los números RF-xx referencian ese documento.
-- =====================================================================

-- ---------- Tipos ----------
CREATE TYPE rol_usuario     AS ENUM ('ciudadano', 'admin');
CREATE TYPE estado_revision AS ENUM ('pendiente', 'aprobado', 'rechazado');
CREATE TYPE estado_reporte  AS ENUM ('pendiente', 'aprobado', 'rechazado', 'resuelto');
CREATE TYPE veredicto_ia    AS ENUM ('probable_real', 'dudoso', 'probable_broma_o_spam');
CREATE TYPE tipo_token      AS ENUM ('verificar_email', 'recuperar_password');

-- ---------- Usuarios (RF-01, RF-03, RF-04, RF-16) ----------
-- El primer administrador se inserta manualmente con rol = 'admin'.
CREATE TABLE usuarios (
  id                    BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  nombre                VARCHAR(80)  NOT NULL,
  email                 VARCHAR(255) NOT NULL UNIQUE,
  password_hash         VARCHAR(100) NOT NULL,              -- bcrypt
  rol                   rol_usuario  NOT NULL DEFAULT 'ciudadano',
  email_verificado      BOOLEAN      NOT NULL DEFAULT FALSE,
  bloqueado             BOOLEAN      NOT NULL DEFAULT FALSE,
  terminos_aceptados_en TIMESTAMPTZ  NOT NULL,
  creado_en             TIMESTAMPTZ  NOT NULL DEFAULT now()
);

-- Tokens de un solo uso con vencimiento (RF-03)
CREATE TABLE tokens_usuario (
  id          BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  usuario_id  BIGINT       NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  tipo        tipo_token   NOT NULL,
  token_hash  VARCHAR(100) NOT NULL UNIQUE,                 -- se guarda el hash, no el token
  expira_en   TIMESTAMPTZ  NOT NULL,
  usado_en    TIMESTAMPTZ
);

-- ---------- Lugares (RF-02, RF-13) ----------
-- Los CHECK de lat/lng son una caja aproximada de la provincia de Tucumán (RF-10).
CREATE TABLE lugares (
  id                  BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  nombre              VARCHAR(150) NOT NULL,
  categoria           VARCHAR(40)  NOT NULL DEFAULT 'historico',   -- historico, turistico, gastronomia...
  descripcion         TEXT,
  contenido_historico TEXT,
  direccion           VARCHAR(200),
  barrio              VARCHAR(80),
  horarios            VARCHAR(200),
  imagen_url          VARCHAR(500) CHECK (imagen_url ~* '^https?://'),
  lat                 NUMERIC(9,6) NOT NULL CHECK (lat BETWEEN -28.0 AND -26.0),
  lng                 NUMERIC(9,6) NOT NULL CHECK (lng BETWEEN -66.5 AND -64.5),
  activo              BOOLEAN      NOT NULL DEFAULT TRUE,
  creado_por          BIGINT REFERENCES usuarios(id),
  creado_en           TIMESTAMPTZ  NOT NULL DEFAULT now(),
  actualizado_en      TIMESTAMPTZ  NOT NULL DEFAULT now()
);

-- ---------- Eventos (RF-07, RF-08, RF-12, RF-20) ----------
CREATE TABLE eventos (
  id              BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  nombre          VARCHAR(150) NOT NULL,
  categoria       VARCHAR(40)  NOT NULL,
  modalidad       VARCHAR(30)  NOT NULL,                    -- gratuita, entrada, a la gorra
  descripcion     TEXT         NOT NULL,
  lugar_nombre    VARCHAR(150) NOT NULL,
  direccion       VARCHAR(200) NOT NULL,
  barrio          VARCHAR(80)  NOT NULL,
  lugar_id        BIGINT REFERENCES lugares(id) ON DELETE SET NULL,   -- sede opcional
  lat             NUMERIC(9,6) NOT NULL CHECK (lat BETWEEN -28.0 AND -26.0),
  lng             NUMERIC(9,6) NOT NULL CHECK (lng BETWEEN -66.5 AND -64.5),
  inicio          TIMESTAMPTZ  NOT NULL,
  fin             TIMESTAMPTZ,                              -- opcional
  flyer_url       VARCHAR(500) CHECK (flyer_url ~* '^https?://'),
  etiquetas       TEXT[]       NOT NULL DEFAULT '{}',
  estado          estado_revision NOT NULL DEFAULT 'pendiente',
  propuesto_por   BIGINT       NOT NULL REFERENCES usuarios(id),
  -- moderación (RF-15)
  revisado_por    BIGINT REFERENCES usuarios(id),
  revisado_en     TIMESTAMPTZ,
  motivo_rechazo  TEXT,
  -- pre-validación con IA (RF-20); NULL = sin analizar
  ia_veredicto    veredicto_ia,
  ia_confianza    NUMERIC(3,2) CHECK (ia_confianza BETWEEN 0 AND 1),
  ia_motivo       TEXT,
  ia_analizado_en TIMESTAMPTZ,
  creado_en       TIMESTAMPTZ  NOT NULL DEFAULT now()
);

-- ---------- Reportes de seguridad (RF-07, RF-08, RF-11, RF-15, RF-20) ----------
CREATE TABLE reportes (
  id              BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  usuario_id      BIGINT       NOT NULL REFERENCES usuarios(id),  -- nunca se expone públicamente (RF-04)
  tipo            VARCHAR(40)  NOT NULL,                    -- robo, zona peligrosa, etc.
  descripcion     TEXT         NOT NULL,
  direccion       VARCHAR(200),
  barrio          VARCHAR(80),
  lat             NUMERIC(9,6) NOT NULL CHECK (lat BETWEEN -28.0 AND -26.0),
  lng             NUMERIC(9,6) NOT NULL CHECK (lng BETWEEN -66.5 AND -64.5),
  estado          estado_reporte NOT NULL DEFAULT 'pendiente',
  aprobado_en     TIMESTAMPTZ,                              -- inicio de las 24 hs de vigencia
  resuelto_en     TIMESTAMPTZ,
  revisado_por    BIGINT REFERENCES usuarios(id),
  revisado_en     TIMESTAMPTZ,
  motivo_rechazo  TEXT,
  ia_veredicto    veredicto_ia,
  ia_confianza    NUMERIC(3,2) CHECK (ia_confianza BETWEEN 0 AND 1),
  ia_motivo       TEXT,
  ia_analizado_en TIMESTAMPTZ,
  creado_en       TIMESTAMPTZ  NOT NULL DEFAULT now()
);

-- ---------- Confirmaciones comunitarias (RF-14) ----------
-- Que no se confirme un reporte propio se valida en el backend.
CREATE TABLE confirmaciones (
  id          BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  reporte_id  BIGINT      NOT NULL REFERENCES reportes(id) ON DELETE CASCADE,
  usuario_id  BIGINT      NOT NULL REFERENCES usuarios(id),
  creado_en   TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (reporte_id, usuario_id)                           -- una por usuario y alerta
);

-- ---------- Índices ----------
CREATE INDEX idx_reportes_estado  ON reportes (estado, aprobado_en);
CREATE INDEX idx_reportes_usuario ON reportes (usuario_id, creado_en);   -- límite diario (RF-09)
CREATE INDEX idx_eventos_estado   ON eventos  (estado, inicio);
CREATE INDEX idx_eventos_usuario  ON eventos  (propuesto_por, creado_en);

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
