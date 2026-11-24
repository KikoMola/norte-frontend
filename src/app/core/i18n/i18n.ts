import { DOCUMENT } from '@angular/common';
import {
  EnvironmentProviders,
  Injectable,
  Provider,
  computed,
  inject,
  makeEnvironmentProviders,
} from '@angular/core';
import {
  TranslateService,
  provideChildTranslateService,
  provideTranslateService,
} from '@ngx-translate/core';
import { provideTranslateHttpLoader } from '@ngx-translate/http-loader';
import { firstValueFrom } from 'rxjs';

/** Idiomas de la interfaz. El español es el idioma por defecto y el de respaldo. */
export const LANGUAGES = ['es', 'en'] as const;
export type Language = (typeof LANGUAGES)[number];
export const DEFAULT_LANGUAGE: Language = 'es';

const STORAGE_KEY = 'norte.lang';

/**
 * Traducciones comunes (shell, ui, errores): public/i18n/core/{lang}.json.
 * Claves por módulo: `shell.nav.companies`, `ui.table.empty`, `errors.company.tax_id.duplicate`.
 */
export function provideI18n(): Provider[] {
  return provideTranslateService({
    lang: DEFAULT_LANGUAGE,
    fallbackLang: DEFAULT_LANGUAGE,
    loader: provideTranslateHttpLoader({ prefix: '/i18n/core/', suffix: '.json' }),
  });
}

/**
 * Traducciones de una feature, cargadas de forma diferida con su ruta: public/i18n/{feature}/{lang}.json.
 * Se usa en `providers` de la ruta lazy; el servicio hijo hereda las claves comunes del raíz.
 */
export function provideFeatureTranslations(feature: string): EnvironmentProviders {
  return makeEnvironmentProviders(
    provideChildTranslateService({
      loader: provideTranslateHttpLoader({ prefix: `/i18n/${feature}/`, suffix: '.json' }),
    }),
  );
}

/** Idioma actual de la interfaz, persistido y reflejado en <html lang>. */
@Injectable({ providedIn: 'root' })
export class I18n {
  private readonly translate = inject(TranslateService);
  private readonly document = inject(DOCUMENT);

  readonly current = computed<Language>(() => toLanguage(this.translate.currentLang()));
  readonly languages = LANGUAGES;

  /** Idioma guardado o, si no hay, el del navegador si está soportado. */
  initialLanguage(): Language {
    const stored = this.storage()?.getItem(STORAGE_KEY);
    if (stored && isLanguage(stored)) {
      return stored;
    }
    const browser = this.document.defaultView?.navigator.language.slice(0, 2) ?? '';
    return isLanguage(browser) ? browser : DEFAULT_LANGUAGE;
  }

  async use(language: Language): Promise<void> {
    await firstValueFrom(this.translate.use(language));
    this.document.documentElement.lang = language;
    this.storage()?.setItem(STORAGE_KEY, language);
  }

  /** Siguiente idioma de la lista (botón de la barra superior). */
  next(): Language {
    const index = LANGUAGES.indexOf(this.current());
    return LANGUAGES[(index + 1) % LANGUAGES.length];
  }

  private storage(): Storage | null {
    try {
      return this.document.defaultView?.localStorage ?? null;
    } catch {
      return null;
    }
  }
}

function isLanguage(value: string): value is Language {
  return (LANGUAGES as readonly string[]).includes(value);
}

function toLanguage(value: string | null | undefined): Language {
  return value && isLanguage(value) ? value : DEFAULT_LANGUAGE;
}
