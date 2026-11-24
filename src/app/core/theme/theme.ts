import { DOCUMENT } from '@angular/common';
import { Injectable, computed, effect, inject, signal } from '@angular/core';

export type ThemePreference = 'light' | 'dark' | 'system';

const STORAGE_KEY = 'norte.theme';

/** Tema claro u oscuro. Pone data-theme="light|dark" en <html>, que elige los tokens de styles/tokens.css. */
@Injectable({ providedIn: 'root' })
export class Theme {
  private readonly document = inject(DOCUMENT);
  private readonly window = this.document.defaultView;
  private readonly media = this.window?.matchMedia?.('(prefers-color-scheme: dark)');

  private readonly systemDark = signal(this.media?.matches ?? false);

  readonly preference = signal<ThemePreference>(this.readStoredPreference());
  readonly resolved = computed<'light' | 'dark'>(() => {
    const preference = this.preference();
    if (preference === 'system') {
      return this.systemDark() ? 'dark' : 'light';
    }
    return preference;
  });

  constructor() {
    this.media?.addEventListener('change', (event) => this.systemDark.set(event.matches));
    effect(() => {
      this.document.documentElement.setAttribute('data-theme', this.resolved());
    });
  }

  set(preference: ThemePreference): void {
    this.preference.set(preference);
    this.storage()?.setItem(STORAGE_KEY, preference);
  }

  toggle(): void {
    this.set(this.resolved() === 'dark' ? 'light' : 'dark');
  }

  private readStoredPreference(): ThemePreference {
    const stored = this.storage()?.getItem(STORAGE_KEY);
    return stored === 'light' || stored === 'dark' || stored === 'system' ? stored : 'system';
  }

  private storage(): Storage | null {
    try {
      return this.window?.localStorage ?? null;
    } catch {
      return null;
    }
  }
}
