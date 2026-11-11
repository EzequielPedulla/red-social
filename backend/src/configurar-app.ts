import { INestApplication, ValidationPipe } from '@nestjs/common';

// FRONTEND_URL se carga a mano en el panel de Vercel y es fácil que llegue con un espacio,
// un salto de línea, comillas, una barra final o sin "https://". Un salto de línea hace que
// Node se niegue a armar el encabezado CORS y TODAS las peticiones respondan 500.
// Por eso se normaliza. Se pueden indicar varios orígenes separados por coma.
export function origenesPermitidos(valor = process.env.FRONTEND_URL): string[] | true {
  if (!valor || !valor.trim()) return true;
  const origenes = valor
    .split(',')
    .map((o) => o.replace(/["'\s]/g, '').replace(/\/+$/, ''))
    .filter(Boolean)
    .map((o) => (/^https?:\/\//i.test(o) ? o : `https://${o}`));
  return origenes.length ? origenes : true;
}

// Configuración común: la usan main.ts (servidor local) y serverless.ts (Vercel)
export function configurarApp(app: INestApplication): void {
  app.enableCors({ origin: origenesPermitidos() });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
}
