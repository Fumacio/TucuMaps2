// Envío de correos con Nodemailer (RF-03).
// Sin SMTP configurado (desarrollo), el correo se muestra en la consola con su enlace.
const nodemailer = require('nodemailer');
const env = require('../config/env');

const transporte = env.SMTP_HOST
  ? nodemailer.createTransport({
      host: env.SMTP_HOST,
      port: env.SMTP_PORT,
      secure: env.SMTP_PORT === 465,
      auth: env.SMTP_USER ? { user: env.SMTP_USER, pass: env.SMTP_PASS } : undefined,
    })
  : null;

async function enviar({ para, asunto, texto }) {
  if (!transporte) {
    if (env.NODE_ENV !== 'test') {
      console.log(`\n[correo de desarrollo] Para: ${para}\nAsunto: ${asunto}\n${texto}\n`);
    }
    return;
  }
  await transporte.sendMail({ from: env.MAIL_FROM, to: para, subject: asunto, text: texto });
}

// No se espera el envío: si falla, se registra y la solicitud del usuario sigue igual.
function enviarEnSegundoPlano(correo) {
  enviar(correo).catch((err) => console.error('No se pudo enviar el correo:', err.message));
}

function verificacion({ nombre, email, token }) {
  const enlace = `${env.FRONTEND_URL}/verificar-email?token=${token}`;
  enviarEnSegundoPlano({
    para: email,
    asunto: 'Confirmá tu email en TucuMaps',
    texto: `Hola ${nombre}:\n\nPara confirmar tu email entrá a este enlace (vence en 24 horas):\n${enlace}\n\nSi no creaste una cuenta en TucuMaps, ignorá este correo.`,
  });
}

function recuperacion({ nombre, email, token }) {
  const enlace = `${env.FRONTEND_URL}/restablecer?token=${token}`;
  enviarEnSegundoPlano({
    para: email,
    asunto: 'Restablecé tu contraseña de TucuMaps',
    texto: `Hola ${nombre}:\n\nPara elegir una contraseña nueva entrá a este enlace (vence en 1 hora):\n${enlace}\n\nSi no lo pediste, ignorá este correo: tu contraseña no cambia.`,
  });
}

module.exports = { enviar, verificacion, recuperacion };
