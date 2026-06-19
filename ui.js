// ============================================================
// ui.js — Mundialito 2026
// Funciones compartidas de interfaz: toast, navegación,
// render de tarjetas de partido (reutilizado en varias pantallas)
// ============================================================

// ─────────────────────────────────────────────────────────────
// TOAST
// ─────────────────────────────────────────────────────────────
let toastTimeout = null;
function mostrarToast(mensaje, tipo = 'normal') {
  const toast = document.getElementById('toast');
  toast.textContent = mensaje;
  toast.className = 'toast visible';
  if (tipo === 'error') toast.classList.add('error');
  if (tipo === 'success') toast.classList.add('success');

  if (toastTimeout) clearTimeout(toastTimeout);
  toastTimeout = setTimeout(() => {
    toast.classList.remove('visible');
  }, 3000);
}

// ─────────────────────────────────────────────────────────────
// NAVEGACIÓN ENTRE SECCIONES
// ─────────────────────────────────────────────────────────────
function irASeccion(nombreSeccion) {
  // Ocultar todas las secciones
  document.querySelectorAll('.section').forEach(sec => sec.classList.remove('active'));
  document.getElementById('section-' + nombreSeccion).classList.add('active');

  // Actualizar estado activo en navegación (sidebar + bottom nav)
  document.querySelectorAll('.nav-item, .bottom-nav-item').forEach(item => {
    if (item.dataset.section === nombreSeccion) {
      item.classList.add('active');
    } else {
      item.classList.remove('active');
    }
  });

  // Disparar carga de datos de la sección si aplica
  if (nombreSeccion === 'partidos' && typeof cargarPartidosHoy === 'function') cargarPartidosHoy();
  if (nombreSeccion === 'calendario' && typeof cargarCalendario === 'function') cargarCalendario();
  if (nombreSeccion === 'tabla' && typeof cargarTabla === 'function') cargarTabla();
  if (nombreSeccion === 'predicciones' && typeof cargarPredicciones === 'function') cargarPredicciones();
  if (nombreSeccion === 'invitar'      && typeof cargarInvitar === 'function')      cargarInvitar();
}

function inicializarNavegacion() {
  document.querySelectorAll('.nav-item, .bottom-nav-item').forEach(item => {
    item.addEventListener('click', (e) => {
      e.preventDefault();
      irASeccion(item.dataset.section);
    });
  });
}

// ─────────────────────────────────────────────────────────────
// AVATAR — iniciales del usuario
// ─────────────────────────────────────────────────────────────
function iniciales(nombre) {
  if (!nombre) return '?';
  const partes = nombre.trim().split(/\s+/);
  if (partes.length === 1) return partes[0].substring(0, 2).toUpperCase();
  return (partes[0][0] + partes[1][0]).toUpperCase();
}

function actualizarInfoUsuario(sesion) {
  const ini = iniciales(sesion.nombre);
  ['sidebar-avatar', 'mobile-avatar', 'mobile-avatar-2', 'mobile-avatar-3', 'mobile-avatar-4', 'mobile-avatar-5'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.textContent = ini;
  });
  ['sidebar-username', 'mobile-username', 'mobile-username-2', 'mobile-username-3', 'mobile-username-4', 'mobile-username-5'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.textContent = sesion.nombre;
  });
}

// ─────────────────────────────────────────────────────────────
// BADGE DE ESTADO DE PARTIDO
// ─────────────────────────────────────────────────────────────
function badgeEstado(estado, fechaUTC) {
  // Verificar tiempo real independientemente del estado en el Sheet
  // Si faltan menos de 10 min o ya empezó → cerrado
  if (fechaUTC && (estado === 'PENDIENTE' || estado === 'ABIERTO')) {
    const minutosRestantes = (new Date(fechaUTC) - new Date()) / 60000;
    if (minutosRestantes <= 10) {
      return { clase: 'status-cerrado', texto: 'Cerrado' };
    }
  }
  const mapa = {
    PENDIENTE: { clase: 'status-abierto',   texto: 'Abierto' },
    ABIERTO:   { clase: 'status-abierto',   texto: 'Abierto' },
    CERRADO:   { clase: 'status-cerrado',   texto: 'Cerrado' },
    FINALIZADO:{ clase: 'status-finalizado', texto: 'Finalizado' }
  };
  return mapa[estado] || { clase: 'status-pendiente', texto: estado };
}

