// ============================================================
// app.js — Mundialito 2026
// Punto de entrada: maneja login/sesión y arranca la app
// ============================================================

document.addEventListener('DOMContentLoaded', () => {
  const sesion = obtenerSesion();

  if (sesion && sesion.usuario_id) {
    iniciarApp(sesion);
  } else {
    mostrarLogin();
  }

  inicializarLogin();
  inicializarNavegacion();
  inicializarLogout();
  inicializarModalBienvenida();
});

// ─────────────────────────────────────────────────────────────
// LOGIN
// ─────────────────────────────────────────────────────────────
function mostrarLogin() {
  document.getElementById('login-screen').style.display = 'flex';
  document.getElementById('app-shell').classList.remove('visible');
}

function inicializarLogin() {
  const btn = document.getElementById('btn-login');
  const inputNombre = document.getElementById('input-nombre');
  const inputPin = document.getElementById('input-pin');
  const errorEl = document.getElementById('login-error');

  // Solo permitir dígitos en el año de nacimiento
  inputPin.addEventListener('input', () => {
    inputPin.value = inputPin.value.replace(/\D/g, '').slice(0, 4);
  });

  // Enter en cualquier campo dispara el login
  [inputNombre, inputPin].forEach(input => {
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') btn.click();
    });
  });

  btn.addEventListener('click', async () => {
    const nombre = inputNombre.value.trim();
    const pin = inputPin.value.trim();

    errorEl.classList.remove('visible');

    if (!nombre) {
      mostrarErrorLogin('Escribe tu apodo.');
      return;
    }
    if (!/^\d{4}$/.test(pin)) {
      mostrarErrorLogin('Ingresa tu año de nacimiento (4 dígitos), ej: 1990.');
      return;
    }

    btn.disabled = true;
    btn.textContent = 'Entrando...';

    try {
      const resultado = await login(nombre, pin);
      if (resultado.exito) {
        const sesion = { usuario_id: resultado.usuario_id, nombre: resultado.nombre };
        iniciarApp(sesion);
        if (resultado.nuevo) {
          mostrarToast(`¡Bienvenido, ${resultado.nombre}! Tu cuenta fue creada.`, 'success');
          mostrarModalBienvenida();
        }
      } else {
        mostrarErrorLogin(resultado.error || 'No se pudo iniciar sesión.');
        btn.disabled = false;
        btn.textContent = 'Entrar';
      }
    } catch (e) {
      mostrarErrorLogin('Error de conexión. Intenta de nuevo.');
      btn.disabled = false;
      btn.textContent = 'Entrar';
      console.error(e);
    }
  });

  function mostrarErrorLogin(msg) {
    errorEl.textContent = msg;
    errorEl.classList.add('visible');
  }
}

// ─────────────────────────────────────────────────────────────
// LOGOUT
// ─────────────────────────────────────────────────────────────
function inicializarLogout() {
  document.getElementById('btn-logout').addEventListener('click', () => {
    if (confirm('¿Cerrar sesión? Necesitarás tu apodo y año de nacimiento para volver a entrar.')) {
      cerrarSesion();
      location.reload();
    }
  });
}

// ─────────────────────────────────────────────────────────────
// MODAL DE BIENVENIDA (solo la primera vez)
// ─────────────────────────────────────────────────────────────
function mostrarModalBienvenida() {
  document.getElementById('welcome-modal').classList.add('visible');
}

function inicializarModalBienvenida() {
  document.getElementById('btn-welcome-close').addEventListener('click', () => {
    document.getElementById('welcome-modal').classList.remove('visible');
  });
  const helpBtn = document.getElementById('btn-help');
  if (helpBtn) {
    helpBtn.addEventListener('click', () => mostrarModalBienvenida());
  }
}

// ─────────────────────────────────────────────────────────────
// ARRANQUE DE LA APP
// ─────────────────────────────────────────────────────────────
function iniciarApp(sesion) {
  document.getElementById('login-screen').style.display = 'none';
  document.getElementById('app-shell').classList.add('visible');

  actualizarInfoUsuario(sesion);

  // Cargar la pantalla inicial (Partidos de hoy)
  irASeccion('partidos');

  // Refrescar datos periódicamente
  setInterval(() => {
    const seccionActiva = document.querySelector('.section.active');
    if (!seccionActiva) return;
    const id = seccionActiva.id.replace('section-', '');
    irASeccion(id);
  }, CONFIG.REFRESH_INTERVAL);

  // PWA: pendiente — se agregará service worker en el módulo PWA
}
