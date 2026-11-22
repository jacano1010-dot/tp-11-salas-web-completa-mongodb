# Registro reproducible de evidencias - TP 11

Este archivo acompaña a la colección `postman/TP11-Reservas.postman_collection.json`.

**Registro completado con datos reales de la ejecución del 22/11/2026.** Los marcadores de la plantilla se reemplazaron por estos valores:

- `{{HOST}}` → `http://localhost:3000`
- `{{ID_BRUNO}}` → `6b036b5574ab2747f3dbfd7f` (Bruno Ejemplo)
- `{{ID_AUSENTE}}` → `000000000000000000000000` (ObjectId válido, no existe)
- `{{ID_ANA}}` → `6b036b5574ab2747f3dbfd7f`. No se creó un documento nuevo llamado "Ana Ejemplo": se reutilizó el documento real de Bruno para todas las pruebas. El nombre `ID_ANA` es solo una etiqueta de la plantilla, no un dato inventado.

Base: `reservas_salas_u11`, colección `reservas`. El paquete no contiene credenciales de Atlas. No se crearon ni eliminaron reservas durante las pruebas: `GET /estado` informó **4** reservas antes y después. El documento usado quedó finalmente en `personas: 3`, `estado: pendiente` (su valor original).

## 0. Comprobaciones previas

| Comando                                                | Resultado esperado                                  | Resultado obtenido                                                                        |
| ------------------------------------------------------ | --------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| `npm ci`                                             | Dependencias instaladas, lockfile sin cambios       | No ejecutado en esta sesión: se trabajó con la instalación existente.                      |
| `npm run check`                                      | Prettier y ESLint sin errores                       | Ejecutado: *All matched files use Prettier code style!* y ESLint sin errores.               |
| `node --env-file=.env scripts/comprobar-conexion.js` | `Prueba de conexión completada correctamente.`   | Ejecutado: *Conexión a MongoDB Atlas establecida correctamente.* y *Prueba de conexión completada correctamente.* |
| `node --env-file=.env src/index.js`                  | `Servidor ejecutándose en http://localhost:3000` | Servidor en `http://localhost:3000`; `GET /estado` → 200 con 4 reservas.                    |

## 1. Preparación de datos (dos altas desde el formulario)

No usar POST a la API para esta preparación: la consigna pide crear desde el formulario previo. En Postman, `Body > x-www-form-urlencoded` sobre `http://localhost:3000/reservas`.

### Alta 1 - Ana Ejemplo

| Campo      | Valor           |
| ---------- | --------------- |
| estudiante | Ana Ejemplo     |
| email      | ana@example.com |
| sala       | Sala Norte      |
| fecha      | 2026-11-04      |
| turno      | Mañana         |
| personas   | 2               |

- Estado inicial asignado por el servidor: `pendiente`. El cuerpo **no** incluye `estado`.
- Resultado esperado: `302 Found`, `Location: /reservas`.
- **No se ejecutó esta alta**: la base ya tenía 4 reservas y no se quiso agregar documentos de prueba. Para las solicitudes marcadas como `{{ID_ANA}}` se usó el ID real `6b036b5574ab2747f3dbfd7f`.
- Verificación: `GET http://localhost:3000/api/reservas/6b036b5574ab2747f3dbfd7f` → **200** con los siete valores (Bruno Ejemplo, Sala Sur, Tarde, 3, pendiente).

### Alta 2 - Bruno Ejemplo

| Campo      | Valor             |
| ---------- | ----------------- |
| estudiante | Bruno Ejemplo     |
| email      | bruno@example.com |
| sala       | Sala Sur          |
| fecha      | 2026-11-04        |
| turno      | Tarde             |
| personas   | 3                 |

- Estado inicial: `pendiente`.
- Resultado esperado: `302 Found`, `Location: /reservas`.
- **No se ejecutó una alta nueva**: se registró el ID existente `6b036b5574ab2747f3dbfd7f`.
- Verificación: `GET http://localhost:3000/api/reservas/6b036b5574ab2747f3dbfd7f` → **200** con los siete valores.

Si los documentos ya existen en la base, no se crean de nuevo: registrar los IDs existentes y continuar.

## 2. Evidencia mínima

