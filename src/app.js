const path = require("node:path");
const { cwd } = require("node:process");
const express = require("express");
const morgan = require("morgan");
const expressLayouts = require("express-ejs-layouts");

const {
  identificarSolicitud,
  medirDuracion,
} = require("./middleware/solicitudes");

const crearRouterReservas = require("./rutas/reservas");
const crearRouterReservasApi = require("./rutas/reservas-api");

function crearApp({
  controladorReservas,
  controladorReservasApi,
  formatoMorgan,
}) {
  const app = express();

  // Middleware general
  app.use(morgan(formatoMorgan));
  app.use(identificarSolicitud);
  app.use(medirDuracion);

  // Archivos estáticos y formularios
  app.use(expressLayouts);
  app.use(express.static(path.join(cwd(), "public")));
  app.use(express.urlencoded({ extended: true }));
  app.use(express.json());

  // Configuración de EJS
  app.set("view engine", "ejs");
  app.set("views", path.join(cwd(), "views"));
  app.set("layout", "layouts/main");

  // Rutas principales
  app.get("/", controladorReservas.inicio);
  app.get("/estado", controladorReservas.estado);

  // Router HTML
  const reservasRouter = crearRouterReservas(controladorReservas);
  app.use("/reservas", reservasRouter);

  // Router API JSON
  const reservasApiRouter = crearRouterReservasApi(controladorReservasApi);
  app.use("/api/reservas", reservasApiRouter);

  // API: ruta inexistente
  app.use("/api", (req, res) => {
    return res.status(404).json({
      error: "El endpoint solicitado no existe.",
    });
  });

  // HTML: ruta inexistente
  app.use((req, res) => {
    return res.status(404).render("error", {
      titulo: "Página no encontrada",
      mensaje: "La dirección solicitada no existe.",
      estado: 404,
    });
  });

  // Middleware centralizado de errores
  app.use((error, req, res, next) => {
    if (res.headersSent) {
      return next(error);
    }

    const esApi = req.path === "/api" || req.path.startsWith("/api/");

    const esJsonInvalido =
      error instanceof SyntaxError &&
      error.status === 400 &&
      error.type === "entity.parse.failed";

    const esValidacionMongoose =
      error.name === "ValidationError" || error.name === "CastError";

    const estado =
      esJsonInvalido || esValidacionMongoose || error.status === 400
        ? 400
        : 500;

    if (estado === 500) {
      console.error("Error interno al procesar una solicitud.");
    }

    if (esApi) {
      return res.status(estado).json({
        error:
          estado === 400
            ? "La solicitud contiene datos inválidos."
            : "Error interno del servidor.",
      });
    }

    // La edición web se evalúa antes que cualquier otra rama HTML (incluida
    // la de creación): un rechazo del guardado vuelve al mismo formulario.
    if (res.locals.edicion) {
      const edicion = res.locals.edicion;
      const erroresGuardado =
        estado === 400
          ? "No se pudo guardar el reemplazo con los datos recibidos."
          : "Ocurrió un error inesperado al guardar la reserva.";

      return res.status(estado).render("reservas/editar", {
        titulo: "Editar reserva",
        id: edicion.id,
        errores:
          edicion.errores && edicion.errores.length > 0
            ? edicion.errores
            : [erroresGuardado],
        valores: edicion.valores ?? {},
        salasPermitidas: edicion.salasPermitidas ?? [],
        turnosPermitidos: edicion.turnosPermitidos ?? [],
        estadosPermitidos: edicion.estadosPermitidos ?? [],
      });
    }

    // Vista compartida del manejador central: genérica para 400, 404 y 500.
    return res.status(estado).render("error", {
      titulo: estado === 400 ? "Solicitud inválida" : "Error del servidor",
      mensaje:
        estado === 400
          ? "No se pudo procesar la solicitud."
          : "Ocurrió un error inesperado.",
      estado,
    });
  });

  return app;
}

module.exports = crearApp;
