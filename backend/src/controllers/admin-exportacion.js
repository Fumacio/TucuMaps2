const exportacionService = require('../services/exportacion');

const TIPO_XLSX = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

// RF-26: descarga la planilla. Sigue con Cache-Control: no-store (datos del panel).
async function descargar(req, res) {
  const { archivo, nombre } = await exportacionService.generarExcel(req.validado.query, req.usuario);
  res.attachment(nombre);
  res.type(TIPO_XLSX);
  res.send(archivo);
}

module.exports = { descargar };
