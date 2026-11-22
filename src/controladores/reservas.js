function crearControladorReservas(servicio) {
  function inicio(req, res) {
    res.render("inicio", {
      titulo: "Reservas de salas de estudio",
    });
  }

  async function estado(req, res) {
    const cantidad = await servicio.contar();

    return res.json({
      servicio: "activo",
      reservas: cantidad,
      solicitudId: res.locals.solicitudId,
    });
  }

  async function listar(req, res) {
    const reservas = await servicio.listar();

    return res.render("reservas/lista", {
      titulo: "Reservas registradas",
      reservas,
    });
  }

  function nueva(req, res) {
    return res.render("reservas/nueva", {
      titulo: "Nueva reserva",
      errores: [],
      valores: {},
      salasPermitidas: servicio.obtenerSalasPermitidas(),
      turnosPermitidos: servicio.obtenerTurnosPermitidos(),
    });
  }

  async function detalle(req, res) {
    const id = req.params.id;

    if (!/^[a-fA-F0-9]{24}$/.test(id)) {
      return res.status(400).render("no-encontrado", {
        titulo: "Identificador inválido",
        mensaje: "El identificador de la reserva no es válido.",
      });
    }

    const reserva = await servicio.buscarPorId(id);

    if (!reserva) {
      return res.status(404).render("no-encontrado", {
        titulo: "Reserva no encontrada",
        mensaje: "La reserva solicitada no existe.",
      });
    }

    return res.render("reservas/detalle", {
      titulo: "Detalle de la reserva",
      reserva,
    });
  }

  async function crear(req, res) {
    await servicio.crear(req.reservaValidada);

    return res.redirect(302, "/reservas");
  }

  function valoresDesdeReserva(reserva) {
    return {
      estudiante: String(reserva.estudiante ?? ""),
      email: String(reserva.email ?? ""),
      sala: String(reserva.sala ?? ""),
      fecha: String(reserva.fecha ?? ""),
      turno: String(reserva.turno ?? ""),
      personas: String(reserva.personas ?? ""),
      estado: String(reserva.estado ?? ""),
    };
  }

  function datosEdicion(id, errores, valores) {
    return {
      titulo: "Editar reserva",
      id,
      errores,
      valores,
      salasPermitidas: servicio.obtenerSalasPermitidas(),
      turnosPermitidos: servicio.obtenerTurnosPermitidos(),
      estadosPermitidos: servicio.obtenerEstadosPermitidos(),
    };
  }

  async function editar(req, res) {
    const id = req.params.id;
    const reserva = await servicio.buscarPorId(id);

    if (!reserva) {
      return res.status(404).render("error", {
        titulo: "Reserva no encontrada",
        mensaje: "La reserva solicitada no existe.",
        estado: 404,
      });
    }

    const valores = valoresDesdeReserva(reserva);

    // Contexto disponible para el manejador central si el servicio falla.
    res.locals.edicion = {
      id,
      errores: [],
      valores,
      salasPermitidas: servicio.obtenerSalasPermitidas(),
      turnosPermitidos: servicio.obtenerTurnosPermitidos(),
      estadosPermitidos: servicio.obtenerEstadosPermitidos(),
    };

    return res.render("reservas/editar", datosEdicion(id, [], valores));
  }

  async function guardarEdicion(req, res) {
    const id = req.params.id;
    const validada = req.reservaValidada;

    // Se construyen solamente los siete campos editables. El id viene de la
    // ruta y nunca se toma del cuerpo del formulario.
    const datos = {
      estudiante: validada.estudiante,
      email: validada.email,
      sala: validada.sala,
      fecha: validada.fecha,
      turno: validada.turno,
      personas: validada.personas,
      estado: validada.estado,
    };

    if (!res.locals.edicion) {
      res.locals.edicion = {
        id,
        errores: [],
        valores: valoresDesdeReserva(datos),
        salasPermitidas: servicio.obtenerSalasPermitidas(),
        turnosPermitidos: servicio.obtenerTurnosPermitidos(),
        estadosPermitidos: servicio.obtenerEstadosPermitidos(),
      };
    }

    const reserva = await servicio.reemplazar(id, datos);

    if (!reserva) {
      return res.status(404).render("error", {
        titulo: "Reserva no encontrada",
        mensaje: "La reserva solicitada no existe.",
        estado: 404,
      });
    }

    // Destino elegido y documentado: el detalle de la misma reserva.
    return res.redirect(303, `/reservas/${reserva.id}`);
  }

  return {
    inicio,
    estado,
    listar,
    nueva,
    detalle,
    crear,
    editar,
    guardarEdicion,
  };
}

module.exports = crearControladorReservas;
