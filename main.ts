import { bootstrapApplication } from '@angular/platform-browser';
import { AppComponent } from './src/app.component';

// Minimal bootstrap to provide the Angular application entrypoint expected by the build.
bootstrapApplication(AppComponent).catch(err => console.error(err));
