/** Países soportados en formularios (registro, empresa). */
export interface Country {
  /** Código ISO 3166-1 alfa-2, en minúsculas; sirve para la bandera en flagcdn.io */
  flag: string;
  code: string;
  /** Prefijo telefónico */
  dial: string;
  name: string;
}

export const COUNTRIES: Country[] = [
  { flag: 'pe', code: 'PE', dial: '+51', name: 'Perú' },
  { flag: 'mx', code: 'MX', dial: '+52', name: 'México' },
  { flag: 'ar', code: 'AR', dial: '+54', name: 'Argentina' },
  { flag: 'cl', code: 'CL', dial: '+56', name: 'Chile' },
  { flag: 'co', code: 'CO', dial: '+57', name: 'Colombia' },
  { flag: 've', code: 'VE', dial: '+58', name: 'Venezuela' },
  { flag: 'ec', code: 'EC', dial: '+593', name: 'Ecuador' },
  { flag: 'uy', code: 'UY', dial: '+598', name: 'Uruguay' },
  { flag: 'us', code: 'US', dial: '+1', name: 'Estados Unidos' },
  { flag: 'es', code: 'ES', dial: '+34', name: 'España' },
  { flag: 'br', code: 'BR', dial: '+55', name: 'Brasil' },
  { flag: 'bo', code: 'BO', dial: '+591', name: 'Bolivia' },
  { flag: 'py', code: 'PY', dial: '+595', name: 'Paraguay' },
  { flag: 'cr', code: 'CR', dial: '+506', name: 'Costa Rica' },
  { flag: 'pa', code: 'PA', dial: '+507', name: 'Panamá' },
  { flag: 'gt', code: 'GT', dial: '+502', name: 'Guatemala' },
  { flag: 'do', code: 'DO', dial: '+1', name: 'República Dominicana' },
  { flag: 'cu', code: 'CU', dial: '+53', name: 'Cuba' },
];
