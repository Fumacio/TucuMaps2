const { z } = require('zod');

const email = z
  .string({ error: 'El email es obligatorio' })
  .trim()
  .toLowerCase()
  .max(255, 'El email es demasiado largo')
  .pipe(z.email({ error: 'El email no es válido' }));

// Política de contraseñas: mínimo 8 caracteres, al menos una letra y un número (RF-01).
// El máximo evita que bcrypt la trunque en silencio (usa solo los primeros 72 bytes).
const password = z
  .string({ error: 'La contraseña es obligatoria' })
  .min(8, 'La contraseña debe tener al menos 8 caracteres')
  .refine((v) => Buffer.byteLength(v, 'utf8') <= 72, 'La contraseña es demasiado larga')
  .refine((v) => /\p{L}/u.test(v) && /\d/.test(v), 'La contraseña debe tener al menos una letra y un número');

const token = z.string({ error: 'Falta el token' }).regex(/^[a-f0-9]{64}$/, 'El token no es válido');

const registro = z.object({
  nombre: z
    .string({ error: 'El nombre es obligatorio' })
    .trim()
    .min(2, 'El nombre debe tener al menos 2 caracteres')
    .max(80, 'El nombre puede tener hasta 80 caracteres'),
  email,
  password,
  // RF-04: aceptación de términos y declaración de mayoría de edad.
  acepta_terminos: z.literal(true, { error: 'Tenés que aceptar los términos de uso' }),
  mayor_de_edad: z.literal(true, { error: 'Tenés que ser mayor de edad para registrarte' }),
});

const login = z.object({
  email,
  password: z.string({ error: 'La contraseña es obligatoria' }).min(1, 'La contraseña es obligatoria').max(200),
});

const verificarEmail = z.object({ token });
const recuperar = z.object({ email });
const restablecer = z.object({ token, password });

const cambiarPassword = z.object({
  password_actual: z.string({ error: 'Ingresá tu contraseña actual' }).min(1, 'Ingresá tu contraseña actual').max(200),
  password_nueva: password,
});

module.exports = { registro, login, verificarEmail, recuperar, restablecer, cambiarPassword };
