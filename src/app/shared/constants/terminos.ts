/**
 * Identifica qué texto de términos aceptó el usuario al registrarse:
 * el backend solo lo guarda en el usuario (campo terminosVersion).
 *
 * Misma convención y mismo valor que la app móvil (Comunidev_App →
 * TextosLegales.VERSION). Si cambia el texto de los términos, actualizar
 * aquí, en la app móvil y en el diálogo de registro (register.html).
 */
export const TERMINOS_VERSION = '1.0';

/** Fecha de la última revisión del texto, para mostrarla junto a la versión. */
export const TERMINOS_ACTUALIZACION = 'Septiembre 2026';
