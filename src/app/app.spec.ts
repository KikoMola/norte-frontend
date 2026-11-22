import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { App } from './app';
import { Me, Session, SessionStatus } from './core/auth/session';

describe('App', () => {
  const status = signal<SessionStatus>('anonymous');
  const user = signal<Me | null>(null);

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [{ provide: Session, useValue: { status, user, login: () => {}, logout: async () => {} } }],
    }).compileComponents();
  });

  it('offers to log in when there is no session', async () => {
    status.set('anonymous');
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    expect((fixture.nativeElement as HTMLElement).querySelector('button')?.textContent).toContain('Iniciar sesión');
  });

  it('shows the tenant of the current user', async () => {
    status.set('authenticated');
    user.set({ id: '1', username: 'ana', name: 'Ana Acme', email: 'ana@acme.test', tenantId: 't-1', roles: ['admin'] });
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('t-1');
  });
});
