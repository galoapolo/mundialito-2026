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
  ['sidebar-avatar', 'mobile-avatar', 'mobile-avatar-2', 'mobile-avatar-3', 'mobile-avatar-4'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.textContent = ini;
  });
  ['sidebar-username', 'mobile-username', 'mobile-username-2', 'mobile-username-3', 'mobile-username-4'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.textContent = sesion.nombre;
  });
}

// ─────────────────────────────────────────────────────────────
// BADGE DE ESTADO DE PARTIDO
// ─────────────────────────────────────────────────────────────
function badgeEstado(estado) {
  const mapa = {
    PENDIENTE: { clase: 'status-pendiente', texto: 'Próximamente' },
    ABIERTO:   { clase: 'status-abierto',   texto: 'Abierto' },
    CERRADO:   { clase: 'status-cerrado',   texto: 'Cerrado' },
    FINALIZADO:{ clase: 'status-finalizado', texto: 'Finalizado' }
  };
  // PENDIENTE se trata visualmente como "abierto para predecir"
  if (estado === 'PENDIENTE') {
    return { clase: 'status-abierto', texto: 'Abierto' };
  }
  return mapa[estado] || { clase: 'status-pendiente', texto: estado };
}

function puedeEditar(estado) {
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
  const local = obtenerEquipo(partido.equipo_local);
  const visitante = obtenerEquipo(partido.equipo_visitante);
  const estado = badgeEstado(partido.estado);
  const editable = puedeEditar(partido.estado);
  const esElim = partido.es_eliminatoria;
  const esFinalizado = partido.estado === 'FINALIZADO';

  const valorLocal = prediccion ? prediccion.goles_local_pred : '';
  const valorVisitante = prediccion ? prediccion.goles_visitante_pred : '';
  const valorPenales = prediccion ? prediccion.penales_pred : '';
  const bloqueada = prediccion ? prediccion.bloqueada === true : false;

  const inputsDisabled = !editable || bloqueada;

  // Resultado real (si el partido ya terminó)
  let golesLocalReal = '';
  let golesVisitanteReal = '';
  if (esFinalizado) {
    golesLocalReal = (esElim && partido.goles_local_120 !== '' && partido.goles_local_120 !== null) ? partido.goles_local_120 : partido.goles_local;
    golesVisitanteReal = (esElim && partido.goles_visitante_120 !== '' && partido.goles_visitante_120 !== null) ? partido.goles_visitante_120 : partido.goles_visitante;
  }

  let extraHTML = '';

  if (esFinalizado) {
    // Mostrar predicción del usuario vs resultado real + puntos obtenidos
    let textoPred = 'No registraste una predicción para este partido.';
    if (prediccion && prediccion.ganador_pred) {
      textoPred = `Tu predicción: <b>${valorLocal} - ${valorVisitante}</b>`;
      if (esElim && prediccion.penales_pred !== '' && prediccion.penales_pred !== undefined) {
        textoPred += ` · Penales: <b>${prediccion.penales_pred === true || prediccion.penales_pred === 'TRUE' ? 'Sí' : 'No'}</b>`;
      }
    }
    const ptsTotal = puntos ? puntos.pts_total : 0;
    const claseP = ptsTotal > 0 ? 'points-pill' : 'points-pill cero';
    extraHTML = `
      <div class="extra-row" style="justify-content: space-between;">
        <div class="your-pred" style="margin-top:0">${textoPred}</div>
        <span class="${claseP}">${ptsTotal} pts</span>
      </div>
    `;
  } else if (bloqueada) {
    extraHTML = `
      <div class="locked-banner">
        <i class="ti ti-lock" aria-hidden="true"></i>
        Esta predicción ya no se puede editar — el partido está por comenzar o ya empezó
      </div>
      ${prediccion && prediccion.ganador_pred ? `<div class="your-pred">Tu predicción: <b>${valorLocal} - ${valorVisitante}</b></div>` : ''}
    `;
  } else if (editable) {
    let penalesHTML = '';
    if (esElim) {
      const siSel = valorPenales === true || valorPenales === 'TRUE' ? 'selected' : '';
      const noSel = valorPenales === false || valorPenales === 'FALSE' || valorPenales === '' ? 'selected' : '';
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
      <div class="extra-row" style="${esElim ? 'flex-direction:column; align-items:stretch; gap:10px;' : ''}">
        ${penalesHTML}
        <div style="display:flex; ${esElim ? '' : 'margin-left:auto;'}">
          <button class="save-btn" data-action="guardar">Guardar predicción</button>
        </div>
      </div>
    `;
  }

  // ── Centro de la tarjeta: inputs editables, o resultado real grande ──
  let centroHTML;
  if (esFinalizado) {
    centroHTML = `
      <div class="score-result">
        <span class="score-result-num">${golesLocalReal}</span>
        <span class="vs-label">—</span>
        <span class="score-result-num">${golesVisitanteReal}</span>
      </div>
    `;
  } else {
    centroHTML = `
      <div class="score-inputs">
        <input class="score-input" type="number" inputmode="numeric" min="0" max="20" data-side="local"
          value="${valorLocal}" placeholder="–" ${inputsDisabled ? 'disabled' : ''}>
        <span class="vs-label">—</span>
        <input class="score-input" type="number" inputmode="numeric" min="0" max="20" data-side="visitante"
          value="${valorVisitante}" placeholder="–" ${inputsDisabled ? 'disabled' : ''}>
      </div>
    `;
  }

  return `
    <div class="match-card" data-partido-id="${partido.partido_id}" data-es-elim="${esElim}" data-equipo-local="${partido.equipo_local}" data-equipo-visitante="${partido.equipo_visitante}">
      <div class="match-top">
        <span class="match-meta">${partido.grupo ? partido.grupo + ' · ' : ''}${formatearHoraLocal(partido.fecha_hora_utc)}</span>
        <span class="match-status ${estado.clase}">${estado.texto}</span>
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
