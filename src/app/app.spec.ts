import { TestBed } from '@angular/core/testing';

import { db } from '../testing/msw/db';
import { provideTestApp, settle } from '../testing/providers';
import { App } from './app';
import { Session } from './core/auth/session';

describe('App', () => {
  async function render() {
    TestBed.configureTestingModule({ imports: [App], providers: provideTestApp() });
    await TestBed.inject(Session).load();
    const fixture = TestBed.createComponent(App);
    await settle(fixture);
    return fixture.nativeElement as HTMLElement;
  }

  it('shows the shell with the navigation when there is a session', async () => {
    const element = await render();
    expect(element.querySelector('nav[aria-label="Navegación principal"]')).not.toBeNull();
    expect(element.textContent).toContain('Empresas');
    expect(element.textContent).toContain('Ana Acme');
  });

  it('invites to sign in when there is no session', async () => {
    db.me = null;
    const element = await render();
    expect(element.querySelector('button')?.textContent).toContain('Iniciar sesión');
    expect(element.querySelector('nav')).toBeNull();
  });
});
