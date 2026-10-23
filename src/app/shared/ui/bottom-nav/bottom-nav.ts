import { Component, Input } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

export interface BottomNavLink {
  label: string;
  route: string;
  icon?: string;
}

//barra de navegación inferior para pantallas chicas: muestra las mismas rutas
//del header, como en la app móvil
@Component({
  selector: 'app-bottom-nav',
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './bottom-nav.html',
  styleUrl: './bottom-nav.scss',
})
export class BottomNav {
  @Input() links: BottomNavLink[] = [];
}
