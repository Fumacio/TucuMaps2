// Lee y valida las variables de entorno. Si falta algo obligatorio, el servidor no arranca.
require('dotenv').config({ quiet: true });
const { z } = require('zod');

const opcional = z.preprocess((v) => (v === '' ? undefined : v), z.string().optional());

const esquema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(3000),
  DATABASE_URL: z.string().min(1, 'DATABASE_URL es obligatoria (cadena de conexión de Neon)'),
  JWT_SECRET: z.string().min(32, 'JWT_SECRET debe tener al menos 32 caracteres'),
  FRONTEND_URL: z.url().default('http://localhost:5173'),
  TERMINOS_VERSION: z.string().min(1).default('1.0'),
  // Cantidad de proxies delante del backend (0 en desarrollo). Se ajusta al desplegar.
  TRUST_PROXY: z.coerce.number().int().min(0).default(0),
  // Correo (RF-03). Si falta SMTP_HOST, los correos se muestran en la consola.
  SMTP_HOST: opcional,
  SMTP_PORT: z.coerce.number().int().positive().default(587),
  SMTP_USER: opcional,
  SMTP_PASS: opcional,
  MAIL_FROM: z.string().default('TucuMaps <no-responder@tucumaps.local>'),
  // RF-09: máximo de envíos por usuario cada 24 horas.
  LIMITE_REPORTES_DIA: z.coerce.number().int().positive().default(5),
  LIMITE_EVENTOS_DIA: z.coerce.number().int().positive().default(3),
});

// En las pruebas se usa siempre la base de pruebas, nunca la de Neon de desarrollo.
const fuente = { ...process.env };
if (fuente.NODE_ENV === 'test') {
  fuente.DATABASE_URL = process.env.TEST_DATABASE_URL;
  fuente.JWT_SECRET = 'secreto-de-pruebas-solo-para-jest-0123456789';
}

const resultado = esquema.safeParse(fuente);
if (!resultado.success) {
  const problemas = resultado.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`);
  throw new Error(`Variables de entorno inválidas (revisá backend/.env):\n  ${problemas.join('\n  ')}`);
}

// En producción no se aceptan los valores por defecto pensados para desarrollo.
if (resultado.data.NODE_ENV === 'production') {
  const obligatorias = {
    SMTP_HOST: 'para enviar los correos (RF-03)',
    FRONTEND_URL: 'para CORS y los enlaces de los correos',
    TRUST_PROXY: 'para que el rate limiting vea la IP real detrás de Vercel y Render',
  };
  const faltantes = Object.entries(obligatorias).filter(([nombre]) => !process.env[nombre]);
  if (faltantes.length > 0) {
    throw new Error(`En producción faltan variables:\n  ${faltantes.map(([n, m]) => `${n}: ${m}`).join('\n  ')}`);
  }
}

module.exports = resultado.data;
