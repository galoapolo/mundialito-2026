// ============================================================
// invitar.js — Mundialito 2026
// Pantalla "Invitar amigos" — genera link, instrucciones claras
// y código QR para compartir la app fácilmente
// ============================================================

var APP_URL = 'https://github.com/galoapolo/mundialito-2026/';
// ↑ Reemplaza TUNOMBREUSUARIO con tu usuario de GitHub

function cargarInvitar() {
  var contenedor = document.getElementById('invitar-contenido');
  var url = APP_URL;

  contenedor.innerHTML = `
    <style>
      .inv-card { background: var(--mw-card-bg); border: 1px solid var(--mw-border); border-radius: var(--mw-radius-lg); padding: 1.25rem 1.5rem; margin-bottom: 1rem; }
      .inv-section-title { font-size: 13px; font-weight: 700; color: var(--mw-text-sec); text-transform: uppercase; letter-spacing: .06em; margin-bottom: .75rem; }
      .inv-url-box { display: flex; gap: 8px; align-items: center; flex-wrap: wrap; }
      .inv-url { flex: 1; min-width: 0; font-size: 13px; font-family: var(--font-mono, monospace); background: var(--mw-bg); border: 1.5px solid var(--mw-border); border-radius: var(--mw-radius-md); padding: 10px 14px; color: var(--mw-text); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
      .inv-copy-btn { padding: 10px 18px; border-radius: var(--mw-radius-md); background: var(--mw-azul); color: #FFF; font-size: 13px; font-weight: 700; border: none; cursor: pointer; white-space: nowrap; transition: opacity .15s; }
      .inv-copy-btn:active { opacity: .8; }
      .inv-copy-btn.copied { background: var(--mw-verde); }
      .inv-share-btns { display: flex; gap: 8px; flex-wrap: wrap; margin-top: .75rem; }
      .inv-share-btn { display: flex; align-items: center; gap: 7px; padding: 10px 16px; border-radius: var(--mw-radius-md); font-size: 13px; font-weight: 700; border: 1.5px solid var(--mw-border); background: var(--mw-card-bg); color: var(--mw-text); cursor: pointer; text-decoration: none; transition: background .15s; }
      .inv-share-btn:hover { background: var(--mw-bg); }
      .inv-share-btn.wa { border-color: #25D366; color: #25D366; }
      .inv-share-btn.wa:hover { background: #F0FDF4; }
      .inv-share-btn.native { background: var(--mw-morado); color: #FFF; border-color: var(--mw-morado); }

      .inv-qr-wrap { display: flex; justify-content: center; margin: .5rem 0; }
      .inv-qr-wrap canvas { border-radius: var(--mw-radius-md); }

      .inv-steps { display: flex; flex-direction: column; gap: 12px; }
      .inv-step { display: flex; align-items: flex-start; gap: 12px; }
      .inv-step-num { width: 28px; height: 28px; border-radius: 50%; background: var(--mw-azul); color: #FFF; font-size: 13px; font-weight: 800; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
      .inv-step-body { flex: 1; }
      .inv-step-title { font-size: 14px; font-weight: 700; color: var(--mw-text); margin-bottom: 2px; }
      .inv-step-desc { font-size: 13px; color: var(--mw-text-sec); line-height: 1.5; }
      .inv-step-desc b { color: var(--mw-text); }

      .inv-rules-grid { display: grid; grid-template-columns: auto 1fr; gap: 6px 14px; font-size: 13px; }
      .inv-rules-pts { font-weight: 800; color: var(--mw-azul); text-align: right; }
      .inv-rules-desc { color: var(--mw-text-sec); }

      .inv-tip { display: flex; gap: 10px; align-items: flex-start; padding: 10px 14px; background: var(--mw-dorado-suave); border-radius: var(--mw-radius-md); margin-top: .5rem; }
      .inv-tip-icon { font-size: 18px; flex-shrink: 0; }
      .inv-tip-text { font-size: 12px; color: var(--mw-dorado-texto); font-weight: 600; line-height: 1.5; }
    </style>

    <!-- Link para compartir -->
    <div class="inv-card">
      <div class="inv-section-title">🔗 Link de la app</div>
      <div class="inv-url-box">
        <div class="inv-url" id="inv-url-text">${url}</div>
        <button class="inv-copy-btn" id="inv-copy-btn">📋 Copiar</button>
      </div>
      <div class="inv-share-btns">
        <a class="inv-share-btn wa" id="inv-wa-btn" href="#" target="_blank">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="#25D366"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
          WhatsApp
        </a>
        <button class="inv-share-btn native" id="inv-native-btn">
          <i class="ti ti-share" style="font-size:16px" aria-hidden="true"></i>
          Compartir
        </button>
      </div>
    </div>

    <!-- QR -->
    <div class="inv-card">
      <div class="inv-section-title">📱 Código QR</div>
      <div class="inv-qr-wrap">
        <canvas id="inv-qr-canvas" width="180" height="180"></canvas>
      </div>
      <div style="text-align:center; font-size:12px; color:var(--mw-text-sec); margin-top:.5rem;">
        Escanea con la cámara del celular para abrir la app
      </div>
    </div>

    <!-- Instrucciones paso a paso -->
    <div class="inv-card">
      <div class="inv-section-title">📋 Cómo unirse</div>
      <div class="inv-steps">
        <div class="inv-step">
          <div class="inv-step-num">1</div>
          <div class="inv-step-body">
            <div class="inv-step-title">Abre el link</div>
            <div class="inv-step-desc">Abre el link en <b>Chrome</b> (Android) o <b>Safari</b> (iPhone). Funciona en cualquier celular o computadora.</div>
          </div>
        </div>
        <div class="inv-step">
          <div class="inv-step-num">2</div>
          <div class="inv-step-body">
            <div class="inv-step-title">Elige tu apodo y año de nacimiento</div>
            <div class="inv-step-desc">Escribe el apodo con el que quieres aparecer en la tabla (ej: <b>"Tío Carlos"</b>) y tu año de nacimiento como contraseña (ej: <b>1985</b>).</div>
          </div>
        </div>
        <div class="inv-step">
          <div class="inv-step-num">3</div>
          <div class="inv-step-body">
            <div class="inv-step-title">Instala la app (opcional pero recomendado)</div>
            <div class="inv-step-desc">En <b>Android</b>: toca el banner "Añadir a pantalla de inicio" que aparece automáticamente.<br>En <b>iPhone</b>: toca el ícono de compartir (⬆) → "Añadir a pantalla de inicio".<br>Así recibirás notificaciones antes de cada partido.</div>
          </div>
        </div>
        <div class="inv-step">
          <div class="inv-step-num">4</div>
          <div class="inv-step-body">
            <div class="inv-step-title">¡Empieza a predecir!</div>
            <div class="inv-step-desc">Ve a <b>Partidos</b> para el partido de hoy, o a <b>Calendario</b> para predecir partidos futuros. No olvides elegir tu campeón en <b>Predicciones</b>.</div>
          </div>
        </div>
      </div>

      <div class="inv-tip">
        <span class="inv-tip-icon">💡</span>
        <div class="inv-tip-text">Las predicciones se cierran automáticamente 10 minutos antes de que empiece cada partido. ¡No te quedes sin predecir!</div>
      </div>
    </div>

    <!-- Resumen de puntos -->
    <div class="inv-card">
      <div class="inv-section-title">🏆 Sistema de puntos</div>
      <div class="inv-rules-grid">
        <span class="inv-rules-pts">3 pts</span><span class="inv-rules-desc">Ganador o empate correcto</span>
        <span class="inv-rules-pts">5 pts</span><span class="inv-rules-desc">Marcador exacto (reemplaza los 3)</span>
        <span class="inv-rules-pts">+1 pt</span><span class="inv-rules-desc">Diferencia de goles correcta (bonus)</span>
        <span class="inv-rules-pts">+2 pts</span><span class="inv-rules-desc">Penales: sí o no (solo eliminatorias)</span>
        <span class="inv-rules-pts">×2</span><span class="inv-rules-desc">Todo se duplica en la final</span>
        <span class="inv-rules-pts">15 pts</span><span class="inv-rules-desc">Campeón del torneo (elegir antes del inicio)</span>
      </div>
    </div>
  `;

  // Copiar link
  document.getElementById('inv-copy-btn').addEventListener('click', function () {
    navigator.clipboard.writeText(url).then(() => {
      var btn = document.getElementById('inv-copy-btn');
      btn.textContent = '✅ Copiado';
      btn.classList.add('copied');
      setTimeout(() => { btn.textContent = '📋 Copiar'; btn.classList.remove('copied'); }, 2000);
    }).catch(() => {
      // Fallback para navegadores sin clipboard API
      var ta = document.createElement('textarea');
      ta.value = url;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      mostrarToast('Link copiado ✓', 'success');
    });
  });

  // WhatsApp
  var sesion = obtenerSesion();
  var nombreUsuario = sesion ? sesion.nombre : 'tu compañero';
  var msgWa = encodeURIComponent(
    '⚽ ¡Te invito al Mundialito 2026!\n' +
    'Entra aquí y predice los partidos del Mundial junto a ' + nombreUsuario + ' y el grupo:\n' +
    url + '\n\n' +
    '→ Elige tu apodo y tu año de nacimiento para registrarte.\n' +
    '→ Predice marcadores y gana puntos.\n' +
    '¡No te quedes sin tu campeón! 🏆'
  );
  document.getElementById('inv-wa-btn').href = 'https://wa.me/?text=' + msgWa;

  // Share nativo
  var nativeBtn = document.getElementById('inv-native-btn');
  if (navigator.share) {
    nativeBtn.addEventListener('click', function () {
      navigator.share({
        title: 'Mundialito 2026',
        text: '⚽ ¡Únete al Mundialito 2026! Predice los partidos del Mundial.',
        url: url
      }).catch(function () { });
    });
  } else {
    nativeBtn.style.display = 'none';
  }

  // QR — generado con canvas (sin librería externa)
  generarQR(document.getElementById('inv-qr-canvas'), url);
}

// ─────────────────────────────────────────────────────────────
// Generador de QR básico usando la API de Google Charts
// (sin librerías externas — solo una imagen)
// ─────────────────────────────────────────────────────────────
function generarQR(canvas, url) {
  // Usar Google Charts para generar el QR como imagen
  var qrUrl = 'https://chart.googleapis.com/chart?cht=qr&chs=180x180&chl=' + encodeURIComponent(url) + '&choe=UTF-8';
  var img = new Image();
  img.crossOrigin = 'anonymous';
  img.onload = function () {
    var ctx = canvas.getContext('2d');
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, 180, 180);
    ctx.drawImage(img, 0, 0, 180, 180);
  };
  img.onerror = function () {
    // Si falla (sin conexión), mostrar mensaje
    var ctx = canvas.getContext('2d');
    ctx.fillStyle = '#F7F7F5';
    ctx.fillRect(0, 0, 180, 180);
    ctx.fillStyle = '#6B6964';
    ctx.font = '12px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('QR no disponible', 90, 85);
    ctx.fillText('sin conexión', 90, 105);
  };
  img.src = qrUrl;
}
