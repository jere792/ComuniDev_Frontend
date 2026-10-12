import { Injectable, inject, signal } from '@angular/core';
import { COMPANY_REPOSITORY, CompanyRepository } from '@features/recruiter/pages/company/domain/ports/company.repository';

/**
 * Resuelve `companyId` → nombre de la empresa.
 *
 * <p>`recruiter_profiles.empresas` solo guarda el `companyId`, así que las
 * tarjetas del perfil no pueden mostrar el nombre sin consultar `companies`.
 * El resultado se cachea para no repetir la petición entre componentes.
 */
@Injectable({ providedIn: 'root' })
export class CompanyNameService {
  private readonly repository = inject<CompanyRepository>(COMPANY_REPOSITORY);

  private readonly names = signal<ReadonlyMap<string, string>>(new Map());
  private loaded = false;

  /** Carga los nombres una vez; llamarlo desde `ngOnInit` es seguro repetirlo. */
  loadAll(): void {
    if (this.loaded) return;
    this.loaded = true;

    this.repository.companies().subscribe({
      next: companies => this.names.set(new Map(companies.map(c => [c.id, c.nombre]))),
      error: () => this.loaded = false,
    });
  }

  nameFor(companyId: string | null | undefined): string | null {
    if (!companyId) return null;
    return this.names().get(companyId) ?? null;
  }
}
