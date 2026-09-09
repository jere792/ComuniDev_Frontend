import { Component } from '@angular/core';

@Component({
  selector: 'app-recruiter-profile',
  templateUrl: './profile.html',
  styleUrl: './profile.scss',
})
export class RecruiterProfile {
  profile = {
    name: 'Juan Perez',
    email: 'juan@empresa.com',
    company: 'TechCorp',
    role: 'Reclutador Senior',
    avatar: 'https://i.pravatar.cc/150?img=12',
    stats: {
      candidates: 156,
      offers: 12,
      interviews: 48,
    },
  };
}
