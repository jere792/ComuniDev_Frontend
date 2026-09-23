import { Component } from '@angular/core';
import { AboutHero } from '@landing/pages/about/hero/hero';
import { AboutMission } from '@landing/pages/about/mission/mission';
import { AboutValues } from '@landing/pages/about/values/values';
import { AboutTeam } from '@landing/pages/about/team/team';

@Component({
  selector: 'app-about',
  imports: [AboutHero, AboutMission, AboutValues, AboutTeam],
  templateUrl: './about.html',
  styleUrl: './about.scss',
})
export class About {}
