// Genera forum.postman_collection.json (se puede editar este script y volver a correrlo):
//   node postman/generar-coleccion.mjs
import { writeFileSync } from 'node:fs';

const bearer = { type: 'bearer', bearer: [{ key: 'token', value: '{{token}}', type: 'string' }] };
const noAuth = { type: 'noauth' };

const url = (path, query = []) => ({
  raw: `{{baseUrl}}${path}` + (query.length ? '?' + query.map((q) => `${q.key}=${q.value}`).join('&') : ''),
  host: ['{{baseUrl}}'],
  path: path.split('/').filter(Boolean),
  ...(query.length ? { query } : {}),
});
const evento = (lineas) => [{ listen: 'test', script: { type: 'text/javascript', exec: lineas } }];
const estado = (codigo) => `pm.test('Status ${codigo}', () => pm.response.to.have.status(${codigo}));`;
const uno = (codigos) =>
  `pm.test('Status ${codigos.join(' o ')}', () => pm.expect([${codigos.join(', ')}]).to.include(pm.response.code));`;

const req = (name, method, path, { query, body, auth = bearer, tests = [], descripcion = '' } = {}) => ({
  name,
  event: tests.length ? evento(tests) : undefined,
  request: { method, auth, header: [], ...(body ? { body } : {}), url: url(path, query), description: descripcion },
});
const json = (obj) => ({ mode: 'raw', raw: JSON.stringify(obj, null, 2), options: { raw: { language: 'json' } } });
const form = (campos) => ({ mode: 'formdata', formdata: campos });
const txt = (key, value) => ({ key, value, type: 'text' });
const archivo = (key, deshabilitado = false) => ({ key, type: 'file', src: [], ...(deshabilitado ? { disabled: true } : {}) });

const registro = (extra) =>
  form([
    txt('nombre', 'Prueba'), txt('apellido', 'Postman'), txt('correo', 'postman1@mail.com'),
    txt('nombreUsuario', 'postman1'), txt('password', 'Hola1234'), txt('repetirPassword', 'Hola1234'),
    txt('fechaNacimiento', '2000-05-10'), txt('descripcion', 'Usuario creado desde Postman'),
    ...extra,
  ]);

const guardarSesion = [
  estado(200),
  'const r = pm.response.json();',
  "pm.collectionVariables.set('token', r.token);",
  "pm.collectionVariables.set('usuarioId', r.usuario.id);",
  "pm.test('Devuelve token y datos del usuario sin password', () => { pm.expect(r.token).to.be.a('string'); pm.expect(r.usuario).to.not.have.property('password'); });",
];

