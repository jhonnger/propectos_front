# ProspectosFront

This project was generated using [Angular CLI](https://github.com/angular/angular-cli) version 19.1.2.

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

## Tests

This project's frontend verification strategy is **Playwright end-to-end tests** (with a
network-mock harness in `e2e/`), not Karma/Jasmine unit specs. The auto-generated Karma
scaffold specs were removed (deuda técnica — see `PLAN_DESARROLLO.md` slice 3.4);
business-logic unit tests live in the backend (JUnit/Mockito).

Run the e2e suite (serves the app on port 4300 and intercepts network by default):

```bash
npm test          # alias of: playwright test
npm run e2e:ui    # interactive UI mode
npm run e2e:report
```

Run against a real backend instead of mocks:

```bash
E2E_BASE_API=http://localhost:8081 npm test
```

See `e2e/README.md` for harness details.

## Additional Resources

For more information on using the Angular CLI, including detailed command references, visit the [Angular CLI Overview and Command Reference](https://angular.dev/tools/cli) page.
