import { NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import type { IncomingMessage, ServerResponse } from 'node:http';
import { AppModule } from './app.module.js';
import { configurarApp } from './configurar-app.js';

type Manejador = (req: IncomingMessage, res: ServerResponse) => void;

// Vercel ejecuta el back como función serverless: no hay un servidor escuchando un puerto.
// Cada petición llama a este handler. La app de Nest (y su conexión a Mongo) se crea una
// sola vez y se reutiliza mientras la función siga "caliente".
let app: Promise<Manejador> | null = null;

async function crearApp(): Promise<Manejador> {
  const nest = await NestFactory.create<NestExpressApplication>(AppModule, { logger: ['error', 'warn'] });
  configurarApp(nest);
  await nest.init(); // inicializa módulos y rutas sin llamar a listen()
  return nest.getHttpAdapter().getInstance() as Manejador; // la app de Express es una función (req, res)
}

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  app ??= crearApp().catch((err) => {
    app = null; // si falló el arranque (por ejemplo, Mongo), el próximo intento vuelve a probar
    throw err;
  });
  const servidor = await app;
  return servidor(req, res);
}
