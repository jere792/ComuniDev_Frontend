import { Component } from '@angular/core';
import { ThemeService } from '../../../../../core/services/theme.service';

@Component({
  selector: 'app-user-right-panel',
  imports: [],
  templateUrl: './user-right-panel.html',
  styleUrl: './user-right-panel.scss',
})
export class UserRightPanel {
  userName = localStorage.getItem('userName') || 'Usuario';
  userRole = localStorage.getItem('role') || 'developer';

  suggestions = [
    { name: 'Ana Garcia', role: 'Frontend Developer', avatar: 'https://i.pravatar.cc/150?img=1' },
    { name: 'Carlos Lopez', role: 'Backend Developer', avatar: 'https://i.pravatar.cc/150?img=3' },
    { name: 'Maria Rodriguez', role: 'Full Stack Developer', avatar: 'https://i.pravatar.cc/150?img=5' },
    { name: 'Pedro Martinez', role: 'DevOps Engineer', avatar: 'https://i.pravatar.cc/150?img=7' },
    { name: 'Laura Sanchez', role: 'UI/UX Designer', avatar: 'https://i.pravatar.cc/150?img=9' },
  ];

  constructor(public themeService: ThemeService) {}
}
