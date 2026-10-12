// Migración inicial: traducción de docs/schema.sql (SRS v1.8).
// No se edita una vez aplicada; los cambios van en migraciones nuevas.

exports.up = (pgm) => {
  pgm.sql(`
    -- ---------- Tipos ----------
    CREATE TYPE rol_usuario     AS ENUM ('ciudadano', 'admin');
    CREATE TYPE estado_revision AS ENUM ('pendiente', 'aprobado', 'rechazado', 'cancelado', 'retirado');
    CREATE TYPE estado_reporte  AS ENUM ('pendiente', 'aprobado', 'rechazado', 'resuelto', 'cancelado', 'retirado');
    CREATE TYPE veredicto_ia    AS ENUM ('probable_real', 'dudoso', 'probable_broma_o_spam');
    CREATE TYPE tipo_token      AS ENUM ('verificar_email', 'recuperar_password');

    -- ---------- Usuarios (RF-01, RF-16, RF-03, RF-04, RF-24) ----------
    CREATE TABLE usuarios (
      id                    BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
      nombre                VARCHAR(80)  NOT NULL,
      email                 VARCHAR(255) NOT NULL UNIQUE,
      password_hash         VARCHAR(100) NOT NULL,
      rol                   rol_usuario  NOT NULL DEFAULT 'ciudadano',
      email_verificado      BOOLEAN      NOT NULL DEFAULT FALSE,
      bloqueado             BOOLEAN      NOT NULL DEFAULT FALSE,
      token_version         INTEGER      NOT NULL DEFAULT 0,
      terminos_version      VARCHAR(20)  NOT NULL,
      terminos_aceptados_en TIMESTAMPTZ  NOT NULL,
      creado_en             TIMESTAMPTZ  NOT NULL DEFAULT now()
    );

    -- Tokens de un solo uso con vencimiento (RF-03)
    CREATE TABLE tokens_usuario (
      id          BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
      usuario_id  BIGINT       NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
      tipo        tipo_token   NOT NULL,
      token_hash  VARCHAR(100) NOT NULL UNIQUE,
      expira_en   TIMESTAMPTZ  NOT NULL,
      usado_en    TIMESTAMPTZ
    );

    -- ---------- Lugares (RF-02, RF-13) ----------
    CREATE TABLE lugares (
      id                  BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
      nombre              VARCHAR(150) NOT NULL,
      categoria           VARCHAR(30)  NOT NULL DEFAULT 'historico'
                          CHECK (categoria IN ('historico', 'cultural_museo', 'natural_paisaje',
                                               'religioso', 'recreativo')),
      descripcion         TEXT,
      contenido_historico TEXT,
      fuente              VARCHAR(300),
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
      lugar_id        BIGINT REFERENCES lugares(id) ON DELETE SET NULL,
      lat             NUMERIC(9,6) NOT NULL CHECK (lat BETWEEN -28.0 AND -26.0),
      lng             NUMERIC(9,6) NOT NULL CHECK (lng BETWEEN -66.5 AND -64.5),
      inicio          TIMESTAMPTZ  NOT NULL,
      fin             TIMESTAMPTZ  CHECK (fin IS NULL OR fin > inicio),
      flyer_url       VARCHAR(500) CHECK (flyer_url ~* '^https?://'),
      etiquetas       TEXT[]       NOT NULL DEFAULT '{}',
      estado          estado_revision NOT NULL DEFAULT 'pendiente',
      propuesto_por   BIGINT REFERENCES usuarios(id) ON DELETE SET NULL,
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

    -- ---------- Reportes de seguridad (RF-07, RF-08, RF-13, RF-15, RF-20, RF-11) ----------
    CREATE TABLE reportes (
      id              BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
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
      aprobado_en     TIMESTAMPTZ,
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
    CREATE TABLE confirmaciones (
      id          BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
      reporte_id  BIGINT      NOT NULL REFERENCES reportes(id) ON DELETE CASCADE,
      usuario_id  BIGINT      NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
      creado_en   TIMESTAMPTZ NOT NULL DEFAULT now(),
      UNIQUE (reporte_id, usuario_id)
    );

    -- ---------- Índices ----------
    CREATE INDEX idx_reportes_estado  ON reportes (estado, aprobado_en);
    CREATE INDEX idx_reportes_usuario ON reportes (usuario_id, creado_en);
    CREATE INDEX idx_reportes_creado  ON reportes (creado_en);
    CREATE INDEX idx_eventos_estado   ON eventos  (estado, inicio);
    CREATE INDEX idx_eventos_usuario  ON eventos  (propuesto_por, creado_en);

    -- ---------- Vistas públicas ----------
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
  `);
};

exports.down = (pgm) => {
  pgm.sql(`
    DROP VIEW IF EXISTS eventos_vigentes;
    DROP VIEW IF EXISTS reportes_activos;
    DROP TABLE IF EXISTS confirmaciones;
    DROP TABLE IF EXISTS reportes;
    DROP TABLE IF EXISTS eventos;
    DROP TABLE IF EXISTS lugares;
    DROP TABLE IF EXISTS tokens_usuario;
    DROP TABLE IF EXISTS usuarios;
    DROP TYPE IF EXISTS tipo_token;
    DROP TYPE IF EXISTS veredicto_ia;
    DROP TYPE IF EXISTS estado_reporte;
    DROP TYPE IF EXISTS estado_revision;
    DROP TYPE IF EXISTS rol_usuario;
  `);
};
