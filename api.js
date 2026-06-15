// ============================================================
// api.js — Mundialito 2026
// Comunicación con el backend (Google Apps Script Web App)
// y manejo de la sesión del usuario (localStorage)
// ============================================================

const SESSION_KEY = 'mundialito_sesion';

// ─────────────────────────────────────────────────────────────
// GET genérico hacia la API
// ─────────────────────────────────────────────────────────────
async function apiGet(accion, params = {}) {
  const url = new URL(CONFIG.API_URL);
  url.searchParams.set('accion', accion);
  for (const k in params) {
    if (params[k] !== undefined && params[k] !== null) {
      url.searchParams.set(k, params[k]);
    }
  }
  const resp = await fetch(url.toString());
  if (!resp.ok) throw new Error('Error de conexión con el servidor');
  return resp.json();
}

// ─────────────────────────────────────────────────────────────
// POST genérico hacia la API
// Apps Script Web Apps requieren 'text/plain' para evitar
// el preflight CORS con POST + JSON.
// ─────────────────────────────────────────────────────────────
async function apiPost(accion, datos = {}) {
  const body = JSON.stringify({ accion, ...datos });
  const resp = await fetch(CONFIG.API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: body
  });
  if (!resp.ok) throw new Error('Error de conexión con el servidor');
  return resp.json();
}

// ============================================================
// SESIÓN DEL USUARIO
// ============================================================

function obtenerSesion() {
  const raw = localStorage.getItem(SESSION_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch (e) {
    return null;
  }
}

function guardarSesion(sesion) {
  localStorage.setItem(SESSION_KEY, JSON.stringify(sesion));
}

function cerrarSesion() {
  localStorage.removeItem(SESSION_KEY);
}

// ─────────────────────────────────────────────────────────────
// Login / registro: apodo + PIN de 4 dígitos
// ─────────────────────────────────────────────────────────────
async function login(nombre, pin) {
  const resultado = await apiPost('login', { nombre, pin });
  if (resultado.exito) {
    guardarSesion({
      usuario_id: resultado.usuario_id,
      nombre: resultado.nombre
    });
  }
  return resultado;
}

// ============================================================
// DATOS DEL TORNEO
// ============================================================

async function obtenerPartidos() {
  return apiGet('partidos');
}

async function obtenerTabla() {
  return apiGet('tabla');
}

async function obtenerPredicciones(usuarioId) {
  return apiGet('predicciones', { usuario_id: usuarioId || '' });
}

async function obtenerTodasPredicciones() {
  return apiGet('predicciones');
}

async function obtenerEspeciales() {
  return apiGet('especiales');
}

async function guardarPrediccion(datos) {
  return apiPost('guardar_prediccion', datos);
}

async function guardarCampeon(usuarioId, equipoCampeon) {
  return apiPost('guardar_campeon', { usuario_id: usuarioId, equipo_campeon: equipoCampeon });
}

async function guardarPushToken(usuarioId, token) {
  return apiPost('guardar_push_token', { usuario_id: usuarioId, push_token: token });
}

// ============================================================
// HELPERS DE FECHA / ZONA HORARIA
// ============================================================

// Convierte una fecha UTC (string ISO) a la hora local del dispositivo
function formatearHoraLocal(fechaUTC) {
  if (!fechaUTC) return '';
  const fecha = new Date(fechaUTC);
  return fecha.toLocaleTimeString('es', {
    hour: '2-digit',
    minute: '2-digit'
  });
}

// Devuelve fecha + hora local formateada en español
function formatearFechaHoraLocal(fechaUTC) {
  if (!fechaUTC) return '';
  const fecha = new Date(fechaUTC);
  const opciones = {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    hour: '2-digit',
    minute: '2-digit'
  };
  let texto = fecha.toLocaleDateString('es', opciones);
  // Capitalizar primera letra
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

// Devuelve solo la fecha corta en español (ej: "vie 19 jun")
function formatearFechaCorta(fechaUTC) {
  if (!fechaUTC) return '';
  const fecha = new Date(fechaUTC);
  let texto = fecha.toLocaleDateString('es', { weekday: 'short', day: 'numeric', month: 'short' });
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

// Devuelve true si la fecha (UTC) es hoy, según la hora local del dispositivo
function esHoy(fechaUTC) {
  if (!fechaUTC) return false;
  const fecha = new Date(fechaUTC);
  const hoy = new Date();
  return fecha.getFullYear() === hoy.getFullYear() &&
         fecha.getMonth() === hoy.getMonth() &&
         fecha.getDate() === hoy.getDate();
}

// Devuelve true si la fecha (UTC) ya pasó
function yaPaso(fechaUTC) {
  if (!fechaUTC) return false;
  return new Date(fechaUTC).getTime() < Date.now();
}
