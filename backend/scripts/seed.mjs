// Datos de prueba para testear los Sprints 1 y 2.
//
//   npm run seed                      -> crea usuarios y publicaciones de prueba
//   npm run seed -- --usuario eze     -> además agrega 4 publicaciones a tu usuario "eze"
//   npm run seed -- --reset           -> borra SOLO lo creado por este script
//
// Es seguro volver a correrlo: primero borra lo que creó antes (usuarios "demo_*" y
// publicaciones cuyo título empieza con "[Demo]") y recién después vuelve a crear.
// Nunca toca otros usuarios ni otras publicaciones.
import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';

process.loadEnvFile('.env');
const uri = process.env.MONGODB_URI;
if (!uri) throw new Error('Falta MONGODB_URI en backend/.env');

const args = process.argv.slice(2);
const reset = args.includes('--reset');
const idx = args.indexOf('--usuario');
const usuarioPropio = idx >= 0 ? args[idx + 1] : null;

const PREFIJO = '[Demo] ';
const PASSWORD = 'Demo1234';

const USUARIOS = [
  { nombreUsuario: 'demo_admin', nombre: 'Admin', apellido: 'Demo', perfil: 'administrador', descripcion: 'Administrador de prueba. Puede dar de baja cualquier publicación.', foto: 12 },
  { nombreUsuario: 'demo_lucia', nombre: 'Lucía', apellido: 'Fernández', perfil: 'usuario', descripcion: 'Diseñadora y amante de los gatos.', foto: 47 },
  { nombreUsuario: 'demo_martin', nombre: 'Martín', apellido: 'Gómez', perfil: 'usuario', descripcion: 'Desarrollador backend, café y rock nacional.', foto: 33 },
  { nombreUsuario: 'demo_sofia', nombre: 'Sofía', apellido: 'Rodríguez', perfil: 'usuario', descripcion: 'Viajera y fotógrafa aficionada.', foto: 5 },
  { nombreUsuario: 'demo_tomas', nombre: 'Tomás', apellido: 'Pérez', perfil: 'usuario', descripcion: 'Estudiante de programación.', foto: 15 },
];

