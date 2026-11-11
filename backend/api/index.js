// Punto de entrada de Vercel: toda petición llega acá y se delega a la app de Nest compilada.
// (vercel.json redirige cualquier ruta a esta función)
export { default } from '../dist/serverless.js';
