# TP 11 - Reemplazo completo de reservas desde la web

**Módulo 3 - Desarrollo Back-end con Node.js**
**UNCA - Universidad Nacional de Catamarca**

**Proyecto:** `tp-11-salas-web-completa-mongodb`

## 1. Objetivo y alcance

Este trabajo continúa el TP10 y agrega **un único flujo nuevo**: la edición de una reserva existente mediante **reemplazo completo** desde un formulario HTML.

- `GET /reservas/:id/editar`: precarga los siete campos editables.
- `POST /reservas/:id/editar`: guarda los siete campos con `servicio.reemplazar`, el mismo servicio que usa `PUT /api/reservas/:id`.

No se desarrollan PATCH ni DELETE web (quedan para la unidad 12). No se agregan filtros, orden ni paginación al HTML: el listado heredado sigue siendo un arreglo simple. La API y todas las funcionalidades anteriores conservan su comportamiento.

El controlador **no llama por HTTP a la propia API** y **no ejecuta operaciones MongoDB**: delega en la capa de servicio.

## 2. Tecnologías

- Node.js con soporte para `--env-file`.
- Express 5, EJS y express-ejs-layouts.
- MongoDB Atlas Free y Mongoose 9.
- Morgan, ESLint y Prettier.
- Postman para las pruebas.
- CommonJS en todo el código fuente.

Las versiones exactas están en `package.json` y `package-lock.json`.

## 3. Configuración de MongoDB Atlas

| Elemento              | Valor                     |
| --------------------- | ------------------------- |
| Base de datos         | `reservas_salas_u11`    |
| Colección             | `reservas`              |
| Puerto local          | `3000`                  |
| Variable de conexión  | `MONGODB_URI`           |

La base es independiente de la del TP10 (`reservas_salas_u10`). Se conserva la configuración DNS de la clase (`8.8.8.8` y `1.1.1.1`) en `src/config/base-datos.js`.

### Variables de entorno

`MONGODB_URI` debe apuntar a la base `reservas_salas_u11`. El archivo `.env.example` contiene solo marcadores:

```dotenv
PORT=3000
NODE_ENV=development
MONGODB_URI=mongodb+srv://USUARIO:CLAVE@HOST/reservas_salas_u11?retryWrites=true&w=majority
```

Copiar `.env.example` a `.env` y reemplazar `USUARIO`, `CLAVE` y `HOST` con los valores de Atlas. **El `.env` es privado, está ignorado por Git y no se incluye en esta entrega.**

## 4. Instalación y ejecución

```bash
npm ci
npm run check
node --env-file=.env scripts/comprobar-conexion.js
node --env-file=.env src/index.js
```

La aplicación queda disponible en `http://localhost:3000`. Para detenerla con `Ctrl + C`, el cierre es ordenado: se cierra el servidor y luego la conexión Mongoose.

Si se usa Windows con `npm.cmd`, los comandos equivalentes son `npm.cmd ci`, `npm.cmd run check` y `node --env-file=.env ...`.

## 5. Estructura del proyecto

```text
tp-11-salas-web-completa-mongodb/
├── src/
│   ├── config/            # entorno y conexión + DNS
│   ├── controladores/     # reservas.js (HTML) y reservas-api.js (JSON)
│   ├── middleware/        # reservas.js (validación) y solicitudes.js
│   ├── modelos/           # reserva.js
│   ├── rutas/             # reservas.js y reservas-api.js
│   ├── servicios/         # reservas.js (acceso a MongoDB)
│   ├── app.js             # middleware, rutas y manejador central de errores
│   └── index.js           # conexión previa al listen y cierre ordenado
├── scripts/               # comprobar-conexion, crear-reserva, listar-reservas
├── views/
│   ├── layouts/main.ejs
│   ├── error.ejs          # vista compartida genérica (400/404/500)
│   ├── no-encontrado.ejs  # mensajes específicos de ID inválido/ausente
│   ├── inicio.ejs
│   └── reservas/
│       ├── lista.ejs      # con acceso a "Editar"
│       ├── detalle.ejs    # con acceso a "Editar esta reserva"
│       ├── nueva.ejs
│       └── editar.ejs     # formulario de reemplazo (NUEVO)
├── postman/               # colección y entorno importables
├── evidencias/            # registro reproducible de pruebas
├── public/
├── .env.example
├── .gitignore
├── package.json
├── package-lock.json
└── README.md
```

Las capas se mantienen separadas: rutas → middleware → controlador → servicio → Mongoose.

## 6. Campos de la reserva

