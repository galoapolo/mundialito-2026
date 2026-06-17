// ============================================================
// partidos.js — Mundialito 2026
// Pantalla "Partidos de hoy"
// ============================================================

async function cargarPartidosHoy() {
  const sesion = obtenerSesion();
  const contenedor = document.getElementById('partidos-contenido');
  const fechaEl = document.getElementById('partidos-fecha');

  // Fecha de hoy en español
  const hoy = new Date();
  let textoFecha = hoy.toLocaleDateString('es', { weekday: 'long', day: 'numeric', month: 'long' });
  textoFecha = textoFecha.charAt(0).toUpperCase() + textoFecha.slice(1);
  fechaEl.textContent = textoFecha;

  contenedor.innerHTML = '<div class="loading-spinner"><i class="ti ti-loader-2" aria-hidden="true"></i> Cargando partidos...</div>';

  try {
    const [respPartidos, respPredicciones] = await Promise.all([
      obtenerPartidos(),
      obtenerPredicciones(sesion.usuario_id)
    ]);

    if (!respPartidos.exito) throw new Error('No se pudieron cargar los partidos.');

    const partidos    = respPartidos.partidos;
    const predicciones = respPredicciones.exito ? respPredicciones.predicciones : [];

    // Mapa de predicciones por partido_id
    const predMap = {};
    predicciones.forEach(p => predMap[p.partido_id] = p);

    // Calcular puntos en el frontend para partidos finalizados
    const puntosMap = calcularPuntosFrontend(partidos, predMap);

    // Partidos de hoy
    let listaAMostrar = partidos.filter(p => esHoy(p.fecha_hora_utc));
    let esFallback = false;

    // Si no hay partidos hoy, mostrar los próximos 5 pendientes
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

    const abiertos    = listaAMostrar.filter(p => puedeEditar(p.estado, p.fecha_hora_utc));
    const cerrados    = listaAMostrar.filter(p => p.estado === 'CERRADO');
    const finalizados = listaAMostrar.filter(p => p.estado === 'FINALIZADO');

    let html = '';
    if (esFallback) {
      html += `<div class="empty-state" style="padding:1rem 1rem 1.5rem;">
        <div class="empty-state-sub">No hay partidos hoy. Aquí están los próximos:</div>
      </div>`;
    }

    if (abiertos.length > 0) {
      html += '<div class="section-label">Abierto — puedes predecir</div>';
      abiertos.forEach(p => {
        html += renderTarjetaPartido(p, predMap[p.partido_id], puntosMap[p.partido_id]);
      });
    }
    if (cerrados.length > 0) {
      html += '<div class="section-label">Cerrado — por comenzar o en juego</div>';
      cerrados.forEach(p => {
        html += renderTarjetaPartido(p, predMap[p.partido_id], puntosMap[p.partido_id]);
      });
    }
    if (finalizados.length > 0) {
      html += '<div class="section-label">Finalizados</div>';
      finalizados.forEach(p => {
        html += renderTarjetaPartido(p, predMap[p.partido_id], puntosMap[p.partido_id]);
      });
    }

    contenedor.innerHTML = html;

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
// Calcula puntos en el frontend para todos los partidos
// finalizados — misma lógica que en predicciones.js
// ─────────────────────────────────────────────────────────────
function calcularPuntosFrontend(partidos, predMap) {
  const puntosMap = {};

  partidos.forEach(partido => {
    if (partido.estado !== 'FINALIZADO') return;
    const pred = predMap[partido.partido_id];
    if (!pred || !pred.ganador_pred) return;

    const esElim  = partido.es_eliminatoria;
    const esFinal = partido.fase === 'FINAL';

    const golesLocalReal = (esElim && partido.goles_local_120 !== '' && partido.goles_local_120 !== null)
      ? parseInt(partido.goles_local_120) : parseInt(partido.goles_local);
    const golesVisitanteReal = (esElim && partido.goles_visitante_120 !== '' && partido.goles_visitante_120 !== null)
      ? parseInt(partido.goles_visitante_120) : parseInt(partido.goles_visitante);

    let ganadorReal;
    if (partido.ganador && partido.ganador !== '') {
      ganadorReal = partido.ganador;
    } else if (golesLocalReal > golesVisitanteReal) {
      ganadorReal = partido.equipo_local;
    } else if (golesVisitanteReal > golesLocalReal) {
      ganadorReal = partido.equipo_visitante;
    } else {
      ganadorReal = 'EMPATE';
    }

    const golesLocalPred     = parseInt(pred.goles_local_pred);
    const golesVisitantePred = parseInt(pred.goles_visitante_pred);

    const acertoGanador  = pred.ganador_pred === ganadorReal;
    const acertoMarcador = acertoGanador &&
      golesLocalPred === golesLocalReal && golesVisitantePred === golesVisitanteReal;
    const acertoDif = acertoGanador && !acertoMarcador &&
      (golesLocalPred - golesVisitantePred) === (golesLocalReal - golesVisitanteReal);

    const huboPenales    = partido.hubo_penales === true || partido.hubo_penales === 'TRUE';
    const predijoPenales = pred.penales_pred === true || pred.penales_pred === 'TRUE' || pred.penales_pred === 'true';
    const acertoPenales  = esElim && predijoPenales === huboPenales;

    const mult = esFinal ? 2 : 1;
    let pts = 0;
    if (acertoMarcador)     pts = 5 * mult;
    else if (acertoGanador) pts = (3 + (acertoDif ? 1 : 0)) * mult;
    if (esElim && acertoPenales) pts += 2 * mult;

    puntosMap[partido.partido_id] = { pts_total: pts };
  });

  return puntosMap;
}
