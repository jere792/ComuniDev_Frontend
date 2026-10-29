# ComuniDev — Web (Angular)

Frontend web de **ComuniDev**: red social profesional y bolsa de empleo para
desarrolladores, reclutadores y empresas. Habla con el backend
`ComuniDev_Backend` (Spring Boot) por **GraphQL** (pantallas) y **REST**
(auth, upload, reportes, talento, música).

## Cómo se corre

```bash
npm install
npm start      # ng serve → http://localhost:4200
npm run build  # build de producción (dist/)
```

En desarrollo el backend debe estar en `http://127.0.0.1:8080/api/v1`
(p. ej. el contenedor Docker local de `ComuniDev_Backend`).

## Configuración (environments)

| Archivo | Cuándo se usa | `apiUrl` |
|---|---|---|
| `src/environments/environment.ts` | desarrollo (`ng serve`) | `http://127.0.0.1:8080/api/v1` |
| `src/environments/environment.prod.ts` | producción (`npm run build`) | `https://comunidevbackend-production.up.railway.app/api/v1` |

Despliegue: Cloudflare Pages (`https://comunidev.pages.dev`) ejecuta el build de
producción contra Railway. Cambiar `environment.prod.ts` implica reconstruir y
redeployar.

## Estructura

- `src/app/core` — servicios transversales (auth, upload, reportes, tema, idioma, toasts…).
- `src/app/features` — pantallas por rol (`auth`, `developer`, `recruiter`, …) en cortes
  `pages/` + `data-access/`, con `*-graphql.service.ts` para GraphQL y
  `auth-http.service.ts` para REST.
- `src/app/landing` y `src/app/shared` — portada y elementos compartidos.

Más detalle de la arquitectura y del patrón de carpetas en [`doc/README.md`](doc/README.md).

---

# README original (Angular CLI)

This project was generated using [Angular CLI](https://github.com/angular/angular-cli) version 21.0.5.

## Development server

To start a local development server, run:

```bash
ng serve
```

Once the server is running, open your browser and navigate to `http://localhost:4200/`. The application will automatically reload whenever you modify any of the source files.

## Code scaffolding

Angular CLI includes powerful code scaffolding tools. To generate a new component, run:

```bash
ng generate component component-name
```

For a complete list of available schematics (such as `components`, `directives`, or `pipes`), run:

```bash
ng generate --help
```

## Building

To build the project run:

```bash
ng build
```

This will compile your project and store the build artifacts in the `dist/` directory. By default, the production build optimizes your application for performance and speed.

## Running unit tests

To execute unit tests with the [Vitest](https://vitest.dev/) test runner, use the following command:

```bash
ng test
```

## Quality and load testing (planned)

Besides unit tests (Vitest), the project will add:

- **SonarQube / SonarCloud** – static code quality analysis (bugs, code smells, duplicated code) with a CI quality gate.
- **k6** – API load and performance testing (feed, login, GraphQL); it complements the unit tests, it does not replace them.

## Running end-to-end tests

For end-to-end (e2e) testing, run:

```bash
ng e2e
```

Angular CLI does not come with an end-to-end testing framework by default. You can choose one that suits your needs.

## Additional Resources

For more information on using the Angular CLI, including detailed command references, visit the [Angular CLI Overview and Command Reference](https://angular.dev/tools/cli) page.