| Campo      | Tipo en el formulario | Regla de validación            |
| ---------- | --------------------- | ------------------------------ |
| estudiante | texto                 | Obligatorio, no vacío          |
| email      | texto                 | Obligatorio, debe contener `@` |
| sala       | texto (select)        | Sala Norte, Sala Sur o Sala Multimedia |
| fecha      | texto (date)          | Obligatoria                    |
| turno      | texto (select)        | Mañana, Tarde o Noche          |
| personas   | texto → `Number`      | Entero entre 1 y 6             |
| estado     | texto (select)        | `pendiente` o `confirmada`     |

Todos los valores del formulario llegan como textos. El middleware comprueba que `personas` no esté vacío **antes** de convertir con `Number`; después verifica finitud, integralidad y rango. Los siete campos son obligatorios en el reemplazo: los omitidos no se completan con los valores anteriores.

Se rechazan campos extra, `id`, `_id` y operadores (por ejemplo `$set`). El identificador surge de la URL y nunca se envía como campo editable.

El estado de una reserva nueva sigue siendo `pendiente` por defecto: el formulario de alta no envía `estado`.

## 7. Datos de ejercicio

Si la base `reservas_salas_u11` está vacía, crear desde el formulario de alta:

| Estudiante    | Email                 | Sala       | Fecha       | Turno   | Personas | Estado inicial |
| ------------- | --------------------- | ---------- | ----------- | ------- | -------- | -------------- |
| Ana Ejemplo   | ana@example.com       | Sala Norte | 2026-11-04  | Mañana  | 2        | pendiente      |
| Bruno Ejemplo | bruno@example.com     | Sala Sur   | 2026-11-04  | Tarde   | 3        | pendiente      |

La fecha es ilustrativa. Si los documentos ya existen, **no se duplican**. No se vacía la colección ni se realizan cargas automáticas al iniciar. Guardar los IDs devueltos como `{{ID_ANA}}` y `{{ID_BRUNO}}` para las pruebas.

## 8. Rutas

### Web (HTML)

| Método | Ruta                       | Resultado                                            |
| ------ | -------------------------- | ---------------------------------------------------- |
| GET    | `/`                        | Inicio                                               |
| GET    | `/reservas`                | Listado (arreglo, sin paginación)                    |
| GET    | `/reservas/nueva`          | Formulario de alta                                   |
| POST   | `/reservas`                | Alta, redirección 302 a `/reservas`                  |
| GET    | `/reservas/:id`            | Detalle                                              |
| GET    | `/reservas/:id/editar`     | Formulario de edición precargado (**nuevo**)         |
| POST   | `/reservas/:id/editar`     | Guarda el reemplazo (**nuevo**)                      |
| GET    | `/estado`                  | Cantidad global de reservas                          |

**Destino elegido para el guardado correcto:** `303` hacia `/reservas/:id` (el detalle de la misma reserva). Se documenta aquí y se verifica en Postman desactivando *Automatically follow redirects*.

### API (JSON)

| Método | Ruta                    | Resultado                       |
| ------ | ----------------------- | ------------------------------- |
| GET    | `/api/reservas`         | Consulta paginada del TP10      |
| GET    | `/api/reservas/:id`     | Reserva individual              |
| POST   | `/api/reservas`         | Alta 201 + `Location`           |
| PUT    | `/api/reservas/:id`     | Reemplazo completo 200          |
| PATCH  | `/api/reservas/:id`     | Modificación parcial (heredada) |
| DELETE | `/api/reservas/:id`     | Eliminación física (heredada)   |

La edición web y el PUT comparten `servicio.reemplazar`, por lo que ambos conservan el ID y escriben exactamente los siete campos.

## 9. Cómo funciona la edición

1. **Precarga.** `GET /reservas/:id/editar` valida el ID de la ruta, busca con `servicio.buscarPorId` y renderiza `reservas/editar` con los siete valores convertidos a texto. El formulario no incluye el ID como campo.
2. **Guardado.** `POST /reservas/:id/editar` pasa por `validarIdRuta` y `validarReemplazoWeb`. El middleware guarda en `res.locals.edicion` el ID, los errores y los textos recibidos; el controlador construye solo los siete campos admitidos y llama a `servicio.reemplazar(id, datos)`. Si el ID no existe se responde 404 HTML. Si guarda, responde 303 al detalle.
3. **Errores de validación.** Un cuerpo inválido devuelve **HTML 400** con la vista `editar`, la explicación, el ID y los textos recibidos. No redirige ni lleva al formulario de alta. El documento queda intacto porque no se llama al servicio.
4. **Errores del servicio.** Si Mongoose rechaza el guardado, el manejador central de `src/app.js` revisa `res.locals.edicion` **antes que cualquier otra rama HTML (incluida la de creación)** y vuelve a renderizar `editar` con esos datos y un mensaje seguro. La rama API sigue respondiendo JSON; los errores inesperados no exponen el mensaje interno.
5. **Vista de error compartida.** `views/error.ejs` es genérica: muestra el título, el mensaje y el código recibido (400, 404 o 500), sin afirmar siempre que fue 404. `no-encontrado.ejs` se conserva para los mensajes específicos de ID inválido o reserva ausente.
6. **Cancelación.** El enlace *Cancelar y volver al detalle* es un `GET` común: no envía el formulario, por lo que no hay escritura.

