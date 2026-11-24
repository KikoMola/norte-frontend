import { TestBed } from '@angular/core/testing';

import { App } from './app';

describe('App', () => {
  it('creates the root component', () => {
    TestBed.configureTestingModule({ imports: [App] });
    expect(TestBed.createComponent(App).componentInstance).toBeTruthy();
  });
});
