#!/bin/bash
# SessionStart hook para sesiones de Claude Code en la nube.
# - Levanta un PostgreSQL local para pruebas y crea la base tucumaps_test.
# - Instala dependencias de npm en backend/ y frontend/ si ya existen.
# Nunca debe hacer fallar el inicio de la sesión: los pasos opcionales avisan y siguen.
set -uo pipefail

if [ "${CLAUDE_CODE_REMOTE:-}" != "true" ]; then
  exit 0
fi

cd "${CLAUDE_PROJECT_DIR:-$(pwd)}"

log() { echo "[session-start] $*" >&2; }

# ---------- PostgreSQL local para pruebas ----------
DB_NAME="tucumaps_test"
DB_USER="tucumaps"
DB_PASS="tucumaps"

if ! command -v pg_ctlcluster >/dev/null 2>&1; then
  log "PostgreSQL no está instalado; intentando instalarlo con apt..."
  (apt-get update -qq && DEBIAN_FRONTEND=noninteractive apt-get install -y -qq postgresql) >/dev/null 2>&1 \
    || log "No se pudo instalar PostgreSQL; las pruebas con base de datos no van a correr."
fi

if command -v pg_lsclusters >/dev/null 2>&1; then
  PG_VER="$(pg_lsclusters -h | awk 'NR==1{print $1}')"
  PG_CLUSTER="$(pg_lsclusters -h | awk 'NR==1{print $2}')"
  PG_PORT="$(pg_lsclusters -h | awk 'NR==1{print $3}')"
  DB_URL="postgres://${DB_USER}:${DB_PASS}@localhost:${PG_PORT:-5432}/${DB_NAME}"
  if [ -n "$PG_VER" ]; then
    pg_ctlcluster "$PG_VER" "$PG_CLUSTER" start >/dev/null 2>&1 || true
    if pg_lsclusters -h | awk 'NR==1{print $4}' | grep -q online; then
      su postgres -c "psql -p ${PG_PORT} -tAc \"SELECT 1 FROM pg_roles WHERE rolname='${DB_USER}'\"" | grep -q 1 \
        || su postgres -c "psql -p ${PG_PORT} -qc \"CREATE ROLE ${DB_USER} LOGIN SUPERUSER PASSWORD '${DB_PASS}'\""
      su postgres -c "psql -p ${PG_PORT} -tAc \"SELECT 1 FROM pg_database WHERE datname='${DB_NAME}'\"" | grep -q 1 \
        || su postgres -c "createdb -p ${PG_PORT} -O ${DB_USER} ${DB_NAME}"
      if [ -n "${CLAUDE_ENV_FILE:-}" ]; then
        echo "export TEST_DATABASE_URL=\"${DB_URL}\"" >> "$CLAUDE_ENV_FILE"
      fi
      log "PostgreSQL listo: ${DB_URL}"
    else
      log "PostgreSQL no arrancó; revisar /var/log/postgresql."
    fi
  fi
fi

# ---------- Dependencias de Node ----------
for dir in . backend frontend; do
  if [ -f "$dir/package.json" ]; then
    log "npm install en $dir"
    (cd "$dir" && npm install --no-audit --no-fund) || log "npm install falló en $dir"
  fi
done

exit 0
