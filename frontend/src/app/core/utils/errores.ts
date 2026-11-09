import { HttpErrorResponse } from '@angular/common/http';

// Convierte cualquier error HTTP en una lista de mensajes legibles para el usuario
export function mensajesDeError(err: unknown): string[] {
  if (!(err instanceof HttpErrorResponse)) return ['Ocurrió un error inesperado'];
  if (err.status === 0) return ['No se pudo conectar con el servidor. Intentá de nuevo en unos minutos.'];
  if (err.status === 413) return ['El archivo es demasiado grande'];

  const mensaje = err.error?.message;
  if (Array.isArray(mensaje)) return mensaje;
  if (typeof mensaje === 'string') return [mensaje];
  return ['Ocurrió un error inesperado'];
}