## 10. Pruebas reproducibles

La colección `postman/TP11-Reservas.postman_collection.json` y el entorno `postman/TP11-Reservas.postman_environment.json` contienen todas las solicitudes. Importar ambos en Postman, completar `id` con el ID real de Ana e `idAusente` con un ObjectId válido no usado. Para GET, **Params vacío y Body: none**.

| # | Caso | Solicitud | Resultado esperado |
| - | ---- | --------- | ------------------ |
| 1 | Abrir edición | `GET /reservas/{{id}}/editar` | 200, siete campos precargados |
| 2 | Guardar desde web | `POST /reservas/{{id}}/editar` con `personas=4` y `estado=confirmada` | 303, `Location: /reservas/{{id}}` |
| 3 | Verificar por API | `GET /api/reservas/{{id}}` | Mismo ID, personas 4, estado confirmada |
| 4 | Cancelar | Abrir edición, cambiar valores y hacer clic en Cancelar | Sin escritura, documento intacto |
| 5 | Formulario inválido | `POST /reservas/{{id}}/editar` con `personas=0` | 400, vista de edición y valores recibidos |
| 6 | Corregir y reenviar | Mismo POST con `personas=5` | 303 y valores actualizados |
| 7 | PUT completo | `PUT /api/reservas/{{id}}` con los siete campos | 200 JSON, mismo ID |
| 8 | Verificar en web | `GET /reservas/{{id}}/editar` | Siete campos coincidentes con el PUT |
| 9 | PUT incompleto | PUT duplicado sin `estado` | 400 y documento intacto |
| 10 | ID inválido | `GET /reservas/no-es-un-id/editar` | 400 HTML |
| 11 | ID ausente | `GET /reservas/{{idAusente}}/editar` | 404 HTML |
| 12 | Persistencia | Reiniciar y repetir los pasos 1 y 3 | Mismos valores, sin repetir altas |
| 13 | Funcionalidades previas | `POST /reservas`, `GET /reservas`, `GET /estado` | Siguen funcionando |

El detalle de cada solicitud, el resultado esperado y el lugar para registrar el obtenido están en `evidencias/REGISTRO-TP11.md`.

### Persistencia tras reiniciar

1. Guardar un reemplazo válido desde la web.
2. Detener con `Ctrl + C` (el servidor cierra la conexión Mongoose).
3. Volver a ejecutar `node --env-file=.env src/index.js` con la **misma** base.
4. Consultar `GET /api/reservas/{{id}}` y `GET /reservas/{{id}}/editar`: el mismo ID debe conservar los siete valores.

## 11. Conservación del trabajo anterior

Se mantienen sin cambios funcionales:

- Consulta avanzada de la API: `sala`, `orden`, `pagina`, `limite` y metadatos `datos/pagina/limite/total/paginas`.
- CRUD completo de la API (POST, GET, PUT, PATCH y DELETE) con proyección pública `id` en lugar de `_id`/`__v`.
- Listado HTML con `listar`, alta con 302, detalle, inicio, layout y 404.
- `/estado` con el conteo global.
- Conexión a MongoDB antes de `listen`, DNS autorizado y cierre ordenado.
- Scripts CLI; `crear-reserva.js` ahora intenta desconectar también cuando la conexión falla de forma parcial.

No hay semilla automática ni consultas que escriban al arrancar. `reemplazar` usa `upsert: false`, por lo que un ID ausente nunca crea un documento.

## 12. Seguridad

- `.env` con credenciales reales no se publica; solo `.env.example` con marcadores.
- No se incluyen `.git`, `node_modules` ni datos personales reales.
- Los datos de prueba son ficticios (`Ana Ejemplo`, `bruno@example.com`, etc.).
- Las respuestas de error para la API y para errores inesperados usan mensajes genéricos.

## 13. Verificaciones y entrega

Durante la preparación de esta entrega se ejecutó `npm run check` (Prettier + ESLint) sin errores. Las pruebas funcionales se documentan en `evidencias/REGISTRO-TP11.md` con solicitudes concretas y espacios para los resultados obtenidos con la base real del estudiante: este paquete no incluye credenciales de Atlas, por lo que la conexión y las escrituras deben ejecutarse en el entorno del estudiante.

Repositorio individual: `tp-11-salas-web-completa-mongodb`.

Debe contener código, vistas, `public`, scripts, `package.json`, `package-lock.json`, `.env.example`, `.gitignore`, README, colección de Postman y evidencias. No debe contener `.env`, `node_modules` ni `.git`.
