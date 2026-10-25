import { UrlMatchResult, UrlSegment } from '@angular/router';

/**
 * Ruta unica para `/.../messages` y `/.../messages/<userId>`.
 *
 * Angular no admite el "?" opcional en `path`: el signo se vuelve parte del nombre
 * del parametro y el segmento sigue siendo obligatorio. Con `messages/:id?` la URL
 * sin id tenia 1 segmento frente a 2 esperados, no coincidia con ninguna ruta hija
 * y la navegacion caia en el `**` del final (redirigia al inicio publico).
 *
 * El matcher propio reconoce las dos formas con la misma entrada de ruta, de modo
 * que cambiar de chat solo cambia un parametro y el componente no se recrea.
 */
export function mensajesMatcher(segments: UrlSegment[]): UrlMatchResult | null {
  if (segments.length < 1 || segments.length > 2) return null;
  if (segments[0].path !== 'messages') return null;
  return segments.length === 1
    ? { consumed: segments }
    : { consumed: segments, posParams: { id: segments[1] } };
}
