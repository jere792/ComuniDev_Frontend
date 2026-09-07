import { Component } from '@angular/core';
import { AboutHero } from './hero/hero';
import { AboutMission } from './mission/mission';
import { AboutValues } from './values/values';
import { AboutTeam } from './team/team';

@Component({
  selector: 'app-about',
  imports: [AboutHero, AboutMission, AboutValues, AboutTeam],
  templateUrl: './about.html',
  styleUrl: './about.scss',
})
export class About {}