function puedeEditar(estado, fechaUTC) {
  if (estado === 'CERRADO' || estado === 'FINALIZADO') return false;
  // Validar tiempo real — cerrar 10 min antes del kickoff
  if (fechaUTC) {
    const minutosRestantes = (new Date(fechaUTC) - new Date()) / 60000;
    if (minutosRestantes <= 10) return false;
  }
  return estado === 'PENDIENTE' || estado === 'ABIERTO';
}

// ─────────────────────────────────────────────────────────────
// RENDER DE UNA TARJETA DE PARTIDO
// Usado tanto en "Partidos de hoy" como en "Calendario"
//
// partido: objeto de la hoja `partidos`
// prediccion: objeto de predicciones del usuario actual (o null)
// puntos: objeto con desglose de puntos si el partido ya finalizó (o null)
// ─────────────────────────────────────────────────────────────
function renderTarjetaPartido(partido, prediccion, puntos) {
  const local     = obtenerEquipo(partido.equipo_local);
  const visitante = obtenerEquipo(partido.equipo_visitante);
  const esElim    = partido.es_eliminatoria;

  // ── Determinar estado real usando tiempo del dispositivo ──────
  const ahora            = new Date();
  const inicio           = partido.fecha_hora_utc ? new Date(partido.fecha_hora_utc) : null;
  const minutosDesdeInicio = inicio ? (ahora - inicio) / 60000 : -999;
  const minutosRestantes   = inicio ? (inicio - ahora) / 60000 : 999;

  // Estado efectivo (más preciso que el del Sheet, que se actualiza cada 15 min)
  let estadoEfectivo = partido.estado;
  if (minutosRestantes <= 10 && estadoEfectivo === 'PENDIENTE') estadoEfectivo = 'CERRADO';
  if (minutosRestantes <= 10 && estadoEfectivo === 'ABIERTO')   estadoEfectivo = 'CERRADO';

  const esFinalizado  = estadoEfectivo === 'FINALIZADO';
  const estaEnCurso   = estadoEfectivo === 'CERRADO' && minutosDesdeInicio > 10;
  const editable      = puedeEditar(partido.estado, partido.fecha_hora_utc);
  const badgeInfo     = badgeEstado(partido.estado, partido.fecha_hora_utc);

  // Badge especial si el partido está en curso (Sheet aún no lo marca FINALIZADO)
  let badgeMostrar = badgeInfo;
  if (estaEnCurso && !esFinalizado) {
    // Estimar si ya terminó según duración máxima
    const maxMin = esElim ? 185 : 110;
    if (minutosDesdeInicio > maxMin) {
      badgeMostrar = { clase: 'status-finalizado', texto: 'Posiblemente finalizado' };
    } else {
      badgeMostrar = { clase: 'status-en-curso', texto: '⚡ En curso' };
    }
  }

  const valorLocal      = prediccion ? prediccion.goles_local_pred     : '';
  const valorVisitante  = prediccion ? prediccion.goles_visitante_pred  : '';
  const valorPenales    = prediccion ? prediccion.penales_pred           : '';
  const bloqueada       = prediccion ? prediccion.bloqueada === true     : false;

  // ── Marcador real ──────────────────────────────────────────────
  // Mostrar siempre que haya datos, incluso si el partido está en curso
  const tieneGolesSheet = partido.goles_local !== '' && partido.goles_local !== null &&
                          partido.goles_local !== undefined;

  let golesLocalReal     = '';
  let golesVisitanteReal = '';
  if (tieneGolesSheet) {
    golesLocalReal     = (esElim && partido.goles_local_120 !== '' && partido.goles_local_120 !== null)
      ? partido.goles_local_120 : partido.goles_local;
    golesVisitanteReal = (esElim && partido.goles_visitante_120 !== '' && partido.goles_visitante_120 !== null)
      ? partido.goles_visitante_120 : partido.goles_visitante;
  }

  const mostrarMarcadorReal = tieneGolesSheet || esFinalizado;

  // ── Centro de la tarjeta ───────────────────────────────────────
  let centroHTML;
  if (mostrarMarcadorReal) {
    // Marcador real — grande y centrado
    const gl = golesLocalReal !== '' ? golesLocalReal : '?';
    const gv = golesVisitanteReal !== '' ? golesVisitanteReal : '?';
    centroHTML = `
      <div class="score-result ${estaEnCurso && !esFinalizado ? 'en-curso' : ''}">
        <span class="score-result-num">${gl}</span>
        <span class="vs-label">—</span>
        <span class="score-result-num">${gv}</span>
      </div>
    `;
  } else if (editable && !bloqueada) {
    // Inputs de predicción editables
    centroHTML = `
      <div class="score-inputs">
        <input class="score-input" type="number" inputmode="numeric" min="0" max="20" data-side="local"
          value="${valorLocal}" placeholder="–">
        <span class="vs-label">—</span>
        <input class="score-input" type="number" inputmode="numeric" min="0" max="20" data-side="visitante"
          value="${valorVisitante}" placeholder="–">
      </div>
    `;
  } else {
    // Partido por empezar pero cerrado, o bloqueado — mostrar predicción del usuario o guiones
    const glMostrar = valorLocal !== '' && valorLocal !== null && valorLocal !== undefined ? valorLocal : '–';
    const gvMostrar = valorVisitante !== '' && valorVisitante !== null && valorVisitante !== undefined ? valorVisitante : '–';
    centroHTML = `
      <div class="score-inputs">
        <input class="score-input" type="number" disabled value="${glMostrar !== '–' ? glMostrar : ''}" placeholder="–">
        <span class="vs-label">—</span>
        <input class="score-input" type="number" disabled value="${gvMostrar !== '–' ? gvMostrar : ''}" placeholder="–">
      </div>
    `;
  }

  // ── Fila extra debajo de los equipos ──────────────────────────
  let extraHTML = '';

  if (esFinalizado) {
    let textoPred = 'No registraste una predicción para este partido.';
    if (prediccion && prediccion.ganador_pred) {
      textoPred = `Tu predicción: <b>${valorLocal} - ${valorVisitante}</b>`;
      if (esElim && prediccion.penales_pred !== '' && prediccion.penales_pred !== undefined) {
        textoPred += ` · Penales: <b>${prediccion.penales_pred === true || prediccion.penales_pred === 'TRUE' ? 'Sí' : 'No'}</b>`;
      }
    }
    const ptsTotal = puntos ? puntos.pts_total : 0;
    const claseP   = ptsTotal > 0 ? 'points-pill' : 'points-pill cero';
    extraHTML = `
      <div class="extra-row" style="justify-content:space-between;">
        <div class="your-pred" style="margin-top:0">${textoPred}</div>
        <span class="${claseP}">${ptsTotal} pts</span>
      </div>
    `;
  } else if (estaEnCurso) {
    // Partido en curso — mostrar predicción del usuario si la tiene
    if (prediccion && prediccion.ganador_pred) {
      extraHTML = `
        <div class="locked-banner" style="background:var(--mw-azul-suave);color:var(--mw-azul-texto);">
          <i class="ti ti-player-play" aria-hidden="true"></i>
          Partido en curso — Tu predicción: <b>${valorLocal} - ${valorVisitante}</b>
        </div>
      `;
    } else {
      extraHTML = `
        <div class="locked-banner" style="background:var(--mw-azul-suave);color:var(--mw-azul-texto);">
          <i class="ti ti-player-play" aria-hidden="true"></i>
          Partido en curso — no tenías predicción para este partido
        </div>
      `;
    }
  } else if (!editable || bloqueada) {
    extraHTML = `
      <div class="locked-banner">
        <i class="ti ti-lock" aria-hidden="true"></i>
        Predicciones cerradas — el partido empieza pronto
      </div>
      ${prediccion && prediccion.ganador_pred ? `<div class="your-pred">Tu predicción: <b>${valorLocal} - ${valorVisitante}</b></div>` : ''}
    `;
  } else if (editable) {
    let penalesHTML = '';
    if (esElim) {
      const siSel = valorPenales === true || valorPenales === 'TRUE' ? 'selected' : '';
      const noSel = (!siSel) ? 'selected' : '';
      penalesHTML = `
        <div class="toggle-group">
          <span>¿Habrá penales?</span>
          <div class="toggle-btns" data-penales-group>
            <button class="toggle-btn ${siSel}" data-penales="true" type="button">Sí</button>
            <button class="toggle-btn ${noSel}" data-penales="false" type="button">No</button>
          </div>
        </div>
      `;
    }
    extraHTML = `
      <div class="extra-row" style="${esElim ? 'flex-direction:column;align-items:stretch;gap:10px;' : ''}">
        ${penalesHTML}
        <div style="display:flex;${esElim ? '' : 'margin-left:auto;'}">
          <button class="save-btn" data-action="guardar">Guardar predicción</button>
        </div>
      </div>
    `;
  }

  return `
    <div class="match-card" data-partido-id="${partido.partido_id}" data-es-elim="${esElim}" data-equipo-local="${partido.equipo_local}" data-equipo-visitante="${partido.equipo_visitante}">
      <div class="match-top">
        <span class="match-meta">${partido.grupo ? partido.grupo + ' · ' : ''}${formatearHoraLocal(partido.fecha_hora_utc)}</span>
        <span class="match-status ${badgeMostrar.clase}">${badgeMostrar.texto}</span>
      </div>
      <div class="teams-row">
        <div class="team">
          ${renderBandera(local)}
          <span class="name">${local.es}</span>
        </div>
        ${centroHTML}
        <div class="team right">
          <span class="name">${visitante.es}</span>
          ${renderBandera(visitante)}
        </div>
      </div>
      ${extraHTML}
    </div>
  `;
}