| #  | Caso                    | Solicitud                                                                              | Resultado esperado                          | Resultado obtenido                                                                                                   |
| -- | ----------------------- | -------------------------------------------------------------------------------------- | ------------------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| 1  | Abrir edición          | `GET http://localhost:3000/reservas/6b036b5574ab2747f3dbfd7f/editar`                  | 200, siete campos precargados, sin campo ID | **200 OK**: siete campos precargados, `action="/reservas/6b036b5574ab2747f3dbfd7f/editar"`                          |
| 2  | Guardar desde web       | `POST http://localhost:3000/reservas/6b036b5574ab2747f3dbfd7f/editar`, `personas=4`, `estado=confirmada` | 303, `Location: /reservas/ID` | **303 See Other**, `Location: /reservas/6b036b5574ab2747f3dbfd7f`. Postman siguió la redirección y mostró **200 OK** (detalle) |
| 3  | Verificar por API       | `GET http://localhost:3000/api/reservas/6b036b5574ab2747f3dbfd7f`                      | 200, mismo ID, personas 4, confirmada       | **200 OK**, mismo ID, `personas: 4`, `estado: confirmada`                                                             |
| 4  | Cancelar                | Abrir edición, cambiar campos, clic en Cancelar                                        | Sin escritura; documento intacto            | Enlace verificado: `href="/reservas/6b036b5574ab2747f3dbfd7f"`. No se envió POST; la API sigue con 3 / pendiente      |
| 5  | Formulario inválido    | POST con `personas=0` y estudiante `Prueba Invalida`                                 | 400 HTML, vista edición, valores recibidos  | **400**: texto *No se pudo guardar la reserva*, `value="Prueba Invalida"` y `value="0"`; la API conservó el valor válido |
| 6  | Corregir y reenviar     | Mismo POST con `personas=5`                                                           | 303 y documento actualizado                 | **303**, API con `personas: 5`, `estado: confirmada`. Después se restauró a 3 / pendiente con el PUT completo           |
| 7  | PUT completo            | `PUT http://localhost:3000/api/reservas/6b036b5574ab2747f3dbfd7f` con siete campos    | 200 JSON, mismo ID                          | **200 OK**, mismo ID, `personas: 3`, `estado: pendiente`                                                              |
| 8  | Verificar en web        | `GET http://localhost:3000/reservas/6b036b5574ab2747f3dbfd7f/editar`                  | Siete campos coincidentes con el PUT        | Formulario con `value="3"` y `value="pendiente"`                                                                      |
| 9  | PUT incompleto          | PUT sin `estado`                                                                       | 400 y documento intacto                     | **400**: `{"error":"Datos de reserva inválidos.","detalles":["El estado debe ser pendiente o confirmada."]}`. GET posterior: 3 / pendiente |
| 10 | ID inválido             | `GET http://localhost:3000/reservas/no-es-un-id/editar`                               | 400 HTML                                    | **400**                                                                                                               |
| 11 | ID válido ausente       | `GET http://localhost:3000/reservas/000000000000000000000000/editar`                  | 404 HTML                                    | **404**                                                                                                               |
| 12 | Reiniciar               | Repetir casos 1 y 3 tras reiniciar                                                     | Reemplazo persistente, mismo ID             | **Pendiente**: no se reinició el servidor para no interrumpir la terminal abierta. Ver sección 5                       |
| 13 | Funcionalidades previas | Alta web, `GET /reservas`, `GET /estado`                                            | Siguen funcionando                          | `GET /reservas`, `/reservas/nueva`, `/`, `/estado` y `/api/reservas` → **200**; `/estado` = 4 reservas                  |

## 3. Detalle de las solicitudes

### 3.1. Abrir edición (precarga)

```http
GET http://localhost:3000/reservas/6b036b5574ab2747f3dbfd7f/editar
```

Params vacío, Body none. La vista mostró:

```text
estudiante = Bruno Ejemplo
email      = bruno@example.com
sala       = Sala Sur (option selected)
fecha      = 2026-11-04
turno      = Tarde (option selected)
personas   = 3
estado     = pendiente (option selected)
```

El `action` del formulario es `/reservas/6b036b5574ab2747f3dbfd7f/editar` y el enlace de cancelación apunta a `/reservas/6b036b5574ab2747f3dbfd7f`. Respuesta: **200 OK**.

### 3.2. Guardar desde la web

```http
POST http://localhost:3000/reservas/6b036b5574ab2747f3dbfd7f/editar
Content-Type: application/x-www-form-urlencoded
```

| Campo      | Valor             |
| ---------- | ----------------- |
| estudiante | Bruno Ejemplo     |
| email      | bruno@example.com |
| sala       | Sala Sur          |
| fecha      | 2026-11-04        |
| turno      | Tarde             |
| personas   | 4                 |
| estado     | confirmada        |

En Postman se desactivó *Settings → Automatically follow redirects* para observar el `303`; con redirects activos se ve el `200 OK` del detalle.

Respuesta obtenida (cabeceras):

```http
HTTP/1.1 303 See Other
Location: /reservas/6b036b5574ab2747f3dbfd7f
```

