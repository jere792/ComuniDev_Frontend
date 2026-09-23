import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-recruiter-candidates',
  imports: [FormsModule],
  templateUrl: './candidates.html',
  styleUrl: './candidates.scss',
})
export class RecruiterCandidates {
  candidates = [
    {
      id: 1,
      name: 'Ana Garcia',
      role: 'Frontend Developer',
      skills: ['React', 'TypeScript', 'CSS'],
      avatar: 'https://i.pravatar.cc/150?img=1',
      experience: '3 años',
      available: true,
    },
    {
      id: 2,
      name: 'Carlos Lopez',
      role: 'Backend Developer',
      skills: ['Node.js', 'Python', 'PostgreSQL'],
      avatar: 'https://i.pravatar.cc/150?img=3',
      experience: '5 años',
      available: true,
    },
    {
      id: 3,
      name: 'Maria Rodriguez',
      role: 'Full Stack Developer',
      skills: ['Angular', 'Java', 'MongoDB'],
      avatar: 'https://i.pravatar.cc/150?img=5',
      experience: '4 años',
      available: false,
    },
    {
      id: 4,
      name: 'Pedro Martinez',
      role: 'DevOps Engineer',
      skills: ['AWS', 'Docker', 'Kubernetes'],
      avatar: 'https://i.pravatar.cc/150?img=7',
      experience: '6 años',
      available: true,
    },
    {
      id: 5,
      name: 'Laura Sanchez',
      role: 'UI/UX Designer',
      skills: ['Figma', 'Adobe XD', 'CSS'],
      avatar: 'https://i.pravatar.cc/150?img=9',
      experience: '2 años',
      available: true,
    },
  ];

  searchTerm = '';

  get filteredCandidates() {
    return this.candidates.filter(c =>
      c.name.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
      c.role.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
      c.skills.some(s => s.toLowerCase().includes(this.searchTerm.toLowerCase()))
    );
  }
}
