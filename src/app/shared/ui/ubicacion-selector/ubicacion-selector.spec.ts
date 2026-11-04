import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { UbicacionSelectorComponent } from './ubicacion-selector';

@Component({
  standalone: true,
  imports: [ReactiveFormsModule, UbicacionSelectorComponent],
  template: `<form [formGroup]="form"><app-ubicacion-selector [formGroup]="form" /></form>`,
})
class HostComponent {
  form = new FormGroup({
    pais: new FormControl('Perú'),
    departamento: new FormControl(''),
    provincia: new FormControl(''),
    ciudad: new FormControl(''),
    distrito: new FormControl(''),
  });
}

describe('UbicacionSelectorComponent', () => {
  it('se crea dentro de un formGroup y conserva los formControlName', () => {
    TestBed.configureTestingModule({
      imports: [HostComponent],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });

    const fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelectorAll('select').length).toBe(4);
  });
});
