import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { AppComponent } from './app/app.component';
import { environment } from './environments/environment';

if (environment.production && (!environment.apiUrl || environment.apiUrl.includes('REPLACE_WITH'))) {
  throw new Error(
    'environment.prod.apiUrl no está configurado (placeholder REPLACE_WITH...). Configure la URL real del API antes de desplegar.'
  );
}

bootstrapApplication(AppComponent, appConfig)
  .catch((err) => console.error(err));