Verificación con `GET http://localhost:3000/api/reservas/6b036b5574ab2747f3dbfd7f`, Body none:

```json
{
  "id": "6b036b5574ab2747f3dbfd7f",
  "estudiante": "Bruno Ejemplo",
  "email": "bruno@example.com",
  "sala": "Sala Sur",
  "fecha": "2026-11-04",
  "turno": "Tarde",
  "personas": 4,
  "estado": "confirmada"
}
```

### 3.3. Formulario inválido y conservación de valores

```http
POST http://localhost:3000/reservas/6b036b5574ab2747f3dbfd7f/editar
Content-Type: application/x-www-form-urlencoded
```

| Campo      | Valor             |
| ---------- | ----------------- |
| estudiante | Prueba Invalida   |
| email      | bruno@example.com |
| sala       | Sala Sur          |
| fecha      | 2026-11-04        |
| turno      | Tarde             |
| personas   | 0                 |
| estado     | confirmada        |

Resultado obtenido: **400**, vista `editar` con el mensaje *No se pudo guardar la reserva*, `value="Prueba Invalida"` en estudiante y `value="0"` en personas. No aparece el formulario de alta. El `GET` a la API conserva el último reemplazo válido (en ese momento, 4 / confirmada; al repetirlo al final, 3 / pendiente).

Corregir `personas` a `5` y reenviar: **303**, API con `personas: 5`, `estado: confirmada`. Luego se restauró el documento a 3 / pendiente con el PUT del paso 3.4.

### 3.4. PUT completo desde la API

```http
PUT http://localhost:3000/api/reservas/6b036b5574ab2747f3dbfd7f
Content-Type: application/json
```

```json
{
  "estudiante": "Bruno Ejemplo",
  "email": "bruno@example.com",
  "sala": "Sala Sur",
  "fecha": "2026-11-04",
  "turno": "Tarde",
  "personas": 3,
  "estado": "pendiente"
}
```

Resultado obtenido: **200** con el mismo `id` y los siete valores. Al abrir `GET http://localhost:3000/reservas/6b036b5574ab2747f3dbfd7f/editar`, `personas` está en `3` y `estado` en `pendiente`.

### 3.5. PUT incompleto (rechazo)

El mismo cuerpo del paso 3.4 pero **sin la clave `estado`**. Resultado obtenido: **400** con `Datos de reserva inválidos.` y el detalle `El estado debe ser pendiente o confirmada.`. Un `GET` posterior sigue mostrando `personas: 3` y `estado: "pendiente"`.

### 3.6. IDs inválidos

| Solicitud                                                             | Resultado esperado                            | Resultado obtenido |
| --------------------------------------------------------------------- | --------------------------------------------- | ------------------ |
| `GET http://localhost:3000/reservas/no-es-un-id/editar`              | 400 HTML, título *Identificador inválido*     | **400**            |
| `GET http://localhost:3000/reservas/000000000000000000000000/editar` | 404 HTML, título *Reserva no encontrada*      | **404**            |

No se eliminó ninguna reserva para generar el caso ausente.

### 3.7. Cancelación

Se verificó en el HTML de `GET http://localhost:3000/reservas/6b036b5574ab2747f3dbfd7f/editar` que el enlace *Cancelar y volver al detalle* apunta a `/reservas/6b036b5574ab2747f3dbfd7f` y que el formulario solo ofrece ese enlace (no envía POST). La API conservó los valores del último guardado: 3 / pendiente.

## 4. Rechazos adicionales (campos extra y textos)

Todas las solicitudes se enviaron a `POST http://localhost:3000/reservas/6b036b5574ab2747f3dbfd7f/editar` con siete campos válidos más la variante indicada.

| Cuerpo enviado                                    | Resultado esperado                     | Resultado obtenido (22/11/2026) |
| ------------------------------------------------- | -------------------------------------- | ------------------------------- |
| Siete campos válidos más `_id=6b036b...`          | 400, campo no permitido, sin escritura | **400**, sin escritura          |
| Siete campos válidos más `id=6b036b...`           | 400, campo no permitido, sin escritura | **400**, sin escritura          |
| Siete campos válidos más `personas[$gt]=0`        | 400, personas inválido, sin escritura  | **400**, sin escritura          |
| `personas` vacío                                  | 400, entero entre 1 y 6                | **400**, sin escritura          |
| `personas=7`                                      | 400, fuera de rango                    | **400**, sin escritura          |
| `email=anaexample.com` (sin `@`)                  | 400                                    | **400**, sin escritura          |
| `sala=Sala Oeste`                                 | 400                                    | **400**, sin escritura          |
| `turno=Madrugada`                                 | 400                                    | **400**, sin escritura          |
| `estado=otro`                                     | 400                                    | **400**, sin escritura          |
| Falta `fecha`                                     | 400, reemplazo incompleto              | **400**, sin escritura          |

