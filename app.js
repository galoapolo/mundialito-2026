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
  // Botón ? del sidebar (desktop)
  const helpSidebar = document.getElementById('btn-help');
  if (helpSidebar) helpSidebar.addEventListener('click', () => mostrarModalBienvenida());
  // Botones ? flotantes en cada sección (mobile + desktop)
  document.querySelectorAll('.help-btn-float').forEach(btn => {
    btn.addEventListener('click', () => mostrarModalBienvenida());
  });
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

  // Refrescar datos — cada 3 min normalmente, cada 30 seg si hay partido en curso
  function programarRefresco() {
    const partidos = window._partidosCache || [];
    const ahora    = new Date();
    const hayEnCurso = partidos.some(p => {
      if (!p.fecha_hora_utc) return false;
      const inicio = new Date(p.fecha_hora_utc);
      const min    = (ahora - inicio) / 60000;
      return min >= 0 && min <= 200 && p.estado !== 'FINALIZADO';
    });
    return hayEnCurso ? 30000 : 180000;
  }

  let refreshTimer;
  function arrancarRefresco() {
    clearTimeout(refreshTimer);
    const intervalo = programarRefresco();
    refreshTimer = setTimeout(() => {
      const seccionActiva = document.querySelector('.section.active');
      if (seccionActiva) {
        const id = seccionActiva.id.replace('section-', '');
        irASeccion(id);
      }
      arrancarRefresco();
    }, intervalo);
  }
  arrancarRefresco();

  // PWA — registrar service worker y solicitar permisos de notificación
  registrarPWA(sesion);
}

// ─────────────────────────────────────────────────────────────
// PWA — Service Worker + Notificaciones Push
// ─────────────────────────────────────────────────────────────
async function registrarPWA(sesion) {
  if (!('serviceWorker' in navigator)) return;

  try {
    const registro = await navigator.serviceWorker.register('./sw.js');
    console.log('Service Worker registrado:', registro.scope);

    // Esperar que el SW esté activo
    await navigator.serviceWorker.ready;

    // Pedir permiso de notificaciones si no se ha hecho
    await solicitarPermisoNotificaciones(sesion, registro);
  } catch (e) {
    console.warn('Service Worker no disponible:', e.message);
  }
}

async function solicitarPermisoNotificaciones(sesion, registro) {
  if (!('Notification' in window) || !('PushManager' in window)) return;

  // Si ya tenemos permiso, suscribir directamente
  if (Notification.permission === 'granted') {
    await suscribirPush(sesion, registro);
    return;
  }

  // Si ya fue denegado, no volver a pedir
  if (Notification.permission === 'denied') return;

  // Pedir permiso solo si hay sesión activa (esperar 3 seg para no interrumpir el login)
  setTimeout(async () => {
    const permiso = await Notification.requestPermission();
    if (permiso === 'granted') {
      await suscribirPush(sesion, registro);
      mostrarToast('¡Notificaciones activadas! Te avisaremos antes de cada partido.', 'success');
    }
  }, 3000);
}

async function suscribirPush(sesion, registro) {
  try {
    // Verificar si ya hay una suscripción activa
    let suscripcion = await registro.pushManager.getSubscription();

    if (!suscripcion) {
      // Crear nueva suscripción
      suscripcion = await registro.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64AUint8Array(CONFIG.VAPID_PUBLIC_KEY)
      });
    }

    // Guardar el token en el Sheet (usando JSON de la suscripción como token)
    const token = JSON.stringify(suscripcion);
    await guardarPushToken(sesion.usuario_id, token);
    console.log('Suscripción push guardada correctamente.');
  } catch (e) {
    console.warn('No se pudo suscribir a push:', e.message);
  }
}

// Convierte la clave VAPID base64url a Uint8Array (requerido por pushManager.subscribe)
function urlBase64AUint8Array(base64String) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}
