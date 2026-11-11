import { INestApplication, ValidationPipe } from '@nestjs/common';

// Configuración común: la usan main.ts (servidor local) y serverless.ts (Vercel)
export function configurarApp(app: INestApplication): void {
  app.enableCors({ origin: process.env.FRONTEND_URL ?? true });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
}
