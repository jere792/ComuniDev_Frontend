# Features - Arquitectura Hexagonal

Cada feature sigue un patrón de arquitectura hexagonal (Ports & Adapters) con una estructura consistente.

## Estructura base

```
features/<feature>/
├── <feature>.routes.ts        ← Rutas + providers de dependencias
├── domain/
│   └── ports/                 ← Interfaces + InjectionTokens
├── data-access/
│   ├── api/                   ← Adaptadores GraphQL/REST (implementan puertos)
│   └── state/                 ← Signal stores (estado reactivo)
├── feature/                   ← Páginas (cargadas por rutas)
│   └── <page>/
│       ├── <page>.ts
│       ├── <page>.html
│       └── <page>.scss
└── ui/                        ← Componentes UI reutilizables de la feature
    └── <component>/
        ├── <component>.ts
        ├── <component>.html
        └── <component>.scss
```

### Features con layout

Las features de rol (developer, recruiter, admin, moderator) incluyen un layout propio:

```
features/<feature>/
├── main.ts                    ← Entry point del layout
├── <feature>.routes.ts
├── layout/
│   ├── <feature>-layout.ts
│   └── components/
│       ├── header/
│       ├── sidebar/
│       └── right-panel/       ← (solo developer, recruiter)
├── domain/
├── data-access/
├── feature/
└── ui/
```

## Carpetas explicadas

### `domain/ports/`
Interfaces de contrato y sus InjectionTokens de Angular. Definen QUÉ se puede hacer, no CÓMO.

```typescript
// user.repository.ts
export interface UserRepository {
  getAll(): Observable<User[]>;
  getById(id: string): Observable<User | null>;
}

export const USER_REPOSITORY = new InjectionToken<UserRepository>('UserRepository');
```

### `data-access/api/`
Implementación concreta de los puertos usando servicios HTTP, GraphQL u otras fuentes de datos.

```typescript
// user-graphql.service.ts
@Injectable()
export class UserGraphqlService implements UserRepository {
  getAll(): Observable<User[]> { /* Apollo GraphQL */ }
}
```

### `data-access/state/`
Signal stores reactivos que manejan el estado de la feature. Inyectan los puertos del dominio.

```typescript
// user.store.ts
@Injectable({ providedIn: 'root' })
export class UserStore {
  users = signal<User[]>([]);
  constructor(@Inject(USER_REPOSITORY) private repo: UserRepository) {}
}
```

### `feature/`
Páginas completas cargadas por rutas. Cada componente es una vista independiente que se renderiza al navegar a su ruta.

### `ui/`
Componentes UI reutilizables **dentro de la feature**. No son páginas completas ni se cargan por ruta.

**Van aquí:** tarjetas, badges, modales, formularios compuestos, tooltips, etc.

**NO van aquí:** páginas completas, layouts, servicios, stores.

## `ui/` vs `feature/`

| Criterio | `ui/` | `feature/` |
|---|---|---|
| Es una página completa cargada por ruta | No | Sí |
| Se reutiliza dentro de la feature | Sí | No |
| Tiene lógica de negocio | No | Sí |
| Se carga con `loadComponent` | No | Sí |
| Ejemplo | `user-card`, `role-badge`, `confirm-modal` | `users-list-page`, `dashboard` |

## `ui/` vs `shared/`

| Criterio | `ui/` (feature) | `shared/` (global) |
|---|---|---|
| Alcance | Solo esa feature | Todas las features |
| Ubicación | `features/<feature>/ui/` | `shared/ui/` o `shared/components/` |
| Reutilización | Dentro de la feature | En cualquier parte de la app |

## Ejemplo completo: feature hexagonal

```
features/users/
├── users.routes.ts
├── domain/
│   └── ports/
│       └── user.repository.ts
├── data-access/
│   ├── api/
│   │   └── user-graphql.service.ts
│   └── state/
│       └── user.store.ts
├── feature/
│   ├── users-list-page.ts
│   ├── users-list.html
│   └── users-list.scss
└── ui/
    └── user-card/
        ├── user-card.ts
        ├── user-card.html
        └── user-card.scss
```

## Ejemplo completo: feature con layout

```
features/recruiter/
├── main.ts
├── recruiter.routes.ts
├── layout/
│   ├── recruiter-layout.ts
│   ├── recruiter-layout.html
│   ├── recruiter-layout.scss
│   └── components/
│       ├── header/
│       │   └── recruiter-header.ts
│       ├── sidebar/
│       │   └── recruiter-sidebar.ts
│       └── right-panel/
│           └── recruiter-right-panel.ts
├── domain/
├── data-access/
├── feature/
│   ├── inicio/
│   ├── candidates/
│   ├── offers/
│   ├── messages/
│   ├── reels/
│   └── saved/
└── ui/
    └── candidate-card/
        ├── candidate-card.ts
        ├── candidate-card.html
        └── candidate-card.scss
```