// [autor, título, mensaje, ¿imagen?, quiénes le dieron me gusta]
// Las cantidades de me gusta son distintas a propósito para probar el orden por likes.
const L = ['demo_admin', 'demo_lucia', 'demo_martin', 'demo_sofia', 'demo_tomas'];
const PUBLICACIONES = [
  ['demo_lucia', 'Bienvenidos a Forum', 'Primer día en la red social. ¡Cuéntenme qué esperan encontrar acá!', false, [L[0], L[2], L[3], L[4]]],
  ['demo_martin', 'Mi setup de trabajo', 'Dos monitores, un teclado mecánico y mucho café. ¿Cómo es el de ustedes?', true, [L[1], L[3]]],
  ['demo_sofia', 'Atardecer en la costa', 'Les comparto una foto del viaje del fin de semana. 🌅', true, [L[0], L[1], L[2], L[4]]],
  ['demo_tomas', 'Aprendiendo Angular', 'Hoy entendí cómo funcionan los signals. Cada vez me gusta más el framework.', false, [L[2]]],
  ['demo_lucia', 'Paleta de colores para un proyecto', 'Estoy probando tonos violetas y azules para el modo oscuro. ¿Qué opinan?', true, [L[2], L[3]]],
  ['demo_martin', 'NestJS y los módulos', 'Separar en módulos, controllers y services hace que todo sea mucho más ordenado.', false, [L[1], L[3], L[4]]],
  ['demo_admin', 'Reglas de la comunidad', 'Respeto ante todo. Las publicaciones que no cumplan las reglas pueden ser dadas de baja por un administrador.', false, [L[1], L[2], L[3], L[4]]],
  ['demo_sofia', 'Recomendación de libro', 'Estoy leyendo "El principito" por décima vez y sigue sorprendiéndome.', false, []],
  ['demo_tomas', 'Pregunta sobre MongoDB', '¿Es mejor guardar los likes en un array o en una colección aparte? Estoy dudando.', false, [L[1]]],
  ['demo_lucia', 'Mi gato opina de todo', 'Se sentó sobre el teclado y escribió "asdfghjkl". Seguramente tiene razón.', true, [L[0], L[2], L[3], L[4]]],
  ['demo_martin', 'Tip rápido de TypeScript', 'Usá `unknown` en lugar de `any` y el compilador te va a cuidar de muchos errores.', false, [L[3]]],
  ['demo_sofia', 'Ciudad de noche', 'Caminar de noche por el centro con la cámara es mi plan favorito.', true, [L[0], L[1]]],
  ['demo_tomas', 'Primer deploy', 'Logré subir mi primer proyecto a internet. ¡Qué emoción!', false, [L[0], L[1], L[2]]],
  ['demo_admin', 'Mantenimiento programado', 'Este domingo habrá tareas de mantenimiento. Gracias por la paciencia.', false, []],
  ['demo_lucia', 'Inspiración del día', 'Los mejores diseños son los que no se notan: simplemente funcionan.', false, [L[4]]],
  ['demo_martin', 'Debuggeando a las 3 AM', 'Era un punto y coma. Siempre es un punto y coma.', false, [L[1], L[3]]],
  ['demo_sofia', 'Montañas', 'Desconectar un rato para volver con la cabeza más clara.', true, [L[2]]],
  ['demo_tomas', 'Preguntas para el parcial', '¿Alguien tiene resumen de la clase 10 sobre DTOs y validación?', false, [L[0]]],
  ['demo_lucia', 'Ilustración nueva', 'Terminé una ilustración después de dos semanas. Feedback bienvenido.', true, [L[0], L[2], L[4]]],
  ['demo_martin', 'JWT explicado fácil', 'Un token firmado que le dice al servidor quién sos sin guardar sesión. Vence a los 15 minutos.', false, [L[1], L[2], L[3], L[4]]],
  ['demo_sofia', 'Café de especialidad', 'Probé un café de Etiopía con notas de frutos rojos. Recomendadísimo.', false, [L[1]]],
  ['demo_tomas', 'Un título muy largo para probar cómo se ve cuando ocupa el máximo permitido por el sistema de publicaciones', 'Esta publicación sirve para verificar que el diseño no se rompe con textos largos.\nTambién tiene saltos de línea.\nTercera línea de prueba.', false, []],
  ['demo_admin', 'Novedades de la versión', 'Ya podés dar y quitar me gusta, paginar el listado y ordenar por popularidad.', false, [L[1], L[2]]],
  ['demo_martin', 'Mensaje largo', 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. '.repeat(14).trim(), false, [L[1]]],
  ['demo_sofia', 'Playa de invierno', 'Sin gente y con el mar de fondo, ideal para pensar.', true, [L[0], L[3]]],
  ['demo_lucia', 'Última publicación de prueba', 'Esta es la más reciente: tiene que aparecer primera al ordenar por fecha.', false, [L[2]]],
];

// Publicaciones para TU usuario real (así probás "Mi perfil" y borrar las propias)
const PROPIAS = [
  ['Mi primera publicación de prueba', 'Sin imagen, para probar la baja lógica desde mi perfil.', false, ['demo_lucia']],
  ['Publicación con imagen', 'Esta lleva imagen. Debería verse en el listado y en mi perfil.', true, ['demo_lucia', 'demo_martin', 'demo_sofia']],
  ['Probando los me gusta', 'Dale me gusta y quitalo para ver cómo cambia el contador.', false, []],
  ['Cuarta publicación', 'Mi perfil muestra solo las últimas 3: esta debería quedar afuera.', false, ['demo_tomas']],
];

await mongoose.connect(uri, { serverSelectionTimeoutMS: 8000 });
const db = mongoose.connection.db;
const usuarios = db.collection('usuarios');
const publicaciones = db.collection('publicacions'); // así llama Mongoose a la colección del modelo Publicacion

// ---- Limpieza de lo creado antes por este script
const demoPrevios = await usuarios.find({ nombreUsuario: /^demo_/ }, { projection: { _id: 1 } }).toArray();
const borradas = await publicaciones.deleteMany({
  titulo: { $regex: '^\\[Demo\\] ' },
});
const borradosUsr = await usuarios.deleteMany({ _id: { $in: demoPrevios.map((u) => u._id) } });
console.log(`Limpieza: ${borradosUsr.deletedCount} usuarios demo y ${borradas.deletedCount} publicaciones demo borradas`);

if (reset) {
  await mongoose.disconnect();
  console.log('Listo (--reset).');
  process.exit(0);
}

// ---- Usuarios demo
const hash = await bcrypt.hash(PASSWORD, 10);
const ahora = Date.now();
const idDe = {};
for (const [i, u] of USUARIOS.entries()) {
  const fecha = new Date(ahora - 40 * 86400000);
  const r = await usuarios.insertOne({
    nombre: u.nombre,
    apellido: u.apellido,
    correo: `${u.nombreUsuario}@demo.com`,
    nombreUsuario: u.nombreUsuario,
    password: hash,
    fechaNacimiento: new Date(Date.UTC(1995 + i, i, 10 + i)),
    descripcion: u.descripcion,
    imagenPerfil: `https://i.pravatar.cc/200?img=${u.foto}`,
    perfil: u.perfil,
    activo: true,
    createdAt: fecha,
    updatedAt: fecha,
    __v: 0,
  });
  idDe[u.nombreUsuario] = r.insertedId;
}

// ---- Publicaciones demo (de la más vieja a la más nueva, separadas 3 horas)
let n = 0;
async function crear(autorId, titulo, mensaje, conImagen, likers, minutosAtras) {
  const fecha = new Date(ahora - minutosAtras * 60000);
  n++;
  await publicaciones.insertOne({
    usuario: autorId,
    titulo: PREFIJO + titulo,
    mensaje,
    imagen: conImagen ? `https://picsum.photos/seed/forum${n}/900/600` : '',
    likes: likers.map((l) => idDe[l]).filter(Boolean),
    cantidadLikes: likers.filter((l) => idDe[l]).length,
    activo: true,
    createdAt: fecha,
    updatedAt: fecha,
    __v: 0,
  });
}

for (const [i, [autor, titulo, mensaje, img, likers]] of PUBLICACIONES.entries()) {
  const minutosAtras = (PUBLICACIONES.length - i) * 180;
  await crear(idDe[autor], titulo, mensaje, img, likers, minutosAtras);
}

// ---- Publicaciones para el usuario real (opcional)
if (usuarioPropio) {
  const propio = await usuarios.findOne({ nombreUsuario: usuarioPropio });
  if (!propio) {
    console.log(`No encontré al usuario "${usuarioPropio}": no se crearon publicaciones propias.`);
  } else {
    for (const [i, [titulo, mensaje, img, likers]] of PROPIAS.entries()) {
      await crear(propio._id, titulo, mensaje, img, likers, (PROPIAS.length - i) * 20);
    }
    console.log(`Se agregaron ${PROPIAS.length} publicaciones a "${usuarioPropio}".`);
  }
}

console.log(`\nCreados ${USUARIOS.length} usuarios demo y ${n} publicaciones.`);
console.log(`Usuarios (contraseña de todos: ${PASSWORD}):`);
for (const u of USUARIOS) console.log(`  ${u.nombreUsuario.padEnd(12)} ${u.perfil}`);
await mongoose.disconnect();
