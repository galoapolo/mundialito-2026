// ============================================================
// tabla.js — Mundialito 2026
// Pantalla "Tabla de posiciones" con drill-down por usuario
// ============================================================

async function cargarTabla() {
  var sesion     = obtenerSesion();
  var contenedor = document.getElementById('tabla-contenido');
  var subtitle   = document.getElementById('tabla-subtitle');

  contenedor.innerHTML = '<div class="loading-spinner"><i class="ti ti-loader-2" aria-hidden="true"></i> Cargando tabla...</div>';

  try {
    var results = await Promise.all([
      obtenerTabla(),
      obtenerPartidos(),
      obtenerEspeciales(),
      obtenerTodasPredicciones()
    ]);
    var respTabla        = results[0];
    var respPartidos     = results[1];
    var respEspeciales   = results[2];
    var respPredicciones = results[3];

    if (!respTabla.exito) throw new Error('No se pudo cargar la tabla.');

    var tabla        = respTabla.tabla;
    var partidos     = respPartidos.exito ? respPartidos.partidos : [];
    var especiales   = respEspeciales.exito ? respEspeciales.especiales : [];
    var predicciones = respPredicciones.exito ? respPredicciones.predicciones : [];

    subtitle.textContent = tabla.length + ' participante' + (tabla.length === 1 ? '' : 's') + ' · actualizado cada hora';

    // Mapas auxiliares
    var campeonMap = {};
    especiales.forEach(function(e) { campeonMap[e.usuario_id] = e.equipo_campeon; });

    var partidoMap = {};
    partidos.forEach(function(p) { partidoMap[p.partido_id] = p; });

    // Predicciones indexadas por usuario → lista de predicciones
    var predPorUsuario = {};
    predicciones.forEach(function(pred) {
      if (!predPorUsuario[pred.usuario_id]) predPorUsuario[pred.usuario_id] = [];
      predPorUsuario[pred.usuario_id].push(pred);
    });

    var jugados     = partidos.filter(function(p) { return p.estado === 'FINALIZADO'; }).length;
    var totalP      = partidos.length;
    var porcentaje  = totalP > 0 ? Math.round((jugados / totalP) * 100) : 0;
    var yo          = tabla.find(function(u) { return u.usuario_id === sesion.usuario_id; });
    var miPosicion  = yo ? yo.posicion : '—';
    var misPuntos   = yo ? yo.pts_total : 0;

    var estilos = `
      <style>
        .stats-row { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin-bottom: 1.25rem; }
        .stat-card { background: var(--mw-card-bg); border: 1px solid var(--mw-border); border-radius: var(--mw-radius-md); padding: .85rem 1rem; }
        .stat-val { font-size: 22px; font-weight: 700; color: var(--mw-text); }
        .stat-lbl { font-size: 12px; color: var(--mw-text-sec); margin-top: 2px; font-weight: 600; }
        .table-card { background: var(--mw-card-bg); border: 1px solid var(--mw-border); border-radius: var(--mw-radius-lg); overflow: hidden; }
        .trow { display: flex; align-items: center; gap: 12px; padding: 12px 16px; border-bottom: 1px solid var(--mw-border-soft); cursor: pointer; transition: background .1s; }
        .trow:last-child { border-bottom: none; }
        .trow:hover { background: var(--mw-bg); }
        .trow.you { background: var(--mw-azul-suave); }
        .trow.you:hover { background: #d4e4fa; }
        .rank { font-size: 14px; font-weight: 700; color: var(--mw-text-ter); width: 28px; text-align: center; flex-shrink: 0; }
        .rank.gold { color: #D97706; }
        .rank.silver { color: #6B6964; }
        .rank.bronze { color: #C2410C; }
        .t-avatar { width: 36px; height: 36px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 13px; font-weight: 700; flex-shrink: 0; }
        .av-1 { background: #F7B23B; color: #412402; }
        .av-2 { background: #D3D1C7; color: #2C2C2A; }
        .av-3 { background: #E0282E; color: #FFF; }
        .av-n { background: var(--mw-azul); color: #FFF; }
        .pname { flex: 1; min-width: 0; }
        .pname-main { font-size: 14px; font-weight: 700; color: var(--mw-text); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .pname-sub { font-size: 12px; margin-top: 1px; display: flex; align-items: center; gap: 6px; flex-wrap: wrap; }
        .champ-pill { font-size: 11px; font-weight: 700; padding: 1px 9px; border-radius: 10px; background: var(--mw-verde-suave); color: var(--mw-verde-texto); display: inline-flex; align-items: center; gap: 4px; }
        .champ-pill img.flag { width: 16px; height: 12px; object-fit: cover; border-radius: 2px; }
        .trow.you .champ-pill { background: #FFF; color: var(--mw-verde-texto); }
        .pscore { text-align: right; flex-shrink: 0; }
        .pscore-val { font-size: 18px; font-weight: 700; color: var(--mw-text); }
        .pscore-lbl { font-size: 11px; color: var(--mw-text-ter); font-weight: 600; }
        .trow.you .pscore-lbl { color: var(--mw-azul-texto); }
        .chevron { font-size: 16px; color: var(--mw-text-ter); flex-shrink: 0; }
        .progress-card { background: var(--mw-card-bg); border: 1px solid var(--mw-border); border-radius: var(--mw-radius-lg); padding: 1rem 1.25rem; margin-top: 1rem; }
        .progress-bar { height: 8px; background: var(--mw-bg); border-radius: 10px; margin-top: 8px; overflow: hidden; }
        .progress-fill { height: 100%; background: var(--mw-verde); border-radius: 10px; }

        /* Detalle de usuario */
        .detalle-overlay { position: fixed; inset: 0; background: rgba(31,30,28,.45); z-index: 500; display: flex; align-items: flex-end; }
        .detalle-panel { background: var(--mw-card-bg); border-radius: var(--mw-radius-lg) var(--mw-radius-lg) 0 0; width: 100%; max-height: 85vh; overflow-y: auto; padding: 1.25rem 1.25rem 2rem; box-shadow: 0 -4px 24px rgba(0,0,0,.12); }
        .detalle-handle { width: 36px; height: 4px; background: var(--mw-border); border-radius: 2px; margin: 0 auto 1rem; }
        .detalle-header { display: flex; align-items: center; gap: 12px; margin-bottom: 1.25rem; }
        .detalle-avatar { width: 48px; height: 48px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 18px; font-weight: 700; color: #FFF; background: var(--mw-azul); flex-shrink: 0; }
        .detalle-name { font-size: 18px; font-weight: 700; color: var(--mw-text); }
        .detalle-sub { font-size: 13px; color: var(--mw-text-sec); margin-top: 2px; }
        .detalle-stats { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 8px; margin-bottom: 1.25rem; }
        .detalle-stat { background: var(--mw-bg); border-radius: var(--mw-radius-md); padding: .65rem .85rem; text-align: center; }
        .detalle-stat-val { font-size: 20px; font-weight: 700; color: var(--mw-text); }
        .detalle-stat-lbl { font-size: 11px; color: var(--mw-text-sec); font-weight: 600; }
        .detalle-section-title { font-size: 12px; font-weight: 700; color: var(--mw-text-sec); text-transform: uppercase; letter-spacing: .06em; margin: 1rem 0 .5rem; }
        .hist-row { display: flex; align-items: center; gap: 10px; padding: 9px 0; border-bottom: 1px solid var(--mw-border-soft); }
        .hist-row:last-child { border-bottom: none; }
        .hist-teams { flex: 1; min-width: 0; }
        .hist-teams-main { font-size: 13px; font-weight: 700; color: var(--mw-text); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .hist-teams-sub { font-size: 11px; color: var(--mw-text-sec); margin-top: 1px; }
        .hist-pred { font-size: 13px; font-weight: 600; color: var(--mw-text-sec); text-align: right; flex-shrink: 0; }
        .hist-pts { font-size: 13px; font-weight: 800; min-width: 42px; text-align: right; flex-shrink: 0; }
        .hist-pts.ok   { color: var(--mw-azul); }
        .hist-pts.zero { color: var(--mw-text-ter); }
        .hist-pts.none { color: var(--mw-text-ter); font-weight: 600; font-size: 11px; }
        .hist-empty { font-size: 13px; color: var(--mw-text-sec); text-align: center; padding: 1.5rem 0; }
        .detalle-close { position: absolute; top: 1rem; right: 1rem; background: var(--mw-bg); border: none; border-radius: 50%; width: 32px; height: 32px; font-size: 18px; cursor: pointer; display: flex; align-items: center; justify-content: center; color: var(--mw-text-sec); }
      </style>
    `;

    var statsHTML = `
      <div class="stats-row">
        <div class="stat-card"><div class="stat-val">${miPosicion}${typeof miPosicion === 'number' ? '°' : ''}</div><div class="stat-lbl">Tu posición</div></div>
        <div class="stat-card"><div class="stat-val">${misPuntos}</div><div class="stat-lbl">Tus puntos</div></div>
        <div class="stat-card"><div class="stat-val">${jugados} / ${totalP}</div><div class="stat-lbl">Partidos jugados</div></div>
      </div>
    `;

    var tablaHTML = '<div class="table-card">';
    if (tabla.length === 0) {
      tablaHTML += '<div class="empty-state"><i class="ti ti-trophy" aria-hidden="true"></i><div class="empty-state-title">Aún no hay participantes</div></div>';
    } else {
      tabla.forEach(function(u) {
        var esYo       = u.usuario_id === sesion.usuario_id;
        var rankClass  = u.posicion === 1 ? 'gold' : u.posicion === 2 ? 'silver' : u.posicion === 3 ? 'bronze' : '';
        var avClass    = u.posicion === 1 ? 'av-1' : u.posicion === 2 ? 'av-2' : u.posicion === 3 ? 'av-3' : 'av-n';
        var campeon    = campeonMap[u.usuario_id];
        var campeonHTML = '';
        if (campeon) {
          var eq = obtenerEquipo(campeon);
          campeonHTML = '<span class="champ-pill">Campeón: ' + eq.es + ' ' + renderBandera(eq) + '</span>';
        }
        tablaHTML += `
          <div class="trow ${esYo ? 'you' : ''}" data-usuario-id="${u.usuario_id}" data-usuario-nombre="${u.nombre}">
            <div class="rank ${rankClass}">${u.posicion}°</div>
            <div class="t-avatar ${avClass}">${iniciales(u.nombre)}</div>
            <div class="pname">
              <div class="pname-main">${u.nombre}${esYo ? ' (tú)' : ''}</div>
              <div class="pname-sub">${campeonHTML}</div>
            </div>
            <div class="pscore">
              <div class="pscore-val">${u.pts_total}</div>
              <div class="pscore-lbl">pts</div>
            </div>
            <i class="ti ti-chevron-right chevron" aria-hidden="true"></i>
          </div>
        `;
      });
    }
    tablaHTML += '</div>';

    var progresoHTML = `
      <div class="progress-card">
        <div style="display:flex;justify-content:space-between;align-items:baseline;flex-wrap:wrap;gap:4px;">
          <span style="font-size:13px;font-weight:700;color:var(--mw-text);">Progreso del torneo</span>
          <span style="font-size:12px;color:var(--mw-text-sec);font-weight:600;">${jugados} de ${totalP} partidos</span>
        </div>
        <div class="progress-bar"><div class="progress-fill" style="width:${porcentaje}%"></div></div>
        <div style="font-size:12px;color:var(--mw-text-ter);margin-top:6px;font-weight:600;">
          ${totalP - jugados > 0 ? 'Quedan ' + (totalP - jugados) + ' partidos — ¡cualquiera puede remontar!' : 'El torneo ha terminado.'}
        </div>
      </div>
    `;

    contenedor.innerHTML = estilos + statsHTML + tablaHTML + progresoHTML;

    // Click en fila → abrir detalle del usuario
    contenedor.querySelectorAll('.trow[data-usuario-id]').forEach(function(fila) {
      fila.addEventListener('click', function() {
        var uid     = fila.dataset.usuarioId;
        var nombre  = fila.dataset.usuarioNombre;
        var userPreds = predPorUsuario[uid] || [];
        var userEntry = tabla.find(function(u) { return u.usuario_id === uid; });
        mostrarDetalleUsuario(uid, nombre, userEntry, userPreds, partidoMap, campeonMap[uid]);
      });
    });

  } catch(e) {
    contenedor.innerHTML = '<div class="empty-state"><i class="ti ti-alert-triangle" aria-hidden="true"></i><div class="empty-state-title">No se pudo cargar la tabla</div><div class="empty-state-sub">Revisa tu conexión e intenta de nuevo.</div></div>';
    console.error(e);
  }
}

