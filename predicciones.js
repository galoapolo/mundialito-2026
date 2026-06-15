// ============================================================
// predicciones.js — Mundialito 2026
// Pantalla "Predicciones" — ver las de todos, editar solo las propias
// Incluye también la selección de campeón (pronóstico especial)
// ============================================================

async function cargarPredicciones() {
  const sesion = obtenerSesion();
  const contenedor = document.getElementById('predicciones-contenido');

  contenedor.innerHTML = '<div class="loading-spinner"><i class="ti ti-loader-2" aria-hidden="true"></i> Cargando predicciones...</div>';

  try {
    const [respPartidos, respPredicciones, respEspeciales] = await Promise.all([
      obtenerPartidos(),
      obtenerTodasPredicciones(),
      obtenerEspeciales()
    ]);

    if (!respPartidos.exito) throw new Error('No se pudieron cargar los partidos.');

    const partidos = respPartidos.partidos;
    const todasPredicciones = respPredicciones.exito ? respPredicciones.predicciones : [];
    const especiales = respEspeciales.exito ? respEspeciales.especiales : [];

    // Mapa de partidos por id
    const partidoMap = {};
    partidos.forEach(p => partidoMap[p.partido_id] = p);

    // Agrupar predicciones por partido
    const predPorPartido = {};
    todasPredicciones.forEach(pred => {
      if (!predPorPartido[pred.partido_id]) predPorPartido[pred.partido_id] = [];
      predPorPartido[pred.partido_id].push(pred);
    });

    // Ordenar partidos: primero los que tienen predicciones próximas/abiertas, luego el resto por fecha
    const partidosConPred = Object.keys(predPorPartido)
      .map(pid => partidoMap[pid])
      .filter(p => p) // descartar si el partido ya no existe
      .sort((a, b) => new Date(b.fecha_hora_utc) - new Date(a.fecha_hora_utc)); // más recientes primero

    // ── Sección de campeón ──────────────────────────────────────
    const miCampeon = especiales.find(e => e.usuario_id === sesion.usuario_id);
    let campeonHTML = renderSeccionCampeon(miCampeon, especiales, sesion);

    // ── Lista de predicciones por partido ───────────────────────
    let listaHTML = '<div class="section-label">Predicciones por partido</div>';

    if (partidosConPred.length === 0) {
      listaHTML += `
        <div class="empty-state">
          <i class="ti ti-users" aria-hidden="true"></i>
          <div class="empty-state-title">Todavía no hay predicciones</div>
          <div class="empty-state-sub">Cuando alguien prediga un partido, aparecerá aquí.</div>
        </div>
      `;
    } else {
      partidosConPred.forEach(partido => {
        listaHTML += renderGrupoPredicciones(partido, predPorPartido[partido.partido_id], sesion);
      });
    }

    contenedor.innerHTML = `
      <style>
        .champ-card { background: var(--mw-card-bg); border: 1px solid var(--mw-border); border-radius: var(--mw-radius-lg); padding: 1rem 1.25rem; margin-bottom: 1.25rem; }
        .champ-title { font-size: 14px; font-weight: 700; color: var(--mw-text); margin-bottom: 4px; }
        .champ-desc { font-size: 12px; color: var(--mw-text-sec); margin-bottom: 12px; }
        .champ-select-row { display: flex; gap: 8px; flex-wrap: wrap; }
        .champ-select { flex: 1; min-width: 180px; height: 44px; border: 1.5px solid var(--mw-border); border-radius: var(--mw-radius-md); padding: 0 12px; font-size: 14px; background: var(--mw-bg); color: var(--mw-text); }
        .champ-locked { display: flex; align-items: center; gap: 10px; padding: 10px 12px; background: var(--mw-verde-suave); border-radius: var(--mw-radius-md); }
        .champ-locked .flag { width: 40px; height: 30px; object-fit: cover; border-radius: 4px; font-size: 28px; }
        .champ-locked-text { font-size: 14px; font-weight: 700; color: var(--mw-verde-texto); }
        .champ-locked-sub { font-size: 12px; color: var(--mw-verde-texto); opacity: 0.8; }

        .pred-group { background: var(--mw-card-bg); border: 1px solid var(--mw-border); border-radius: var(--mw-radius-lg); padding: 14px 16px; margin-bottom: 10px; }
        .pred-group-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 10px; gap: 8px; flex-wrap: wrap; }
        .pred-group-teams { font-size: 14px; font-weight: 700; color: var(--mw-text); display: flex; align-items: center; gap: 6px; }
        .pred-group-teams img.flag { width: 22px; height: 16px; object-fit: cover; border-radius: 3px; }
        .pred-group-meta { font-size: 12px; color: var(--mw-text-sec); font-weight: 600; }
        .pred-row { display: flex; align-items: center; gap: 10px; padding: 8px 0; border-top: 1px solid var(--mw-border-soft); }
        .pred-row:first-of-type { border-top: none; }
        .pred-row.you { background: var(--mw-azul-suave); margin: 0 -16px; padding: 8px 16px; border-radius: var(--mw-radius-sm); border-top: none; }
        .pred-avatar { width: 28px; height: 28px; border-radius: 50%; background: var(--mw-verde); color: #FFFFFF; display: flex; align-items: center; justify-content: center; font-size: 11px; font-weight: 700; flex-shrink: 0; }
        .pred-row.you .pred-avatar { background: var(--mw-azul); }
        .pred-name { flex: 1; font-size: 13px; font-weight: 700; color: var(--mw-text); }
        .pred-value { font-size: 13px; font-weight: 700; color: var(--mw-text); }
        .pred-pen { font-size: 11px; font-weight: 600; color: var(--mw-text-sec); margin-left: 6px; }
        .pred-edit-btn { font-size: 12px; font-weight: 700; color: var(--mw-azul); background: none; border: none; cursor: pointer; padding: 2px 8px; }
      </style>
      ${campeonHTML}
      ${listaHTML}
    `;

    // Eventos del selector de campeón
    const champSelect = contenedor.querySelector('#champ-select');
    const champBtn = contenedor.querySelector('#champ-confirm-btn');
    if (champSelect && champBtn) {
      champSelect.addEventListener('change', () => {
        champBtn.disabled = !champSelect.value;
      });
      champBtn.addEventListener('click', async () => {
        if (!champSelect.value) return;
        champBtn.disabled = true;
        champBtn.textContent = 'Guardando...';
        try {
          const resultado = await guardarCampeon(sesion.usuario_id, champSelect.value);
          if (resultado.exito) {
            mostrarToast('Campeón guardado ✓', 'success');
            cargarPredicciones();
          } else {
            mostrarToast(resultado.error || 'No se pudo guardar.', 'error');
            champBtn.disabled = false;
            champBtn.textContent = 'Confirmar campeón';
          }
        } catch (e) {
          mostrarToast('Error de conexión.', 'error');
          champBtn.disabled = false;
          champBtn.textContent = 'Confirmar campeón';
        }
      });
    }

    // Eventos de "Editar" → llevan al usuario a la sección correspondiente
    contenedor.querySelectorAll('.pred-edit-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        irASeccion('calendario');
        // Activar el tab de la fase correspondiente si existe
        setTimeout(() => {
          const fase = btn.dataset.fase;
          const tab = document.querySelector(`.cal-tab[data-fase="${fase}"]`);
          if (tab) tab.click();
          const card = document.querySelector(`.match-card[data-partido-id="${btn.dataset.partidoId}"]`);
          if (card) {
            card.scrollIntoView({ behavior: 'smooth', block: 'center' });
            card.style.outline = '2px solid var(--mw-azul)';
            setTimeout(() => card.style.outline = '', 2000);
          }
        }, 200);
      });
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
// Sección "elige tu campeón" — se muestra arriba de todo.
// Si ya se eligió, se muestra bloqueada.
// ─────────────────────────────────────────────────────────────
function renderSeccionCampeon(miCampeon, especiales, sesion) {
  if (miCampeon && miCampeon.equipo_campeon) {
    const eq = obtenerEquipo(miCampeon.equipo_campeon);
    return `
      <div class="champ-card">
        <div class="champ-title">Tu campeón del Mundial</div>
        <div class="champ-desc">Esta predicción no se puede cambiar — vale 15 puntos si aciertas.</div>
        <div class="champ-locked">
          ${renderBandera(eq)}
          <div>
            <div class="champ-locked-text">${eq.es}</div>
            <div class="champ-locked-sub">Predicción bloqueada</div>
          </div>
        </div>
      </div>
    `;
  }

  // Construir opciones a partir de los equipos conocidos
  const opciones = Object.entries(EQUIPOS)
    .filter(([key]) => key !== 'Por definir' && key !== 'TBD')
    .map(([key, val]) => ({ key, ...val }))
    .sort((a, b) => a.es.localeCompare(b.es));

  let optionsHTML = '<option value="">Selecciona un equipo...</option>';
  opciones.forEach(o => {
    optionsHTML += `<option value="${o.key}">${o.flag} ${o.es}</option>`;
  });

  return `
    <div class="champ-card">
      <div class="champ-title">Elige tu campeón del Mundial</div>
      <div class="champ-desc">Solo puedes elegirlo una vez — vale 15 puntos si aciertas. Pase lo que pase, no se puede cambiar después.</div>
      <div class="champ-select-row">
        <select class="champ-select" id="champ-select">${optionsHTML}</select>
        <button class="save-btn" id="champ-confirm-btn" disabled>Confirmar campeón</button>
      </div>
    </div>
  `;
}

// ─────────────────────────────────────────────────────────────
// Renderiza el grupo de predicciones para un partido:
// encabezado con equipos + lista de predicciones de cada usuario
// ─────────────────────────────────────────────────────────────
function renderGrupoPredicciones(partido, predicciones, sesion) {
  const local = obtenerEquipo(partido.equipo_local);
  const visitante = obtenerEquipo(partido.equipo_visitante);
  const esElim = partido.es_eliminatoria;

  // Ordenar: tu predicción primero
  const ordenadas = [...predicciones].sort((a, b) => {
    if (a.usuario_id === sesion.usuario_id) return -1;
    if (b.usuario_id === sesion.usuario_id) return 1;
    return a.usuario_nombre.localeCompare(b.usuario_nombre);
  });

  let filasHTML = '';
  ordenadas.forEach(pred => {
    const esYo = pred.usuario_id === sesion.usuario_id;
    let penalesTxt = '';
    if (esElim && pred.penales_pred !== '' && pred.penales_pred !== undefined) {
      const si = pred.penales_pred === true || pred.penales_pred === 'TRUE';
      penalesTxt = `<span class="pred-pen">· Penales: ${si ? 'Sí' : 'No'}</span>`;
    }

    let editBtn = '';
    if (esYo && puedeEditar(partido.estado) && !pred.bloqueada) {
      editBtn = `<button class="pred-edit-btn" data-partido-id="${partido.partido_id}" data-fase="${partido.fase}">Editar</button>`;
    }

    filasHTML += `
      <div class="pred-row ${esYo ? 'you' : ''}">
        <div class="pred-avatar">${iniciales(pred.usuario_nombre)}</div>
        <div class="pred-name">${pred.usuario_nombre}${esYo ? ' (tú)' : ''}</div>
        <div class="pred-value">${pred.goles_local_pred} - ${pred.goles_visitante_pred}${penalesTxt}</div>
        ${editBtn}
      </div>
    `;
  });

  let metaTxt = `${partido.grupo ? partido.grupo + ' · ' : ''}${formatearFechaCorta(partido.fecha_hora_utc)}`;
  if (partido.estado === 'FINALIZADO') {
    const gl = esElim && partido.goles_local_120 !== '' ? partido.goles_local_120 : partido.goles_local;
    const gv = esElim && partido.goles_visitante_120 !== '' ? partido.goles_visitante_120 : partido.goles_visitante;
    metaTxt += ` · Resultado: ${gl}-${gv}`;
  }

  return `
    <div class="pred-group">
      <div class="pred-group-header">
        <div class="pred-group-teams">
          ${renderBandera(local)} ${local.es} vs ${visitante.es} ${renderBandera(visitante)}
        </div>
        <div class="pred-group-meta">${metaTxt}</div>
      </div>
      ${filasHTML}
    </div>
  `;
}
