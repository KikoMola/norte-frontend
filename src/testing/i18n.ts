import { Provider } from '@angular/core';
import {
  TranslateLoader,
  TranslationObject,
  provideTranslateLoader,
  provideTranslateService,
} from '@ngx-translate/core';
import { Observable, of } from 'rxjs';

import companiesEn from '../../public/i18n/companies/en.json';
import companiesEs from '../../public/i18n/companies/es.json';
import coreEn from '../../public/i18n/core/en.json';
import coreEs from '../../public/i18n/core/es.json';
import settingsEn from '../../public/i18n/settings/en.json';
import settingsEs from '../../public/i18n/settings/es.json';

const translations: Record<string, TranslationObject> = {
  es: { ...coreEs, ...companiesEs, ...settingsEs },
  en: { ...coreEn, ...companiesEn, ...settingsEn },
};

class StaticLoader implements TranslateLoader {
  getTranslation(lang: string): Observable<TranslationObject> {
    return of(translations[lang] ?? translations['es']);
  }
}

/** Traducciones reales sin HTTP para tests y stories: todas las features en un único servicio raíz. */
export function provideTestTranslations(lang: 'es' | 'en' = 'es'): Provider[] {
  return provideTranslateService({
    lang,
    fallbackLang: 'es',
    loader: provideTranslateLoader(StaticLoader),
  });
}
