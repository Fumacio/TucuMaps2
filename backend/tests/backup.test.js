// Copias de seguridad (SRS 4.3): npm run backup. Solo la lógica pura; el pg_dump real
// se prueba a mano porque necesita el programa instalado.
const path = require('node:path');
const {
  conexion,
  entornoPgDump,
  leerConfiguracion,
  nombreArchivo,
  fechaDeArchivo,
  archivosVencidos,
} = require('../scripts/backup');

describe('conexion', () => {
  test('saca la contraseña de la cadena y deja el resto para pg_dump', () => {
    const c = conexion('postgresql://tm_user:cl%40ve@ep-ejemplo.us-east-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require');
    expect(c.password).toBe('cl@ve');
    expect(c.dbname).toBe('postgresql://tm_user@ep-ejemplo.us-east-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require');
    expect(c.dbname).not.toContain('cl');
    expect(c.destino).toBe('ep-ejemplo.us-east-2.aws.neon.tech/neondb');
  });

  test('rechaza lo que no es una cadena de PostgreSQL', () => {
    expect(() => conexion('mysql://u:p@h/db')).toThrow(/postgres/);
    expect(() => conexion('no es una url')).toThrow(/válida/);
  });
});

describe('entornoPgDump', () => {
  test('saca las PG* de la terminal y pone solo la contraseña', () => {
    const e = entornoPgDump({ PATH: '/bin', PGSSLMODE: 'disable', pghost: 'otro', PGPASSWORD: 'vieja' }, 'nueva');
    expect(e).toEqual({ PATH: '/bin', PGPASSWORD: 'nueva' });
  });
});

describe('leerConfiguracion', () => {
  const url = 'postgres://u:p@h/db';

  test('valores por defecto, también si la variable quedó vacía en el .env', () => {
    const c = leerConfiguracion({ BACKUP_DATABASE_URL: url, BACKUP_DIAS: '', BACKUP_DIR: '' });
    expect(c.dias).toBe(30);
    expect(c.carpeta).toBe(path.resolve(__dirname, '..', 'backups'));
    expect(c.pgDump).toBe('pg_dump');
  });

  test('exige la cadena de conexión y días válidos', () => {
    expect(() => leerConfiguracion({})).toThrow(/BACKUP_DATABASE_URL/);
    expect(() => leerConfiguracion({ BACKUP_DATABASE_URL: url, BACKUP_DIAS: '0' })).toThrow(/BACKUP_DIAS/);
    expect(() => leerConfiguracion({ BACKUP_DATABASE_URL: url, BACKUP_DIAS: '7.5' })).toThrow(/BACKUP_DIAS/);
  });
});

describe('nombre de las copias', () => {
  test('lleva la fecha en UTC, sin ":" (Windows), y se puede leer de vuelta', () => {
    const fecha = new Date('2026-10-24T04:30:15.123Z');
    const nombre = nombreArchivo(fecha);
    expect(nombre).toBe('tucumaps-2026-10-24T04-30-15Z.dump');
    expect(fechaDeArchivo(nombre)).toEqual(new Date('2026-10-24T04:30:15Z'));
  });

  test('otros archivos no se reconocen como copias', () => {
    expect(fechaDeArchivo('notas.txt')).toBeNull();
    expect(fechaDeArchivo('tucumaps-2026-13-45T99-99-99Z.dump')).toBeNull();
  });
});

describe('archivosVencidos (30 días, Política de Privacidad)', () => {
  const ahora = new Date('2026-11-30T12:00:00Z');

  test('borra solo las copias de más de 30 días y nunca otros archivos', () => {
    const nombres = [
      'tucumaps-2026-10-30T11-59-59Z.dump', // 31 días: se borra
      'tucumaps-2026-10-31T12-00-00Z.dump', // 30 días justos: se queda
      'tucumaps-2026-11-29T12-00-00Z.dump', // ayer: se queda
      'tucumaps-2026-01-01T00-00-00Z.dump.parcial', // copia cortada vieja: se borra
      'tucumaps-2026-11-30T11-00-00Z.dump.parcial', // puede estar en curso: se queda
      'importante.sql',
    ];
    expect(archivosVencidos(nombres, ahora, 30)).toEqual([
      'tucumaps-2026-10-30T11-59-59Z.dump',
      'tucumaps-2026-01-01T00-00-00Z.dump.parcial',
    ]);
  });

  test('con otra cantidad de días', () => {
    expect(archivosVencidos(['tucumaps-2026-11-28T12-00-00Z.dump'], ahora, 1)).toHaveLength(1);
  });
});
