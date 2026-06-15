// ============================================================
// tabla.js — Mundialito 2026
// Pantalla "Tabla de posiciones"
// ============================================================

async function cargarTabla() {
  const sesion = obtenerSesion();
  const contenedor = document.getElementById('tabla-contenido');
  const subtitle = document.getElementById('tabla-subtitle');

  contenedor.innerHTML = '<div class="loading-spinner"><i class="ti ti-loader-2" aria-hidden="true"></i> Cargando tabla...</div>';

  try {
    const [respTabla, respPartidos, respEspeciales] = await Promise.all([
      obtenerTabla(),
      obtenerPartidos(),
      obtenerEspeciales()
    ]);

    if (!respTabla.exito) throw new Error('No se pudo cargar la tabla.');

    const tabla = respTabla.tabla;
    const partidos = respPartidos.exito ? respPartidos.partidos : [];
    const especiales = respEspeciales.exito ? respEspeciales.especiales : [];

    subtitle.textContent = `${tabla.length} participante${tabla.length === 1 ? '' : 's'} · actualizado automáticamente cada hora`;

    // Mapa de campeón elegido por usuario
    const campeonMap = {};
    especiales.forEach(e => campeonMap[e.usuario_id] = e.equipo_campeon);

    // Progreso del torneo
    const totalPartidos = partidos.length;
    const jugados = partidos.filter(p => p.estado === 'FINALIZADO').length;
    const porcentaje = totalPartidos > 0 ? Math.round((jugados / totalPartidos) * 100) : 0;

    // Datos del usuario actual
    const yo = tabla.find(u => u.usuario_id === sesion.usuario_id);
    const miPosicion = yo ? yo.posicion : '—';
    const misPuntos = yo ? yo.pts_total : 0;

    let html = `
      <style>
        .stats-row { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin-bottom: 1.25rem; }
        .stat-card { background: var(--mw-card-bg); border: 1px solid var(--mw-border); border-radius: var(--mw-radius-md); padding: 0.85rem 1rem; }
        .stat-val { font-size: 22px; font-weight: 700; color: var(--mw-text); }
        .stat-lbl { font-size: 12px; color: var(--mw-text-sec); margin-top: 2px; font-weight: 600; }
        .table-card { background: var(--mw-card-bg); border: 1px solid var(--mw-border); border-radius: var(--mw-radius-lg); overflow: hidden; }
        .trow { display: flex; align-items: center; gap: 12px; padding: 12px 16px; border-bottom: 1px solid var(--mw-border-soft); }
        .trow:last-child { border-bottom: none; }
        .trow.you { background: var(--mw-azul-suave); }
        .rank { font-size: 14px; font-weight: 700; color: var(--mw-text-ter); width: 28px; text-align: center; flex-shrink: 0; }
        .rank.gold { color: var(--mw-dorado-texto); }
        .rank.silver { color: #6B6964; }
        .rank.bronze { color: var(--mw-rojo-texto); }
        .t-avatar { width: 36px; height: 36px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 13px; font-weight: 700; flex-shrink: 0; }
        .av-1 { background: var(--mw-dorado); color: #412402; }
        .av-2 { background: #D3D1C7; color: #2C2C2A; }
        .av-3 { background: var(--mw-rojo); color: #FFFFFF; }
        .av-n { background: var(--mw-azul); color: #FFFFFF; }
        .pname { flex: 1; min-width: 0; }
        .pname-main { font-size: 14px; font-weight: 700; color: var(--mw-text); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .pname-sub { font-size: 12px; margin-top: 1px; display: flex; align-items: center; gap: 6px; }
        .champ-pill { font-size: 11px; font-weight: 700; padding: 1px 9px; border-radius: 10px; background: var(--mw-verde-suave); color: var(--mw-verde-texto); white-space: nowrap; }
        .trow.you .champ-pill { background: #FFFFFF; color: var(--mw-verde-texto); }
        .pscore { text-align: right; flex-shrink: 0; }
        .pscore-val { font-size: 18px; font-weight: 700; color: var(--mw-text); }
        .pscore-lbl { font-size: 11px; color: var(--mw-text-ter); font-weight: 600; }
        .trow.you .pscore-lbl { color: var(--mw-azul-texto); }
        .progress-card { background: var(--mw-card-bg); border: 1px solid var(--mw-border); border-radius: var(--mw-radius-lg); padding: 1rem 1.25rem; margin-top: 1rem; }
        .progress-bar { height: 8px; background: var(--mw-bg); border-radius: 10px; margin-top: 8px; overflow: hidden; }
        .progress-fill { height: 100%; background: var(--mw-verde); border-radius: 10px; }
      </style>

      <div class="stats-row">
        <div class="stat-card">
          <div class="stat-val">${miPosicion}${typeof miPosicion === 'number' ? '°' : ''}</div>
          <div class="stat-lbl">Tu posición</div>
        </div>
        <div class="stat-card">
          <div class="stat-val">${misPuntos}</div>
          <div class="stat-lbl">Tus puntos</div>
        </div>
        <div class="stat-card">
          <div class="stat-val">${jugados} / ${totalPartidos}</div>
          <div class="stat-lbl">Partidos jugados</div>
        </div>
      </div>

      <div class="table-card">
    `;

    if (tabla.length === 0) {
      html += `
        <div class="empty-state">
          <i class="ti ti-trophy" aria-hidden="true"></i>
          <div class="empty-state-title">Aún no hay participantes</div>
          <div class="empty-state-sub">La tabla se llenará conforme la gente empiece a predecir.</div>
        </div>
      `;
    } else {
      tabla.forEach((u, idx) => {
        const esYo = u.usuario_id === sesion.usuario_id;
        let rankClass = '';
        let avClass = 'av-n';
        let medalla = `${u.posicion}°`;
        if (u.posicion === 1) { rankClass = 'gold'; avClass = 'av-1'; }
        if (u.posicion === 2) { rankClass = 'silver'; avClass = 'av-2'; }
        if (u.posicion === 3) { rankClass = 'bronze'; avClass = 'av-3'; }

        const campeonEquipo = campeonMap[u.usuario_id];
        let campeonHTML = '';
        if (campeonEquipo) {
          const eq = obtenerEquipo(campeonEquipo);
          campeonHTML = `<span class="champ-pill">Campeón: ${eq.es} ${eq.flag}</span>`;
        }

        html += `
          <div class="trow ${esYo ? 'you' : ''}">
            <div class="rank ${rankClass}">${medalla}</div>
            <div class="t-avatar ${avClass}">${iniciales(u.nombre)}</div>
            <div class="pname">
              <div class="pname-main">${u.nombre}${esYo ? ' (tú)' : ''}</div>
              <div class="pname-sub">${campeonHTML}</div>
            </div>
            <div class="pscore">
              <div class="pscore-val">${u.pts_total}</div>
              <div class="pscore-lbl">puntos</div>
            </div>
          </div>
        `;
      });
    }

    html += `</div>`;

    // Barra de progreso del torneo
    const restantes = totalPartidos - jugados;
    html += `
      <div class="progress-card">
        <div style="display:flex; justify-content:space-between; align-items:baseline; flex-wrap: wrap; gap: 4px;">
          <span style="font-size:13px; font-weight:700; color: var(--mw-text);">Progreso del torneo</span>
          <span style="font-size:12px; color: var(--mw-text-sec); font-weight: 600;">${jugados} de ${totalPartidos} partidos jugados</span>
        </div>
        <div class="progress-bar"><div class="progress-fill" style="width:${porcentaje}%"></div></div>
        <div style="font-size:12px; color: var(--mw-text-ter); margin-top:6px; font-weight: 600;">
          ${restantes > 0 ? `Todavía quedan ${restantes} partidos — ¡cualquiera puede remontar!` : 'El torneo ha terminado.'}
        </div>
      </div>
    `;

    contenedor.innerHTML = html;

  } catch (e) {
    contenedor.innerHTML = `
      <div class="empty-state">
        <i class="ti ti-alert-triangle" aria-hidden="true"></i>
        <div class="empty-state-title">No se pudo cargar la tabla</div>
        <div class="empty-state-sub">Revisa tu conexión e intenta de nuevo.</div>
      </div>
    `;
    console.error(e);
  }
}
