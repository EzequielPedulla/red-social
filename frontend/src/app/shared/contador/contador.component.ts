import { Component, computed, input } from '@angular/core';

// Contador "usados/máximo". Se pone en rojo al llegar al límite y en naranja cuando queda poco.
@Component({
  selector: 'app-contador',
  template: `<small class="contador" [class.cerca]="cerca()" [class.limite]="limite()">{{ largo() }}/{{ max() }}</small>`,
  styles: `
    .contador { color: var(--muted); font-variant-numeric: tabular-nums; white-space: nowrap; }
    .cerca { color: #ffb454; }
    .limite { color: #ff8a98; font-weight: 600; }
  `,
})
export class ContadorComponent {
  readonly valor = input<string | null | undefined>('');
  readonly max = input.required<number>();

  readonly largo = computed(() => this.valor()?.length ?? 0);
  readonly cerca = computed(() => this.largo() >= this.max() * 0.9 && !this.limite());
  readonly limite = computed(() => this.largo() >= this.max());
}
