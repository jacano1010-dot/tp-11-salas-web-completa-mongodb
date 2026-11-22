const express = require("express");

const {
  prepararAreaReservas,
  validarIdRuta,
  validarReserva,
  validarReemplazoWeb,
} = require("../middleware/reservas");

function crearRouterReservas(controlador) {
  const router = express.Router();

  router.use(prepararAreaReservas);

  router.get("/", controlador.listar);

  router.get("/nueva", controlador.nueva);

  // Edición por reemplazo completo (Unidad 11). Se declara antes de /:id.
  router.get("/:id/editar", validarIdRuta, controlador.editar);

  router.post(
    "/:id/editar",
    validarIdRuta,
    validarReemplazoWeb,
    controlador.guardarEdicion
  );

  router.get("/:id", controlador.detalle);

  router.post("/", validarReserva, controlador.crear);

  return router;
}

module.exports = crearRouterReservas;