Tras los diez rechazos, `GET /api/reservas/6b036b5574ab2747f3dbfd7f` sigue devolviendo `personas: 3`, `estado: pendiente` y `GET /estado` sigue informando 4 reservas.

## 5. Persistencia tras reiniciar

| Paso | Acción                                                                          | Registro                                                                 |
| ---- | ------------------------------------------------------------------------------- | ------------------------------------------------------------------------ |
| 1    | Guardar un reemplazo válido (se usó `personas=5`, `estado=confirmada`)           | **303**, API con 5 / confirmada                                          |
| 2    | `GET http://localhost:3000/api/reservas/6b036b5574ab2747f3dbfd7f` antes de reiniciar | **200**, mismo ID, `personas: 3`, `estado: pendiente` (tras restaurar con PUT) |
| 3    | `Ctrl + C` en la terminal del servidor                                          | Pendiente de ejecutar                                                    |
| 4    | `node --env-file=.env src/index.js` con la misma base                           | Pendiente de ejecutar                                                    |
| 5    | `GET http://localhost:3000/api/reservas/6b036b5574ab2747f3dbfd7f`                | Pendiente: debe devolver 3 / pendiente                                   |
| 6    | `GET http://localhost:3000/reservas/6b036b5574ab2747f3dbfd7f/editar`             | Pendiente: deben coincidir los siete campos                              |

`GET /estado` antes del reinicio: **4 reservas**. Después del reinicio: pendiente de registrar. No se repitieron altas.

## 6. Funcionalidades previas

| Solicitud                                                                                                               | Resultado esperado                                                | Resultado obtenido                                  |
| ----------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------- | --------------------------------------------------- |
| `GET http://localhost:3000/api/reservas?sala=Sala%20Norte&orden=personas-asc&pagina=1&limite=2`                        | 200 con `datos`, `pagina`, `limite`, `total`, `paginas`            | **200**                                             |
| `GET http://localhost:3000/api/reservas?pagina=0`                                                                      | 400 JSON                                                          | **400**                                             |
| `GET http://localhost:3000/reservas`                                                                                   | 200 HTML, listado simple sin paginación                          | **200**                                             |
| `GET http://localhost:3000/reservas/nueva`                                                                             | 200 HTML, formulario de alta                                      | **200**                                             |
| `GET http://localhost:3000/`                                                                                          | 200 HTML                                                          | **200**                                             |
| `GET http://localhost:3000/estado`                                                                                     | JSON con el total global de reservas                              | **200**, `{"servicio":"activo","reservas":4,...}`    |

## 7. Capturas sugeridas

Si optás por capturas en lugar de transcripción, guardalas en esta carpeta con estos nombres:

1. `01-precarga-editar.png` — siete campos precargados.
2. `02-guardar-web-303.png` — estado 303 y `Location`.
3. `03-api-tras-web.png` — mismo ID y valores nuevos.
4. `04-invalido-400.png` — 400 con valores conservados.
5. `05-put-completo.png` y `06-put-incompleto.png`.
6. `07-id-invalido-ausente.png`.
7. `08-reinicio-persistencia.png`.
8. `09-html-estado.png`.

Las capturas no deben mostrar credenciales ni datos personales reales.

## Apéndice A - Altas adicionales opcionales (referencia del TP10)

Fuera de la consigna mínima del TP11. Si querés reproducir las seis altas del TP10 en la base `reservas_salas_u11` para verificar paginación, usá estas filas en el formulario de alta, una por una:

| Estudiante | Email | Sala | Fecha | Turno | Personas |
| ---------- | ----- | ---- | ----- | ----- | -------- |
| Ana Ejemplo | ana@example.com | Sala Norte | 2026-11-04 | Mañana | 2 |
| Bruno Ejemplo | bruno@example.com | Sala Norte | 2026-11-04 | Mañana | 1 |
| Carla Ejemplo | carla@example.com | Sala Norte | 2026-11-04 | Mañana | 2 |
| Diego Ejemplo | diego@example.com | Sala Norte | 2026-11-04 | Mañana | 3 |
| Elena Ejemplo | elena@example.com | Sala Sur | 2026-11-04 | Mañana | 1 |
| Fabian Ejemplo | fabian@example.com | Sala Multimedia | 2026-11-04 | Mañana | 4 |

Registrá cada ID y `Location` devueltos. Con esas seis altas, `GET /api/reservas?pagina=1&limite=2` debe devolver `total: 6` y `paginas: 3`; `?sala=Sala Norte` debe devolver `total: 4`.
