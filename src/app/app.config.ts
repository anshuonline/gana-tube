import { ApplicationConfig, provideBrowserGlobalErrorListeners, provideZonelessChangeDetection, ErrorHandler, Injectable } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';

import { routes } from './app.routes';

@Injectable()
export class GlobalErrorHandler implements ErrorHandler {
  handleError(error: any): void {
    // Ignore intentional cancellation/abort errors (e.g. rapid route switching or HTTP unsubscriptions)
    const msg = error?.message || error?.name || String(error);
    if (error?.name === 'AbortError' || msg.includes('aborted without reason') || msg.includes('AbortError')) {
      return;
    }
    console.error(error);
  }
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZonelessChangeDetection(),
    provideRouter(routes),
    provideHttpClient(),
    { provide: ErrorHandler, useClass: GlobalErrorHandler }
  ],
};
