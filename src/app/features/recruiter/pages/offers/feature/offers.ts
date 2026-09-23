import { Component } from '@angular/core';

@Component({
  selector: 'app-recruiter-offers',
  templateUrl: './offers.html',
  styleUrl: './offers.scss',
})
export class RecruiterOffers {
  offers = [
    {
      id: 1,
      title: 'Frontend Developer Senior',
      company: 'TechCorp',
      location: 'Remoto',
      salary: '$3,000 - $5,000',
      type: 'Tiempo completo',
      posted: 'Hace 2 días',
      applicants: 24,
      status: 'active',
    },
    {
      id: 2,
      title: 'Backend Developer',
      company: 'StartupXYZ',
      location: 'Ciudad de México',
      salary: '$2,500 - $4,000',
      type: 'Tiempo completo',
      posted: 'Hace 5 días',
      applicants: 18,
      status: 'active',
    },
    {
      id: 3,
      title: 'DevOps Engineer',
      company: 'CloudTech',
      location: 'Remoto',
      salary: '$4,000 - $6,000',
      type: 'Tiempo completo',
      posted: 'Hace 1 semana',
      applicants: 31,
      status: 'paused',
    },
    {
      id: 4,
      title: 'UI/UX Designer',
      company: 'DesignStudio',
      location: 'Guadalajara',
      salary: '$2,000 - $3,500',
      type: 'Medio tiempo',
      posted: 'Hace 3 días',
      applicants: 12,
      status: 'active',
    },
  ];

  showCreateModal = false;

  openCreateModal(): void {
    this.showCreateModal = true;
  }

  closeCreateModal(): void {
    this.showCreateModal = false;
  }
}
