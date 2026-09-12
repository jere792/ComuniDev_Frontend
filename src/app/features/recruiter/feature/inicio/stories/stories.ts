import { Component } from '@angular/core';

@Component({
  selector: 'app-stories',
  templateUrl: './stories.html',
  styleUrl: './stories.scss',
})
export class StoriesComponent {
  stories = [
    {
      name: 'Ana',
      avatar: 'https://i.pravatar.cc/150?img=1',
      gradient: 'linear-gradient(45deg, #f09433, #e6683c, #dc2743, #cc2366, #bc1888)',
    },
    {
      name: 'Carlos',
      avatar: 'https://i.pravatar.cc/150?img=3',
      gradient: 'linear-gradient(45deg, #833ab4, #fd1d1d, #fcb045)',
    },
    {
      name: 'Maria',
      avatar: 'https://i.pravatar.cc/150?img=5',
      gradient: 'linear-gradient(45deg, #00c6ff, #0072ff)',
    },
    {
      name: 'Pedro',
      avatar: 'https://i.pravatar.cc/150?img=7',
      gradient: 'linear-gradient(45deg, #f09433, #e6683c, #dc2743)',
    },
    {
      name: 'Laura',
      avatar: 'https://i.pravatar.cc/150?img=9',
      gradient: 'linear-gradient(45deg, #11998e, #38ef7d)',
    },
    {
      name: 'Diego',
      avatar: 'https://i.pravatar.cc/150?img=11',
      gradient: 'linear-gradient(45deg, #ee0979, #ff6a00)',
    },
  ];
}
