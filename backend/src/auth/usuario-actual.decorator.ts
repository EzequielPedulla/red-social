import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export interface UsuarioActual {
  id: string;
  perfil: 'usuario' | 'administrador';
}

// Atajo para leer el usuario que dejó el JwtAuthGuard en req.user
export const UsuarioActual = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): UsuarioActual =>
    ctx.switchToHttp().getRequest().user,
);
