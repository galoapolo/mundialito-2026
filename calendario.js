// ============================================================
// calendario.js — Mundialito 2026
// Pantalla "Calendario completo" — todos los partidos del torneo
// organizados por fase, con posibilidad de predecir con anticipación
// ============================================================

let calendarioCache = null;

async function cargarCalendario() {
  const sesion = obtenerSesion();
  const contenedor = document.getElementById('calendario-contenido');

  contenedor.innerHTML = '<div class="loading-spinner"><i class="ti ti-loader-2" aria-hidden="true"></i> Cargando calendario...</div>';

  try {
    const [respPartidos, respPredicciones] = await Promise.all([
      obtenerPartidos(),
      obtenerPredicciones(sesion.usuario_id)
    ]);

    if (!respPartidos.exito) throw new Error('No se pudieron cargar los partidos.');

    const partidos = respPartidos.partidos;
    const predicciones = respPredicciones.exito ? respPredicciones.predicciones : [];
    const predMap = {};
    predicciones.forEach(p => predMap[p.partido_id] = p);

    calendarioCache = { partidos, predMap };

    // Agrupar por fase
    const porFase = {};
    CONFIG.FASES.forEach(f => porFase[f] = []);
    partidos.forEach(p => {
      if (!porFase[p.fase]) porFase[p.fase] = [];
      porFase[p.fase].push(p);
    });

    // Ordenar cada fase por fecha
    Object.keys(porFase).forEach(fase => {
      porFase[fase].sort((a, b) => new Date(a.fecha_hora_utc) - new Date(b.fecha_hora_utc));
    });

    // Construir selector de fases (tabs)
    let tabsHTML = '<div class="cal-tabs" id="cal-tabs">';
    CONFIG.FASES.forEach((fase, idx) => {
      const cantidad = porFase[fase] ? porFase[fase].length : 0;
      if (cantidad === 0) return;
      tabsHTML += `<button class="cal-tab ${idx === 0 ? 'active' : ''}" data-fase="${fase}">${CONFIG.NOMBRES_FASES[fase] || fase} <span class="cal-tab-count">${cantidad}</span></button>`;
    });
    tabsHTML += '</div>';

    let panelesHTML = '';
    CONFIG.FASES.forEach((fase, idx) => {
      const lista = porFase[fase];
      if (!lista || lista.length === 0) return;

      panelesHTML += `<div class="cal-panel ${idx === 0 ? 'active' : ''}" data-fase="${fase}">`;

      // En fase de grupos, sub-agrupar por grupo
      if (fase === 'GRUPOS') {
        const porGrupo = {};
        lista.forEach(p => {
          const g = p.grupo || 'Sin grupo';
          if (!porGrupo[g]) porGrupo[g] = [];
          porGrupo[g].push(p);
        });
        Object.keys(porGrupo).sort().forEach(grupo => {
          panelesHTML += `<div class="cal-group-label">${grupo}</div>`;
          porGrupo[grupo].forEach(p => {
            panelesHTML += renderTarjetaCalendario(p, predMap[p.partido_id]);
          });
        });
      } else {
        lista.forEach(p => {
          panelesHTML += renderTarjetaCalendario(p, predMap[p.partido_id]);
        });
      }

      panelesHTML += '</div>';
    });

    contenedor.innerHTML = `
      <style>
        .cal-tabs { display: flex; gap: 6px; overflow-x: auto; margin-bottom: 1rem; padding-bottom: 4px; -webkit-overflow-scrolling: touch; }
        .cal-tab { flex-shrink: 0; font-size: 13px; font-weight: 700; padding: 8px 14px; border-radius: 20px; border: 1.5px solid var(--mw-border); background: var(--mw-card-bg); color: var(--mw-text-sec); cursor: pointer; white-space: nowrap; display: flex; align-items: center; gap: 6px; }
        .cal-tab.active { background: var(--mw-azul); color: #FFFFFF; border-color: var(--mw-azul); }
        .cal-tab-count { font-size: 11px; background: rgba(255,255,255,0.25); border-radius: 8px; padding: 1px 6px; }
        .cal-tab:not(.active) .cal-tab-count { background: var(--mw-bg); color: var(--mw-text-ter); }
        .cal-panel { display: none; }
        .cal-panel.active { display: block; }
        .cal-group-label { font-size: 13px; font-weight: 700; color: var(--mw-azul-texto); background: var(--mw-azul-suave); display: inline-block; padding: 3px 12px; border-radius: 10px; margin: 1rem 0 0.5rem; }
        .cal-group-label:first-child { margin-top: 0; }
        .cal-date-row { font-size: 11px; font-weight: 700; color: var(--mw-text-ter); text-transform: uppercase; letter-spacing: 0.05em; margin: 0.75rem 0 0.4rem; }
        .cal-date-row:first-of-type { margin-top: 0; }
      </style>
      ${tabsHTML}
      ${panelesHTML}
    `;

    // Tabs
    contenedor.querySelectorAll('.cal-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        contenedor.querySelectorAll('.cal-tab').forEach(t => t.classList.remove('active'));
        contenedor.querySelectorAll('.cal-panel').forEach(p => p.classList.remove('active'));
        tab.classList.add('active');
        contenedor.querySelector(`.cal-panel[data-fase="${tab.dataset.fase}"]`).classList.add('active');
      });
    });

    // Eventos de tarjetas
    contenedor.querySelectorAll('.match-card').forEach(card => {
      attachEventosTarjeta(card, sesion, () => cargarCalendario());
    });

  } catch (e) {
    contenedor.innerHTML = `
      <div class="empty-state">
        <i class="ti ti-alert-triangle" aria-hidden="true"></i>
        <div class="empty-state-title">No se pudo cargar el calendario</div>
        <div class="empty-state-sub">Revisa tu conexión e intenta de nuevo.</div>
      </div>
    `;
    console.error(e);
  }
}

// ─────────────────────────────────────────────────────────────
// Tarjeta de calendario: igual a la de partidos, pero con
// la fecha completa visible (no solo la hora)
// ─────────────────────────────────────────────────────────────
function renderTarjetaCalendario(partido, prediccion) {
  const fechaCorta = formatearFechaCorta(partido.fecha_hora_utc);
  const tarjetaBase = renderTarjetaPartido(partido, prediccion, null);

  // Insertar la fecha corta antes de la tarjeta como mini-encabezado
  return `<div class="cal-date-row">${fechaCorta}</div>${tarjetaBase}`;
}
