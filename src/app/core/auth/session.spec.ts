import { DOCUMENT } from '@angular/common';
import { provideHttpClient, withFetch } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';

import { db } from '../../../testing/msw/db';
import { Session } from './session';

describe('Session', () => {
  const assign = vi.fn();

  beforeEach(() => {
    assign.mockReset();
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withFetch()),
        { provide: DOCUMENT, useValue: { ...document, location: { assign } } },
      ],
    });
  });

  it('loads the current user from GET /me', async () => {
    const session = TestBed.inject(Session);
    await session.load();
    expect(session.status()).toBe('authenticated');
    expect(session.user()?.username).toBe('ana');
    expect(session.initials()).toBe('AA');
  });

  it('exposes the permissions and contracted modules of GET /me', async () => {
    db.me = { ...db.me!, permissions: ['company:read'], modules: ['invoicing'] };
    const session = TestBed.inject(Session);
    await session.load();
    expect(session.can('company:read')).toBe(true);
    expect(session.can('company:edit')).toBe(false);
    expect(session.hasModule('invoicing')).toBe(true);
    expect(session.hasModule('crm')).toBe(false);
  });

  it('has no permissions without a session', async () => {
    db.me = null;
    const session = TestBed.inject(Session);
    await session.load();
    expect(session.can('company:read')).toBe(false);
  });

  it('is anonymous when the BFF answers 401', async () => {
    db.me = null;
    const session = TestBed.inject(Session);
    await session.load();
    expect(session.status()).toBe('anonymous');
  });

  it('navigates to the Keycloak logout URL returned by the BFF', async () => {
    const session = TestBed.inject(Session);
    await session.load();
    await session.logout();
    expect(assign).toHaveBeenCalledWith('/');
    expect(session.status()).toBe('anonymous');
  });

  it('starts the OIDC login through the BFF', () => {
    TestBed.inject(Session).login();
    expect(assign).toHaveBeenCalledWith('/oauth2/authorization/keycloak');
  });
});