// ─────────────────────────────────────────────────────────────
// Renderiza la bandera de un equipo como imagen (flagcdn.com).
// Si no hay flagUrl (equipo "Por definir" o EMPATE), muestra
// un placeholder con el emoji/texto disponible.
// ─────────────────────────────────────────────────────────────
function renderBandera(equipo) {
  if (equipo.flagUrl) {
    return `<img class="flag" src="${equipo.flagUrl}" alt="" loading="lazy">`;
  }
  if (equipo.flag) {
    return `<span class="flag flag-emoji" aria-hidden="true">${equipo.flag}</span>`;
  }
  return '';
}

// ─────────────────────────────────────────────────────────────
// ATTACH: conecta los eventos de una tarjeta recién renderizada
// (toggles de penales y botón guardar)
// ─────────────────────────────────────────────────────────────
function attachEventosTarjeta(cardEl, sesion, onGuardado) {
  // Toggle de penales
  const penalesBtns = cardEl.querySelectorAll('[data-penales]');
  penalesBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      penalesBtns.forEach(b => b.classList.remove('selected'));
      btn.classList.add('selected');
    });
  });

  // Botón guardar
  const saveBtn = cardEl.querySelector('[data-action="guardar"]');
  if (!saveBtn) return;

  saveBtn.addEventListener('click', async () => {
    const partidoId = cardEl.dataset.partidoId;
    const esElim = cardEl.dataset.esElim === 'true';

    const inputLocal = cardEl.querySelector('[data-side="local"]');
    const inputVisitante = cardEl.querySelector('[data-side="visitante"]');

    const golesLocal = inputLocal.value;
    const golesVisitante = inputVisitante.value;

    if (golesLocal === '' || golesVisitante === '') {
      mostrarToast('Ingresa el marcador completo antes de guardar.', 'error');
      return;
    }

    // Determinar ganador
    const local = parseInt(golesLocal);
    const visitante = parseInt(golesVisitante);
    let ganadorPred;

    // Necesitamos los nombres originales (en inglés) para guardar — los recuperamos del dataset
    const nombreLocalAPI = cardEl.dataset.equipoLocal;
    const nombreVisitanteAPI = cardEl.dataset.equipoVisitante;

    if (local > visitante) ganadorPred = nombreLocalAPI;
    else if (visitante > local) ganadorPred = nombreVisitanteAPI;
    else ganadorPred = 'EMPATE';

    let penalesPred;
    if (esElim) {
      const selected = cardEl.querySelector('[data-penales].selected');
      if (!selected) {
        mostrarToast('Indica si habrá penales o no.', 'error');
        return;
      }
      penalesPred = selected.dataset.penales === 'true';
    }

    saveBtn.disabled = true;
    saveBtn.textContent = 'Guardando...';

    try {
      const resultado = await guardarPrediccion({
        usuario_id: sesion.usuario_id,
        partido_id: partidoId,
        ganador_pred: ganadorPred,
        goles_local_pred: local,
        goles_visitante_pred: visitante,
        penales_pred: esElim ? penalesPred : undefined
      });

      if (resultado.exito) {
        mostrarToast('Predicción guardada ✓', 'success');
        saveBtn.textContent = 'Guardado ✓';
        saveBtn.classList.add('saved');
        setTimeout(() => {
          saveBtn.disabled = false;
          saveBtn.textContent = 'Guardar predicción';
          saveBtn.classList.remove('saved');
        }, 2000);
        if (onGuardado) onGuardado();
      } else {
        mostrarToast(resultado.error || 'No se pudo guardar.', 'error');
        saveBtn.disabled = false;
        saveBtn.textContent = 'Guardar predicción';
      }
    } catch (e) {
      mostrarToast('Error de conexión. Intenta de nuevo.', 'error');
      saveBtn.disabled = false;
      saveBtn.textContent = 'Guardar predicción';
    }
  });
}
