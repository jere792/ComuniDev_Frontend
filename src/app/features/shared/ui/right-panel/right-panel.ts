import { Component, Input } from '@angular/core';
import { ThemeService } from '../../../../core/services/theme.service';

@Component({
  selector: 'app-shared-right-panel',
  standalone: true,
  imports: [],
  templateUrl: './right-panel.html',
  styleUrl: './right-panel.scss',
})
export class SharedRightPanel {
  @Input() role: string = localStorage.getItem('role') || 'developer';
  userName = localStorage.getItem('userName') || 'Usuario';

  suggestions = [
    { name: 'Ana Garcia', role: 'Frontend Developer', avatar: 'https://i.pravatar.cc/150?img=1' },
    { name: 'Carlos Lopez', role: 'Backend Developer', avatar: 'https://i.pravatar.cc/150?img=3' },
    { name: 'Maria Rodriguez', role: 'Full Stack Developer', avatar: 'https://i.pravatar.cc/150?img=5' },
    { name: 'Pedro Martinez', role: 'DevOps Engineer', avatar: 'https://i.pravatar.cc/150?img=7' },
    { name: 'Laura Sanchez', role: 'UI/UX Designer', avatar: 'https://i.pravatar.cc/150?img=9' },
  ];

  constructor(public themeService: ThemeService) {}
}
