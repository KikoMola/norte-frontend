import { ChangeDetectionStrategy, Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { db } from '../../../testing/msw/db';
import { provideTestApp, settle } from '../../../testing/providers';
import { Can } from './can';
import { Session } from './session';

@Component({
  imports: [Can],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <button *appCan="'invoice:issue'" type="button">Emitir</button>
    <button *appCan="['company:edit', 'settings:edit']" type="button">Editar</button>
    <p *appCan="'settings:edit'; else readOnly">Ajustes</p>
    <ng-template #readOnly><p>Solo lectura</p></ng-template>
  `,
})
class Host {}

async function render(permissions: string[]) {
  db.me = { ...db.me!, permissions };
  TestBed.configureTestingModule({ providers: provideTestApp() });
  await TestBed.inject(Session).load();
  const fixture = TestBed.createComponent(Host);
  await settle(fixture);
  return fixture.nativeElement as HTMLElement;
}

describe('*appCan', () => {
  it('shows the content when the user has the permission', async () => {
    const element = await render(['invoice:issue', 'settings:edit']);
    expect(element.textContent).toContain('Emitir');
    expect(element.textContent).toContain('Ajustes');
    expect(element.textContent).not.toContain('Solo lectura');
  });

  it('hides it, or shows the else template, without the permission', async () => {
    const element = await render(['company:read']);
    expect(element.textContent).not.toContain('Emitir');
    expect(element.textContent).not.toContain('Editar');
    expect(element.textContent).toContain('Solo lectura');
  });

  it('accepts any permission of a list', async () => {
    const element = await render(['company:edit']);
    expect(element.textContent).toContain('Editar');
  });
});
