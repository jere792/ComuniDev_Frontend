import { Component, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

interface ConfigSection {
  id: string;
  icon: string;
  label: string;
  comingSoon?: boolean;
}

@Component({
  selector: 'app-configuracion-page',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './configuracion.html',
  styleUrl: './configuracion.scss',
})
export class ConfiguracionPage {
  activeSection = signal('perfil');

  sections: ConfigSection[] = [
    { id: 'perfil', icon: 'person', label: 'Perfil' },
    { id: 'profesional', icon: 'work', label: 'Perfil profesional' },
    { id: 'redes', icon: 'public', label: 'Redes sociales' },
    { id: 'descripcion', icon: 'description', label: 'Descripción' },
    { id: 'ubicacion', icon: 'location_on', label: 'Ubicación' },
    { id: 'privacidad', icon: 'shield', label: 'Privacidad' },
    { id: 'cuenta', icon: 'account_circle', label: 'Cuenta' },
    { id: 'contrasena', icon: 'lock_reset', label: 'Cambio de contraseña' },
    { id: 'notificaciones', icon: 'notifications', label: 'Notificaciones' },
    { id: 'seguridad', icon: 'security', label: 'Seguridad', comingSoon: true },
    { id: 'idioma', icon: 'language', label: 'Idioma y región', comingSoon: true },
    { id: 'terminos', icon: 'gavel', label: 'Términos y condiciones' },
  ];

  selectSection(id: string): void {
    this.activeSection.set(id);
  }
}
