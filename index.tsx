
import '@angular/compiler';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import { enableProdMode } from '@angular/core';

import { AppModule } from './src/app.module';

// Enable production mode for the application.
// This should be called before bootstrapping to disable Angular's development mode checks
// and improve performance.
enableProdMode();

platformBrowserDynamic().bootstrapModule(AppModule)
  .catch(err => console.error(err));

// AI Studio always uses an `index.tsx` file for all project types.