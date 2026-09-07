import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-landing',
  imports: [RouterOutlet],
  template: '<router-outlet />',
})
export class Landing {}
