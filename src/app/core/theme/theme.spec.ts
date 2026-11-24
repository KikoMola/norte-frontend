import { DOCUMENT } from '@angular/common';
import { TestBed } from '@angular/core/testing';

import { Theme } from './theme';

describe('Theme', () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.removeAttribute('data-theme');
  });

  it('sets data-theme when the preference is dark', () => {
    const theme = TestBed.inject(Theme);
    theme.set('dark');
    TestBed.tick();
    expect(TestBed.inject(DOCUMENT).documentElement.getAttribute('data-theme')).toBe('dark');
    expect(localStorage.getItem('norte.theme')).toBe('dark');
  });

  it('toggles between light and dark', () => {
    const theme = TestBed.inject(Theme);
    theme.set('light');
    theme.toggle();
    expect(theme.resolved()).toBe('dark');
    theme.toggle();
    expect(theme.resolved()).toBe('light');
  });

  it('restores the stored preference', () => {
    localStorage.setItem('norte.theme', 'dark');
    expect(TestBed.inject(Theme).preference()).toBe('dark');
  });
});