const coleccion = {
  info: {
    name: 'Forum - Sprints 1 y 2',
    schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json',
    description:
      'Orden sugerido: 1) Login (guarda el token solo en {{token}}), 2) el resto. Los usuarios demo se crean con `npm run seed` (contraseña Demo1234).',
  },
  auth: bearer,
  variable: [
    { key: 'baseUrl', value: 'http://localhost:3000' },
    { key: 'token', value: '' },
    { key: 'usuarioId', value: '' },
    { key: 'publicacionId', value: '' },
  ],
  item: [
    {
      name: '1 - Autenticación',
      item: [
        req('Login por nombre de usuario - 200', 'POST', '/auth/login', {
          auth: noAuth,
          body: json({ identificador: 'demo_lucia', password: 'Demo1234' }),
          tests: guardarSesion,
          descripcion: 'Guarda el token en {{token}}: el resto de las peticiones ya lo usan.',
        }),
        req('Login como ADMIN - 200', 'POST', '/auth/login', {
          auth: noAuth,
          body: json({ identificador: 'demo_admin', password: 'Demo1234' }),
          tests: guardarSesion,
        }),
        req('Login por correo - 200', 'POST', '/auth/login', {
          auth: noAuth,
          body: json({ identificador: 'demo_martin@demo.com', password: 'Demo1234' }),
          tests: guardarSesion,
        }),
        req('Login contraseña incorrecta - 401', 'POST', '/auth/login', {
          auth: noAuth,
          body: json({ identificador: 'demo_lucia', password: 'Incorrecta1' }),
          tests: [estado(401)],
        }),
        req('Registro - 201', 'POST', '/auth/registro', {
          auth: noAuth,
          body: registro([archivo('imagen', true)]),
          tests: [estado(201)],
          descripcion: 'Si el usuario ya existe da 409: cambiá nombreUsuario y correo. La imagen es opcional (tildá el campo y elegí un archivo).',
        }),
        req('Registro repetido - 409', 'POST', '/auth/registro', {
          auth: noAuth,
          body: form([
            txt('nombre', 'Dup'), txt('apellido', 'Dup'), txt('correo', 'demo_lucia@demo.com'),
            txt('nombreUsuario', 'otro_usuario'), txt('password', 'Hola1234'), txt('repetirPassword', 'Hola1234'),
            txt('fechaNacimiento', '2000-05-10'), txt('descripcion', 'x'),
          ]),
          tests: [estado(409)],
        }),
        req('Registro contraseña débil - 400', 'POST', '/auth/registro', {
          auth: noAuth,
          body: form([
            txt('nombre', 'A'), txt('apellido', 'B'), txt('correo', 'debil@mail.com'),
            txt('nombreUsuario', 'debil1'), txt('password', 'abc'), txt('repetirPassword', 'abc'),
            txt('fechaNacimiento', '2000-05-10'), txt('descripcion', 'x'),
          ]),
          tests: [estado(400)],
        }),
        req('Registro intentando ser admin - 400', 'POST', '/auth/registro', {
          auth: noAuth,
          body: registro([txt('perfil', 'administrador')]),
          tests: [estado(400)],
          descripcion: 'El campo perfil está prohibido en el registro (forbidNonWhitelisted).',
        }),
      ],
    },
    {
      name: '2 - Publicaciones',
      item: [
        req('Listar (por fecha, por defecto) - 200', 'GET', '/publicaciones', {
          tests: [
            estado(200),
            'const r = pm.response.json();',
            "pm.test('Tiene items, total, offset y limit', () => pm.expect(r).to.have.all.keys('items', 'total', 'offset', 'limit'));",
            "pm.test('Ordenado por fecha descendente', () => { const f = r.items.map(i => new Date(i.createdAt)); pm.expect(f.every((d, i) => i === 0 || f[i - 1] >= d)).to.be.true; });",
            "if (r.items.length) pm.collectionVariables.set('publicacionId', r.items[0].id);",
          ],
          descripcion: 'También guarda el id de la primera publicación en {{publicacionId}} para las pruebas de me gusta y eliminar.',
        }),
        req('Listar ordenado por me gusta - 200', 'GET', '/publicaciones', {
          query: [{ key: 'orden', value: 'likes' }],
          tests: [
            estado(200),
            "const l = pm.response.json().items.map(i => i.cantidadLikes);",
            "pm.test('Ordenado por cantidad de me gusta', () => pm.expect(l.every((n, i) => i === 0 || l[i - 1] >= n)).to.be.true);",
          ],
        }),
        req('Paginación: página 2 (offset=10, limit=10) - 200', 'GET', '/publicaciones', {
          query: [{ key: 'offset', value: '10' }, { key: 'limit', value: '10' }],
          tests: [estado(200)],
        }),
        req('Filtrar por usuario (el del último login) - 200', 'GET', '/publicaciones', {
          query: [{ key: 'usuario', value: '{{usuarioId}}' }],
          tests: [
            estado(200),
            "pm.test('Todas son del usuario', () => pm.response.json().items.every(i => i.usuario.id === pm.collectionVariables.get('usuarioId')));",
          ],
        }),
        req('Últimas 3 de un usuario (lo que usa Mi Perfil) - 200', 'GET', '/publicaciones', {
          query: [{ key: 'usuario', value: '{{usuarioId}}' }, { key: 'orden', value: 'fecha' }, { key: 'limit', value: '3' }],
          tests: [estado(200)],
        }),
        req('Listar sin token - 401', 'GET', '/publicaciones', { auth: noAuth, tests: [estado(401)] }),
        req('Listar con orden inválido - 400', 'GET', '/publicaciones', {
          query: [{ key: 'orden', value: 'xx' }],
          tests: [estado(400)],
        }),
        req('Listar con limit=500 (máximo 50) - 400', 'GET', '/publicaciones', {
          query: [{ key: 'limit', value: '500' }],
          tests: [estado(400)],
        }),
        req('Crear sin imagen - 201', 'POST', '/publicaciones', {
          body: form([txt('titulo', '[Demo] Creada desde Postman'), txt('mensaje', 'Publicación de prueba sin imagen')]),
          tests: [estado(201), "pm.collectionVariables.set('publicacionId', pm.response.json().id);"],
        }),
        req('Crear con imagen - 201', 'POST', '/publicaciones', {
          body: form([
            txt('titulo', '[Demo] Con imagen desde Postman'),
            txt('mensaje', 'Elegí un archivo en el campo imagen'),
            archivo('imagen'),
          ]),
          tests: [estado(201), "pm.test('Tiene URL de imagen', () => pm.expect(pm.response.json().imagen).to.include('http'));"],
          descripcion: 'En el campo imagen (columna Value) elegí un JPG/PNG/WEBP/GIF de hasta 3MB.',
        }),
        req('Crear sin título - 400', 'POST', '/publicaciones', {
          body: form([txt('mensaje', 'falta el título')]),
          tests: [estado(400)],
        }),
        req('Crear con campo extra - 400', 'POST', '/publicaciones', {
          body: form([txt('titulo', 'a'), txt('mensaje', 'b'), txt('usuario', 'otro')]),
          tests: [estado(400)],
          descripcion: 'No se puede elegir el autor: sale del token.',
        }),
      ],
    },
    {
      name: '3 - Me gusta',
      item: [
        req('Dar me gusta - 201 (si ya lo diste, 409)', 'POST', '/publicaciones/{{publicacionId}}/like', {
          tests: [uno([201, 409])],
          descripcion: 'Usa {{publicacionId}}. Primera vez 201; repetido 409.',
        }),
        req('Quitar me gusta - 200 (si no lo habías dado, 409)', 'DELETE', '/publicaciones/{{publicacionId}}/like', {
          tests: [uno([200, 409])],
        }),
        req('Me gusta con id inválido - 400', 'POST', '/publicaciones/abc/like', { tests: [estado(400)] }),
        req('Me gusta a publicación inexistente - 404', 'POST', '/publicaciones/507f1f77bcf86cd799439011/like', {
          tests: [estado(404)],
        }),
      ],
    },
    {
      name: '4 - Eliminar (baja lógica)',
      item: [
        req('Eliminar publicación - 204 / 403 / 404', 'DELETE', '/publicaciones/{{publicacionId}}', {
          tests: [uno([204, 403, 404])],
          descripcion:
            'Con el token del autor o de demo_admin: 204. Con el token de otro usuario: 403. Si ya estaba eliminada: 404.',
        }),
      ],
    },
  ],
};

writeFileSync(new URL('./forum.postman_collection.json', import.meta.url), JSON.stringify(coleccion, null, 2));
console.log('Colección generada');
