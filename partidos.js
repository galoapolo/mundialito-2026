// ============================================================
// partidos.js — Mundialito 2026
// Pantalla "Partidos de hoy"
// ============================================================

async function cargarPartidosHoy() {
  const sesion = obtenerSesion();
  const contenedor = document.getElementById('partidos-contenido');
  const fechaEl = document.getElementById('partidos-fecha');

  // Mostrar fecha de hoy en español
  const hoy = new Date();
  let textoFecha = hoy.toLocaleDateString('es', { weekday: 'long', day: 'numeric', month: 'long' });
  textoFecha = textoFecha.charAt(0).toUpperCase() + textoFecha.slice(1);
  fechaEl.textContent = textoFecha;

  contenedor.innerHTML = '<div class="loading-spinner"><i class="ti ti-loader-2" aria-hidden="true"></i> Cargando partidos...</div>';

  try {
    const [respPartidos, respPredicciones, respPuntos] = await Promise.all([
      obtenerPartidos(),
      obtenerPredicciones(sesion.usuario_id),
      obtenerPuntosUsuario(sesion.usuario_id)
    ]);

    if (!respPartidos.exito) throw new Error('No se pudieron cargar los partidos.');

    const partidos = respPartidos.partidos;
    const predicciones = respPredicciones.exito ? respPredicciones.predicciones : [];
    const puntos = respPuntos || {};

    // Mapa de predicciones por partido_id
    const predMap = {};
    predicciones.forEach(p => predMap[p.partido_id] = p);

    // Filtrar partidos relevantes para "hoy":
    // - Partidos de hoy (cualquier estado)
    // - Partidos abiertos/pendientes que aún no han pasado y faltan pocos días (próximos a jugarse)
    const partidosHoy = partidos.filter(p => esHoy(p.fecha_hora_utc));

    // Si no hay partidos hoy, mostrar los próximos 5 partidos pendientes
    let listaAMostrar = partidosHoy;
    let esFallback = false;
    if (listaAMostrar.length === 0) {
      const pendientes = partidos
        .filter(p => (p.estado === 'PENDIENTE' || p.estado === 'ABIERTO') && !yaPaso(p.fecha_hora_utc))
        .sort((a, b) => new Date(a.fecha_hora_utc) - new Date(b.fecha_hora_utc));
      listaAMostrar = pendientes.slice(0, 5);
      esFallback = true;
    }

    if (listaAMostrar.length === 0) {
      contenedor.innerHTML = `
        <div class="empty-state">
          <i class="ti ti-ball-football-off" aria-hidden="true"></i>
          <div class="empty-state-title">No hay partidos por ahora</div>
          <div class="empty-state-sub">Revisa la sección Calendario para ver el resto del torneo.</div>
        </div>
      `;
      return;
    }

    // Separar por estado para los encabezados de sección
    const abiertos = listaAMostrar.filter(p => puedeEditar(p.estado));
    const cerrados = listaAMostrar.filter(p => p.estado === 'CERRADO');
    const finalizados = listaAMostrar.filter(p => p.estado === 'FINALIZADO');

    let html = '';
    if (esFallback) {
      html += `<div class="empty-state" style="padding: 1rem 1rem 1.5rem;">
        <div class="empty-state-sub">No hay partidos programados para hoy. Aquí están los próximos:</div>
      </div>`;
    }

    if (abiertos.length > 0) {
      html += '<div class="section-label">Abierto — puedes predecir</div>';
      abiertos.forEach(p => {
        html += renderTarjetaPartido(p, predMap[p.partido_id], puntos[p.partido_id]);
      });
    }
    if (cerrados.length > 0) {
      html += '<div class="section-label">Cerrado — por comenzar o en juego</div>';
      cerrados.forEach(p => {
        html += renderTarjetaPartido(p, predMap[p.partido_id], puntos[p.partido_id]);
      });
    }
    if (finalizados.length > 0) {
      html += '<div class="section-label">Finalizados</div>';
      finalizados.forEach(p => {
        html += renderTarjetaPartido(p, predMap[p.partido_id], puntos[p.partido_id]);
      });
    }

    contenedor.innerHTML = html;

    // Conectar eventos de cada tarjeta
    contenedor.querySelectorAll('.match-card').forEach(card => {
      attachEventosTarjeta(card, sesion, () => cargarPartidosHoy());
    });

  } catch (e) {
    contenedor.innerHTML = `
      <div class="empty-state">
        <i class="ti ti-alert-triangle" aria-hidden="true"></i>
        <div class="empty-state-title">No se pudo cargar la información</div>
        <div class="empty-state-sub">Revisa tu conexión e intenta de nuevo.</div>
      </div>
    `;
    console.error(e);
  }
}

// ─────────────────────────────────────────────────────────────
// Obtiene el desglose de puntos del usuario, indexado por partido_id
// Reutiliza el endpoint de tabla... en realidad necesitamos un
// endpoint específico. Por ahora devolvemos {} y se complementa
// más adelante si se agrega un endpoint de puntos por partido.
// ─────────────────────────────────────────────────────────────
async function obtenerPuntosUsuario(usuarioId) {
  // Placeholder: el endpoint actual no expone el desglose de puntos
  // por partido vía API. Se puede agregar fácilmente en API.gs
  // si se requiere mostrar el detalle exacto.
  return {};
}
