// RF-08: nombres claros para los estados de moderación de un reporte o un evento.
export const ESTADOS_ENVIO = {
  pendiente: 'Pendiente de revisión',
  aprobado: 'Publicado',
  rechazado: 'Rechazado',
  cancelado: 'Cancelado',
  resuelto: 'Resuelto',
  retirado: 'Retirado',
}

export function nombreDeEstado(estado) {
  return ESTADOS_ENVIO[estado] ?? estado
}
