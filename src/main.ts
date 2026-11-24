import { bootstrapApplication } from '@angular/platform-browser';

import { App } from './app/app';
import { appConfig } from './app/app.config';
import { startMockApi } from './mock-api';

startMockApi()
  .then(() => bootstrapApplication(App, appConfig))
  .catch((err: unknown) => console.error(err));
