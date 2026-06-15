// ============================================================
// calendario.js — Mundialito 2026
// Pantalla "Calendario completo" — todos los partidos del torneo
// en orden cronológico, con filtro opcional por fase
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

    // Orden cronológico global
    const ordenados = [...partidos].sort((a, b) => new Date(a.fecha_hora_utc) - new Date(b.fecha_hora_utc));

    calendarioCache = { partidos: ordenados, predMap };

    // Fases presentes (para los filtros), en el orden de CONFIG.FASES
    const fasesPresentes = CONFIG.FASES.filter(f => ordenados.some(p => p.fase === f));

    // Construir filtro de fases (chips) — "Todos" + cada fase presente
    let tabsHTML = '<div class="cal-tabs" id="cal-tabs">';
    tabsHTML += `<button class="cal-tab active" data-fase="TODOS">Todos</button>`;
    fasesPresentes.forEach(fase => {
      const cantidad = ordenados.filter(p => p.fase === fase).length;
      tabsHTML += `<button class="cal-tab" data-fase="${fase}">${CONFIG.NOMBRES_FASES[fase] || fase} <span class="cal-tab-count">${cantidad}</span></button>`;
    });
    tabsHTML += '</div>';

    // Lista de tarjetas en orden cronológico, con encabezados de fecha
    let listaHTML = '<div id="cal-lista">';
    let fechaAnterior = null;
    ordenados.forEach(p => {
      const fechaCorta = formatearFechaCorta(p.fecha_hora_utc);
      let encabezadoFecha = '';
      if (fechaCorta !== fechaAnterior) {
        encabezadoFecha = `<div class="cal-date-row">${fechaCorta}</div>`;
        fechaAnterior = fechaCorta;
      }
      listaHTML += `<div class="cal-item" data-fase-item="${p.fase}">${encabezadoFecha}${renderTarjetaPartido(p, predMap[p.partido_id], null)}</div>`;
    });
    listaHTML += '</div>';

    contenedor.innerHTML = `
      <style>
        .cal-tabs { display: flex; gap: 6px; overflow-x: auto; margin-bottom: 1rem; padding-bottom: 4px; -webkit-overflow-scrolling: touch; }
        .cal-tab { flex-shrink: 0; font-size: 13px; font-weight: 700; padding: 8px 14px; border-radius: 20px; border: 1.5px solid var(--mw-border); background: var(--mw-card-bg); color: var(--mw-text-sec); cursor: pointer; white-space: nowrap; display: flex; align-items: center; gap: 6px; }
        .cal-tab.active { background: var(--mw-azul); color: #FFFFFF; border-color: var(--mw-azul); }
        .cal-tab-count { font-size: 11px; background: rgba(255,255,255,0.25); border-radius: 8px; padding: 1px 6px; }
        .cal-tab:not(.active) .cal-tab-count { background: var(--mw-bg); color: var(--mw-text-ter); }
        .cal-date-row { font-size: 11px; font-weight: 700; color: var(--mw-text-ter); text-transform: uppercase; letter-spacing: 0.05em; margin: 1rem 0 0.4rem; }
        .cal-item:first-child .cal-date-row { margin-top: 0; }
        .cal-item.hidden { display: none; }
      </style>
      ${tabsHTML}
      ${listaHTML}
    `;

    // Filtro por fase (sin perder el orden cronológico)
    contenedor.querySelectorAll('.cal-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        contenedor.querySelectorAll('.cal-tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        const fase = tab.dataset.fase;

        contenedor.querySelectorAll('.cal-item').forEach(item => {
          if (fase === 'TODOS' || item.dataset.faseItem === fase) {
            item.classList.remove('hidden');
          } else {
            item.classList.add('hidden');
          }
        });

        actualizarEncabezadosFecha(contenedor);
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
// Cuando se filtra por fase, oculta encabezados de fecha
// huérfanos y evita fechas duplicadas consecutivas entre
// los items visibles.
// ─────────────────────────────────────────────────────────────
function actualizarEncabezadosFecha(contenedor) {
  const items = contenedor.querySelectorAll('.cal-item');
  let fechaAnterior = null;
  items.forEach(item => {
    const dateRow = item.querySelector('.cal-date-row');
    if (!dateRow) return;

    if (item.classList.contains('hidden')) {
      dateRow.style.display = 'none';
      return;
    }

    const fechaTexto = dateRow.textContent;
    if (fechaTexto === fechaAnterior) {
      dateRow.style.display = 'none';
    } else {
      dateRow.style.display = '';
      fechaAnterior = fechaTexto;
    }
  });
}
