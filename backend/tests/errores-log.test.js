// Los errores inesperados (500) se registran sin datos personales.
const express = require('express');
const request = require('supertest');
const { manejarErrores, paraElLog } = require('../src/middlewares/errores');

describe('Registro de errores inesperados', () => {
  afterEach(() => jest.restoreAllMocks());

  test('un error de PostgreSQL responde 500 genérico y no registra el detalle con los valores de la fila', async () => {
    const errorPg = Object.assign(new Error('duplicate key value violates unique constraint "usuarios_email_key"'), {
      code: '23505',
      constraint: 'usuarios_email_key',
      table: 'usuarios',
      detail: 'Key (email)=(ana@mail.com) already exists.',
    });
    const mini = express();
    mini.get('/', () => {
      throw errorPg;
    });
    mini.use(manejarErrores);
    const registrado = jest.spyOn(console, 'error').mockImplementation(() => {});

    const res = await request(mini).get('/');
    expect(res.status).toBe(500);
    expect(res.body).toEqual({
      error: { codigo: 'ERROR_INTERNO', mensaje: 'Ocurrió un error inesperado. Probá de nuevo más tarde.' },
    });
    const texto = registrado.mock.calls.flat().join('\n');
    expect(texto).toContain('usuarios_email_key');
    expect(texto).toContain('23505');
    expect(texto).not.toContain('ana@mail.com');
  });

  test('conserva la causa y los errores agrupados; lo que no es un Error no se vuelca', () => {
    const agrupado = new AggregateError([new Error('ECONNREFUSED ::1:5432'), new Error('ECONNREFUSED 127.0.0.1:5432')]);
    expect(paraElLog(agrupado).join('\n')).toContain('ECONNREFUSED 127.0.0.1:5432');
    const conCausa = new Error('falló', { cause: new Error('motivo original') });
    expect(paraElLog(conCausa).join('\n')).toContain('motivo original');
    expect(paraElLog({ detail: 'Key (email)=(ana@mail.com)' }).join(' ')).not.toContain('ana@mail.com');
  });
});
