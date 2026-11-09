import { DatePipe } from '@angular/common';
import { Component, input, output } from '@angular/core';
import { Publicacion } from '../../core/models/publicacion.model';

// Componente "tonto": recibe la publicación por input() y avisa lo que pasa por output().
// No llama a la API: eso lo decide el componente padre.
@Component({
  selector: 'app-post-card',
  imports: [DatePipe],
  templateUrl: './post-card.component.html',
  styleUrl: './post-card.component.scss',
})
export class PostCardComponent {
  readonly publicacion = input.required<Publicacion>();
  readonly puedeEliminar = input(false);

  readonly alternarLike = output<Publicacion>();
  readonly eliminar = output<Publicacion>();
}