// ─────────────────────────────────────────────────────────────
// Panel deslizante con historial detallado de un usuario
// ─────────────────────────────────────────────────────────────
function mostrarDetalleUsuario(uid, nombre, userEntry, predicciones, partidoMap, campeon) {
  // Remover panel anterior si existe
  var anterior = document.getElementById('detalle-overlay');
  if (anterior) anterior.remove();

  // Calcular estadísticas del usuario
  var pts       = userEntry ? userEntry.pts_total : 0;
  var posicion  = userEntry ? userEntry.posicion  : '—';

  // Historial de predicciones vs resultados reales
  var predFinalizadas = predicciones.filter(function(p) {
    var partido = partidoMap[p.partido_id];
    return partido && partido.estado === 'FINALIZADO';
  }).sort(function(a, b) {
    var pa = partidoMap[a.partido_id];
    var pb = partidoMap[b.partido_id];
    return new Date(pb.fecha_hora_utc) - new Date(pa.fecha_hora_utc); // más recientes primero
  });

  var acertados = 0;
  var filasHist = '';

  predFinalizadas.forEach(function(pred) {
    var partido  = partidoMap[pred.partido_id];
    if (!partido) return;

    var esElim   = partido.es_eliminatoria;
    var local    = obtenerEquipo(partido.equipo_local);
    var visitante = obtenerEquipo(partido.equipo_visitante);

    // Resultado real
    var glReal = (esElim && partido.goles_local_120 !== '' && partido.goles_local_120 !== null)
      ? parseInt(partido.goles_local_120) : parseInt(partido.goles_local);
    var gvReal = (esElim && partido.goles_visitante_120 !== '' && partido.goles_visitante_120 !== null)
      ? parseInt(partido.goles_visitante_120) : parseInt(partido.goles_visitante);

    var ganadorReal = partido.ganador || (glReal > gvReal ? partido.equipo_local : gvReal > glReal ? partido.equipo_visitante : 'EMPATE');

    // Calcular puntos de esta predicción
    var glPred    = parseInt(pred.goles_local_pred);
    var gvPred    = parseInt(pred.goles_visitante_pred);
    var acGanador = pred.ganador_pred === ganadorReal;
    var acMarcador = acGanador && glPred === glReal && gvPred === gvReal;
    var acDif     = acGanador && !acMarcador && (glPred - gvPred) === (glReal - gvReal);
    var huboPen   = partido.hubo_penales === true || partido.hubo_penales === 'TRUE';
    var predPen   = pred.penales_pred === true || pred.penales_pred === 'TRUE' || pred.penales_pred === 'true';
    var acPen     = esElim && predPen === huboPen;
    var esFinal   = partido.fase === 'FINAL';
    var mult      = esFinal ? 2 : 1;

    var ptsPartido = 0;
    if (acMarcador)      ptsPartido = 5 * mult;
    else if (acGanador)  ptsPartido = (3 + (acDif ? 1 : 0)) * mult;
    if (esElim && acPen) ptsPartido += 2 * mult;

    if (ptsPartido > 0) acertados++;

    var icono = acMarcador ? '🎯' : acGanador ? '✅' : '❌';
    var ptsClass = ptsPartido > 0 ? 'ok' : 'zero';

    filasHist += `
      <div class="hist-row">
        <div style="font-size:16px;flex-shrink:0">${icono}</div>
        <div class="hist-teams">
          <div class="hist-teams-main">${local.es} ${glReal}–${gvReal} ${visitante.es}</div>
          <div class="hist-teams-sub">${formatearFechaCorta(partido.fecha_hora_utc)} · Tu pred: ${glPred}–${gvPred}</div>
        </div>
        <div class="hist-pts ${ptsClass}">${ptsPartido > 0 ? '+' + ptsPartido + ' pts' : '0 pts'}</div>
      </div>
    `;
  });

  // Predicciones pendientes (partidos no finalizados)
  var predPendientes = predicciones.filter(function(p) {
    var partido = partidoMap[p.partido_id];
    return partido && partido.estado !== 'FINALIZADO';
  });

  if (filasHist === '') {
    filasHist = '<div class="hist-empty">No hay partidos finalizados con predicción aún.</div>';
  }

  // Campeón elegido
  var campeonHTML = '';
  if (campeon) {
    var eq = obtenerEquipo(campeon);
    campeonHTML = `<div style="display:flex;align-items:center;gap:8px;padding:8px 0;border-bottom:1px solid var(--mw-border-soft);">
      ${renderBandera(eq)}
      <div><div style="font-size:13px;font-weight:700;color:var(--mw-text)">Campeón elegido: ${eq.es}</div>
      <div style="font-size:11px;color:var(--mw-text-sec)">15 pts si acierta · no se puede cambiar</div></div>
    </div>`;
  }

  var overlay = document.createElement('div');
  overlay.id        = 'detalle-overlay';
  overlay.className = 'detalle-overlay';
  overlay.innerHTML = `
    <div class="detalle-panel" style="position:relative">
      <button class="detalle-close" id="detalle-close-btn">✕</button>
      <div class="detalle-handle"></div>
      <div class="detalle-header">
        <div class="detalle-avatar">${iniciales(nombre)}</div>
        <div>
          <div class="detalle-name">${nombre}</div>
          <div class="detalle-sub">Posición ${posicion}° · ${pts} pts totales</div>
        </div>
      </div>
      <div class="detalle-stats">
        <div class="detalle-stat"><div class="detalle-stat-val">${pts}</div><div class="detalle-stat-lbl">Puntos</div></div>
        <div class="detalle-stat"><div class="detalle-stat-val">${acertados}</div><div class="detalle-stat-lbl">Acertados</div></div>
        <div class="detalle-stat"><div class="detalle-stat-val">${predPendientes.length}</div><div class="detalle-stat-lbl">Pendientes</div></div>
      </div>
      ${campeonHTML}
      <div class="detalle-section-title">Historial de predicciones</div>
      ${filasHist}
    </div>
  `;

  document.body.appendChild(overlay);

  // Cerrar al tocar el fondo o el botón ✕
  overlay.addEventListener('click', function(e) {
    if (e.target === overlay) overlay.remove();
  });
  overlay.querySelector('#detalle-close-btn').addEventListener('click', function() {
    overlay.remove();
  });
}
