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

        /* Grupos de predicciones */
        .pred-group { background: var(--mw-card-bg); border: 1px solid var(--mw-border); border-radius: var(--mw-radius-lg); padding: 14px 16px; margin-bottom: 10px; }
        .pred-group.finalizado { border-left: 3px solid var(--mw-azul); }
        .pred-group-header { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 10px; gap: 8px; flex-wrap: wrap; }
        .pred-group-teams { font-size: 14px; font-weight: 700; color: var(--mw-text); display: flex; align-items: center; gap: 6px; }
        .pred-group-teams img.flag { width: 22px; height: 16px; object-fit: cover; border-radius: 3px; }
        .pred-group-meta-row { display: flex; flex-direction: column; align-items: flex-end; gap: 4px; }
        .pred-group-meta { font-size: 12px; color: var(--mw-text-sec); font-weight: 600; }
        .pred-resultado-real { font-size: 18px; font-weight: 800; color: var(--mw-text); letter-spacing: 1px; }

        /* Filas de predicciones */
        .pred-row { display: flex; align-items: flex-start; gap: 10px; padding: 8px 0; border-top: 1px solid var(--mw-border-soft); }
        .pred-row:first-of-type { border-top: none; }
        .pred-row.you { background: var(--mw-azul-suave); margin: 0 -16px; padding: 8px 16px; border-radius: var(--mw-radius-sm); border-top: none; }
        .pred-avatar { width: 28px; height: 28px; border-radius: 50%; background: var(--mw-verde); color: #FFFFFF; display: flex; align-items: center; justify-content: center; font-size: 11px; font-weight: 700; flex-shrink: 0; margin-top: 2px; }
        .pred-row.you .pred-avatar { background: var(--mw-azul); }
        .pred-main { flex: 1; min-width: 0; }
        .pred-top-row { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
        .pred-name { font-size: 13px; font-weight: 700; color: var(--mw-text); flex: 1; }
        .pred-value { font-size: 13px; font-weight: 700; color: var(--mw-text); white-space: nowrap; }
        .pred-pen { font-size: 11px; font-weight: 600; color: var(--mw-text-sec); }
        .pred-edit-btn { font-size: 12px; font-weight: 700; color: var(--mw-azul); background: none; border: none; cursor: pointer; padding: 2px 8px; }

        /* Badges de resultado */
        .pred-badges { display: flex; gap: 5px; flex-wrap: wrap; margin-top: 5px; align-items: center; }
        .res-badge { font-size: 11px; font-weight: 700; padding: 2px 8px; border-radius: 10px; white-space: nowrap; }
        .res-exact { background: var(--mw-dorado-suave); color: var(--mw-dorado-texto); }
        .res-win   { background: var(--mw-verde-suave); color: var(--mw-verde-texto); }
        .res-diff  { background: var(--mw-turquesa-suave); color: var(--mw-turquesa-texto); }
        .res-pen   { background: var(--mw-morado-suave); color: var(--mw-morado-texto); }
        .res-fail  { background: var(--mw-rojo-suave); color: var(--mw-rojo-texto); }
        .res-fail-soft { background: var(--mw-bg); color: var(--mw-text-ter); border: 1px solid var(--mw-border); }
        .pred-pts-badge { font-size: 12px; font-weight: 800; padding: 2px 10px; border-radius: 10px; margin-left: auto; white-space: nowrap; }
        .pred-pts-badge.pts-ok   { background: var(--mw-azul); color: #FFFFFF; }
        .pred-pts-badge.pts-zero { background: var(--mw-bg); color: var(--mw-text-ter); border: 1px solid var(--mw-border); }
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
// Calcula el resultado de una predicción vs un partido
// finalizado — devuelve objeto con qué acertó y cuántos pts
// ─────────────────────────────────────────────────────────────
function calcularResultadoPrediccion(pred, partido) {
  const esElim = partido.es_eliminatoria;
  const esFinal = partido.fase === 'FINAL';

  // Resultado real
  const golesLocalReal = (esElim && partido.goles_local_120 !== '' && partido.goles_local_120 !== null)
    ? parseInt(partido.goles_local_120) : parseInt(partido.goles_local);
  const golesVisitanteReal = (esElim && partido.goles_visitante_120 !== '' && partido.goles_visitante_120 !== null)
    ? parseInt(partido.goles_visitante_120) : parseInt(partido.goles_visitante);

  // Ganador real
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

  const acertoGanador    = pred.ganador_pred === ganadorReal;
  const acertoMarcador   = acertoGanador && golesLocalPred === golesLocalReal && golesVisitantePred === golesVisitanteReal;
  const acertoDiferencia = acertoGanador && !acertoMarcador &&
    (golesLocalPred - golesVisitantePred) === (golesLocalReal - golesVisitanteReal);
  const huboPenalesReal = partido.hubo_penales === true || partido.hubo_penales === 'TRUE';
  const predijoPenales  = pred.penales_pred === true || pred.penales_pred === 'TRUE' || pred.penales_pred === 'true';
  const acertoPenales   = esElim && predijoPenales === huboPenalesReal;

  const mult = esFinal ? 2 : 1;
  let pts = 0;
  if (acertoMarcador)        pts = 5 * mult;
  else if (acertoGanador)    pts = (3 + (acertoDiferencia ? 1 : 0)) * mult;
  if (esElim && acertoPenales) pts += 2 * mult;

  return { acertoGanador, acertoMarcador, acertoDiferencia, acertoPenales, esElim, pts };
}

// ─────────────────────────────────────────────────────────────
// Renderiza los badges de resultado para una predicción
// ─────────────────────────────────────────────────────────────
function renderBadgesResultado(r) {
  if (!r.acertoGanador) {
    return `<span class="res-badge res-fail">✗ Falló</span>`;
  }
  let badges = '';
  if (r.acertoMarcador) {
    badges += `<span class="res-badge res-exact">⭐ Marcador exacto</span>`;
  } else {
    badges += `<span class="res-badge res-win">✓ Ganador</span>`;
    if (r.acertoDiferencia) badges += `<span class="res-badge res-diff">+1 Diferencia</span>`;
  }
  if (r.esElim) {
    badges += r.acertoPenales
      ? `<span class="res-badge res-pen">✓ Penales</span>`
      : `<span class="res-badge res-fail-soft">✗ Penales</span>`;
  }
  return badges;
}

// ─────────────────────────────────────────────────────────────
// Renderiza el grupo de predicciones para un partido:
// encabezado con equipos + lista de predicciones de cada usuario
// + indicadores de acierto si el partido ya terminó
// ─────────────────────────────────────────────────────────────
function renderGrupoPredicciones(partido, predicciones, sesion) {
  const local    = obtenerEquipo(partido.equipo_local);
  const visitante = obtenerEquipo(partido.equipo_visitante);
  const esElim   = partido.es_eliminatoria;
  const finalizado = partido.estado === 'FINALIZADO';

  // Resultado real para el header
  let resultadoReal = '';
  if (finalizado) {
    const gl = (esElim && partido.goles_local_120 !== '' && partido.goles_local_120 !== null)
      ? partido.goles_local_120 : partido.goles_local;
    const gv = (esElim && partido.goles_visitante_120 !== '' && partido.goles_visitante_120 !== null)
      ? partido.goles_visitante_120 : partido.goles_visitante;
    resultadoReal = `<span class="pred-resultado-real">${gl} — ${gv}</span>`;
  }

  // Ordenar: tu predicción primero
  const ordenadas = [...predicciones].sort((a, b) => {
    if (a.usuario_id === sesion.usuario_id) return -1;
    if (b.usuario_id === sesion.usuario_id) return 1;
    return a.usuario_nombre.localeCompare(b.usuario_nombre);
  });

  let filasHTML = '';
  ordenadas.forEach(pred => {
    const esYo = pred.usuario_id === sesion.usuario_id;

    // Marcador predicho
    const marcadorPred = (pred.goles_local_pred !== '' && pred.goles_local_pred !== null && pred.goles_local_pred !== undefined)
      ? `${pred.goles_local_pred} - ${pred.goles_visitante_pred}`
      : '—';

    // Penales predichos (solo eliminatorias)
    let penalesTxt = '';
    if (esElim && pred.penales_pred !== '' && pred.penales_pred !== undefined) {
      const si = pred.penales_pred === true || pred.penales_pred === 'TRUE';
      penalesTxt = `<span class="pred-pen">Penales: ${si ? 'Sí' : 'No'}</span>`;
    }

    // Indicadores de resultado (solo si el partido finalizó)
    let indicadoresHTML = '';
    if (finalizado && pred.ganador_pred) {
      const r = calcularResultadoPrediccion(pred, partido);
      indicadoresHTML = `
        <div class="pred-badges">
          ${renderBadgesResultado(r)}
          <span class="pred-pts-badge ${r.pts > 0 ? 'pts-ok' : 'pts-zero'}">${r.pts} pts</span>
        </div>
      `;
    } else if (finalizado && !pred.ganador_pred) {
      indicadoresHTML = `<div class="pred-badges"><span class="res-badge res-fail">Sin predicción</span></div>`;
    }

    // Botón editar (solo si el partido no está cerrado y es el usuario actual)
    let editBtn = '';
    if (esYo && puedeEditar(partido.estado) && !pred.bloqueada) {
      editBtn = `<button class="pred-edit-btn" data-partido-id="${partido.partido_id}" data-fase="${partido.fase}">Editar</button>`;
    }

    filasHTML += `
      <div class="pred-row ${esYo ? 'you' : ''} ${finalizado ? 'finalizado' : ''}">
        <div class="pred-avatar">${iniciales(pred.usuario_nombre)}</div>
        <div class="pred-main">
          <div class="pred-top-row">
            <div class="pred-name">${pred.usuario_nombre}${esYo ? ' (tú)' : ''}</div>
            <div class="pred-value">${marcadorPred} ${penalesTxt}</div>
            ${editBtn}
          </div>
          ${indicadoresHTML}
        </div>
      </div>
    `;
  });

  let metaTxt = `${partido.grupo ? partido.grupo + ' · ' : ''}${formatearFechaCorta(partido.fecha_hora_utc)}`;

  return `
    <div class="pred-group ${finalizado ? 'finalizado' : ''}">
      <div class="pred-group-header">
        <div class="pred-group-teams">
          ${renderBandera(local)} ${local.es} vs ${visitante.es} ${renderBandera(visitante)}
        </div>
        <div class="pred-group-meta-row">
          <span class="pred-group-meta">${metaTxt}</span>
          ${resultadoReal}
        </div>
      </div>
      ${filasHTML}
    </div>
  `;
}
