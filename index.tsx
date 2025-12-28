
import '@angular/compiler';
import { bootstrapApplication } from '@angular/platform-browser';
import { enableProdMode, provideZonelessChangeDetection } from '@angular/core';

import { AppComponent } from './src/app.component';

// Enable production mode for the application.
// This should be called before bootstrapping to disable Angular's development mode checks
// and improve performance.
enableProdMode();

bootstrapApplication(AppComponent, {
  providers: [
    provideZonelessChangeDetection()
  ]
}).catch(err => console.error(err));

// AI Studio always uses an `index.tsx` file for all project types.