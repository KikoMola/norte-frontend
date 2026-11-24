import { Injectable, inject } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { RouterStateSnapshot, TitleStrategy } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';

/**
 * Título de pestaña traducido: el `title` de cada ruta es una clave (`titles.companies`) de las traducciones
 * comunes, y se vuelve a traducir al cambiar de idioma. Resultado: «Empresas · Norte».
 */
@Injectable({ providedIn: 'root' })
export class TranslatedTitleStrategy extends TitleStrategy {
  private readonly title = inject(Title);
  private readonly translate = inject(TranslateService);
  private lastKey: string | undefined;

  constructor() {
    super();
    this.translate.onLangChange.subscribe(() => this.apply());
  }

  override updateTitle(snapshot: RouterStateSnapshot): void {
    this.lastKey = this.buildTitle(snapshot);
    this.apply();
  }

  private apply(): void {
    const app = this.translate.instant('app.name');
    this.title.setTitle(this.lastKey ? `${this.translate.instant(this.lastKey)} · ${app}` : app);
  }
}
