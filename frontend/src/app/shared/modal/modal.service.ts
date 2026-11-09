import { Injectable, signal } from '@angular/core';

export type TipoModal = 'exito' | 'error' | 'info';

export interface OpcionesModal {
  titulo: string;
  mensajes: string[];
  tipo?: TipoModal;
  // Si se define, el modal es de confirmación y muestra un segundo botón
  textoCancelar?: string;
  textoAceptar?: string;
}

interface EstadoModal extends Required<Omit<OpcionesModal, 'textoCancelar'>> {
  textoCancelar: string | null;
  resolver: (aceptado: boolean) => void;
}

// Reemplaza a alert()/confirm(): un solo modal global que se maneja con promesas
@Injectable({ providedIn: 'root' })
export class ModalService {
  readonly estado = signal<EstadoModal | null>(null);

  mostrar(opciones: OpcionesModal): Promise<boolean> {
    return new Promise((resolve) => {
      this.estado.set({
        titulo: opciones.titulo,
        mensajes: opciones.mensajes,
        tipo: opciones.tipo ?? 'info',
        textoAceptar: opciones.textoAceptar ?? 'Aceptar',
        textoCancelar: opciones.textoCancelar ?? null,
        resolver: resolve,
      });
    });
  }

  exito(titulo: string, ...mensajes: string[]) {
    return this.mostrar({ titulo, mensajes, tipo: 'exito' });
  }

  error(titulo: string, mensajes: string[]) {
    return this.mostrar({ titulo, mensajes, tipo: 'error' });
  }

  cerrar(aceptado: boolean): void {
    this.estado()?.resolver(aceptado);
    this.estado.set(null);
  }
}
