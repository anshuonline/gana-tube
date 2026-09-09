import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { App } from './app/app';

// Fetch dynamic configuration from the backend before bootstrapping Angular
fetch('/api/config')
  .then(response => response.json())
  .then(config => {
    // Store configuration globally so environment.ts can access it
    (window as any).__env = config;
    
    // Start Angular application
    bootstrapApplication(App, appConfig).catch((err) => console.error(err));
  })
  .catch(err => {
    console.error('Failed to load dynamic configuration', err);
    // Render a friendly error message to the DOM if configuration fails
    document.body.innerHTML = `
      <div style="font-family: sans-serif; text-align: center; margin-top: 20vh; color: #ff4444; background: #111; height: 100vh; padding-top: 50px;">
        <h2>Configuration Error</h2>
        <p>Failed to load environment configuration from the server.</p>
        <p>Please check Hostinger Environment Variables.</p>
      </div>
    `;
  });
