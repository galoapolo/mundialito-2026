// ============================================================
// config.js — Mundialito 2026
// Configuración compartida: URL del backend y datos de equipos
// ============================================================

const CONFIG = {
  // URL del Web App de Google Apps Script (API.gs)
  API_URL: 'https://script.google.com/macros/s/AKfycbxu_l8icYIPgwPglBdGuOAAnxjgJQYCiEKCdi2IZX7EUdLvTI5lbquUSl8IoBzRRtp-/exec',

  // Orden de las fases del torneo
  FASES: ['GRUPOS', '32AVOS', 'OCTAVOS', 'CUARTOS', 'SEMIS', 'FINAL'],

  // Nombres de fases en español para mostrar
  NOMBRES_FASES: {
    GRUPOS: 'Fase de grupos',
    '32AVOS': 'Treintaidosavos de final',
    OCTAVOS: 'Octavos de final',
    CUARTOS: 'Cuartos de final',
    SEMIS: 'Semifinales',
    FINAL: 'Final',
    TERCER_LUGAR: 'Tercer lugar'
  },

  // Cada cuánto se refrescan los datos automáticamente (ms)
  REFRESH_INTERVAL: 60000
};

// ============================================================
// Mapa de nombres de equipos (inglés API → español) y banderas
// football-data.org devuelve nombres en inglés; aquí traducimos
// y asignamos el emoji de bandera correspondiente.
// ============================================================
const EQUIPOS = {
  'Canada': { es: 'Canadá', flag: '🇨🇦', code: 'ca' },
  'Mexico': { es: 'México', flag: '🇲🇽', code: 'mx' },
  'United States': { es: 'Estados Unidos', flag: '🇺🇸', code: 'us' },
  'Argentina': { es: 'Argentina', flag: '🇦🇷', code: 'ar' },
  'Brazil': { es: 'Brasil', flag: '🇧🇷', code: 'br' },
  'Uruguay': { es: 'Uruguay', flag: '🇺🇾', code: 'uy' },
  'Colombia': { es: 'Colombia', flag: '🇨🇴', code: 'co' },
  'Ecuador': { es: 'Ecuador', flag: '🇪🇨', code: 'ec' },
  'Paraguay': { es: 'Paraguay', flag: '🇵🇾', code: 'py' },
  'France': { es: 'Francia', flag: '🇫🇷', code: 'fr' },
  'England': { es: 'Inglaterra', flag: '🏴', code: 'gb-eng' },
  'Spain': { es: 'España', flag: '🇪🇸', code: 'es' },
  'Portugal': { es: 'Portugal', flag: '🇵🇹', code: 'pt' },
  'Germany': { es: 'Alemania', flag: '🇩🇪', code: 'de' },
  'Netherlands': { es: 'Países Bajos', flag: '🇳🇱', code: 'nl' },
  'Belgium': { es: 'Bélgica', flag: '🇧🇪', code: 'be' },
  'Italy': { es: 'Italia', flag: '🇮🇹', code: 'it' },
  'Croatia': { es: 'Croacia', flag: '🇭🇷', code: 'hr' },
  'Switzerland': { es: 'Suiza', flag: '🇨🇭', code: 'ch' },
  'Denmark': { es: 'Dinamarca', flag: '🇩🇰', code: 'dk' },
  'Poland': { es: 'Polonia', flag: '🇵🇱', code: 'pl' },
  'Austria': { es: 'Austria', flag: '🇦🇹', code: 'at' },
  'Scotland': { es: 'Escocia', flag: '🏴', code: 'gb-sct' },
  'Serbia': { es: 'Serbia', flag: '🇷🇸', code: 'rs' },
  'Norway': { es: 'Noruega', flag: '🇳🇴', code: 'no' },
  'Ukraine': { es: 'Ucrania', flag: '🇺🇦', code: 'ua' },
  'Sweden': { es: 'Suecia', flag: '🇸🇪', code: 'se' },
  'Czech Republic': { es: 'Chequia', flag: '🇨🇿', code: 'cz' },
  'Slovenia': { es: 'Eslovenia', flag: '🇸🇮', code: 'si' },
  'Wales': { es: 'Gales', flag: '🏴', code: 'gb-wls' },
  'Greece': { es: 'Grecia', flag: '🇬🇷', code: 'gr' },
  'Turkey': { es: 'Turquía', flag: '🇹🇷', code: 'tr' },
  'Hungary': { es: 'Hungría', flag: '🇭🇺', code: 'hu' },
  'Slovakia': { es: 'Eslovaquia', flag: '🇸🇰', code: 'sk' },
  'Romania': { es: 'Rumania', flag: '🇷🇴', code: 'ro' },
  'Finland': { es: 'Finlandia', flag: '🇫🇮', code: 'fi' },
  'Republic of Ireland': { es: 'Irlanda', flag: '🇮🇪', code: 'ie' },
  'Northern Ireland': { es: 'Irlanda del Norte', flag: '🏴', code: 'gb-nir' },
  'Albania': { es: 'Albania', flag: '🇦🇱', code: 'al' },
  'Montenegro': { es: 'Montenegro', flag: '🇲🇪', code: 'me' },
  'Iceland': { es: 'Islandia', flag: '🇮🇸', code: 'is' },
  'Israel': { es: 'Israel', flag: '🇮🇱', code: 'il' },
  'Kosovo': { es: 'Kosovo', flag: '🇽🇰', code: 'xk' },
  'Luxembourg': { es: 'Luxemburgo', flag: '🇱🇺', code: 'lu' },
  'Costa Rica': { es: 'Costa Rica', flag: '🇨🇷', code: 'cr' },
  'Jamaica': { es: 'Jamaica', flag: '🇯🇲', code: 'jm' },
  'Panama': { es: 'Panamá', flag: '🇵🇦', code: 'pa' },
  'Honduras': { es: 'Honduras', flag: '🇭🇳', code: 'hn' },
  'Curaçao': { es: 'Curazao', flag: '🇨🇼', code: 'cw' },
  'Haiti': { es: 'Haití', flag: '🇭🇹', code: 'ht' },
  'Guatemala': { es: 'Guatemala', flag: '🇬🇹', code: 'gt' },
  'Trinidad and Tobago': { es: 'Trinidad y Tobago', flag: '🇹🇹', code: 'tt' },
  'El Salvador': { es: 'El Salvador', flag: '🇸🇻', code: 'sv' },
  'Surinam': { es: 'Surinam', flag: '🇸🇷', code: 'sr' },
  'Suriname': { es: 'Surinam', flag: '🇸🇷', code: 'sr' },
  'Morocco': { es: 'Marruecos', flag: '🇲🇦', code: 'ma' },
  'Senegal': { es: 'Senegal', flag: '🇸🇳', code: 'sn' },
  'Tunisia': { es: 'Túnez', flag: '🇹🇳', code: 'tn' },
  'Egypt': { es: 'Egipto', flag: '🇪🇬', code: 'eg' },
  'Algeria': { es: 'Argelia', flag: '🇩🇿', code: 'dz' },
  'Ivory Coast': { es: 'Costa de Marfil', flag: '🇨🇮', code: 'ci' },
  'Nigeria': { es: 'Nigeria', flag: '🇳🇬', code: 'ng' },
  'Cameroon': { es: 'Camerún', flag: '🇨🇲', code: 'cm' },
  'Ghana': { es: 'Ghana', flag: '🇬🇭', code: 'gh' },
  'South Africa': { es: 'Sudáfrica', flag: '🇿🇦', code: 'za' },
  'Cape Verde': { es: 'Cabo Verde', flag: '🇨🇻', code: 'cv' },
  'Mali': { es: 'Mali', flag: '🇲🇱', code: 'ml' },
  'DR Congo': { es: 'RD del Congo', flag: '🇨🇩', code: 'cd' },
  'Gabon': { es: 'Gabón', flag: '🇬🇦', code: 'ga' },
  'Benin': { es: 'Benín', flag: '🇧🇯', code: 'bj' },
  'Guinea': { es: 'Guinea', flag: '🇬🇳', code: 'gn' },
  'Equatorial Guinea': { es: 'Guinea Ecuatorial', flag: '🇬🇶', code: 'gq' },
  'Burkina Faso': { es: 'Burkina Faso', flag: '🇧🇫', code: 'bf' },
  'Zambia': { es: 'Zambia', flag: '🇿🇲', code: 'zm' },
  'Mozambique': { es: 'Mozambique', flag: '🇲🇿', code: 'mz' },
  'Comoros': { es: 'Comoras', flag: '🇰🇲', code: 'km' },
  'Madagascar': { es: 'Madagascar', flag: '🇲🇬', code: 'mg' },
  'Japan': { es: 'Japón', flag: '🇯🇵', code: 'jp' },
  'South Korea': { es: 'Corea del Sur', flag: '🇰🇷', code: 'kr' },
  'Republic of Korea': { es: 'Corea del Sur', flag: '🇰🇷', code: 'kr' },
  'Iran': { es: 'Irán', flag: '🇮🇷', code: 'ir' },
  'Saudi Arabia': { es: 'Arabia Saudita', flag: '🇸🇦', code: 'sa' },
  'Australia': { es: 'Australia', flag: '🇦🇺', code: 'au' },
  'Qatar': { es: 'Catar', flag: '🇶🇦', code: 'qa' },
  'Jordan': { es: 'Jordania', flag: '🇯🇴', code: 'jo' },
  'Iraq': { es: 'Irak', flag: '🇮🇶', code: 'iq' },
  'Uzbekistan': { es: 'Uzbekistán', flag: '🇺🇿', code: 'uz' },
  'China': { es: 'China', flag: '🇨🇳', code: 'cn' },
  'China PR': { es: 'China', flag: '🇨🇳', code: 'cn' },
  'Indonesia': { es: 'Indonesia', flag: '🇮🇩', code: 'id' },
  'Bahrain': { es: 'Baréin', flag: '🇧🇭', code: 'bh' },
  'Kuwait': { es: 'Kuwait', flag: '🇰🇼', code: 'kw' },
  'Oman': { es: 'Omán', flag: '🇴🇲', code: 'om' },
  'Kyrgyzstan': { es: 'Kirguistán', flag: '🇰🇬', code: 'kg' },
  'Palestine': { es: 'Palestina', flag: '🇵🇸', code: 'ps' },
  'North Korea': { es: 'Corea del Norte', flag: '🇰🇵', code: 'kp' },
  'Tajikistan': { es: 'Tayikistán', flag: '🇹🇯', code: 'tj' },
  'Vietnam': { es: 'Vietnam', flag: '🇻🇳', code: 'vn' },
  'Thailand': { es: 'Tailandia', flag: '🇹🇭', code: 'th' },
  'India': { es: 'India', flag: '🇮🇳', code: 'in' },
  'New Zealand': { es: 'Nueva Zelanda', flag: '🇳🇿', code: 'nz' },
  'New Caledonia': { es: 'Nueva Caledonia', flag: '🇳🇨', code: 'nc' },
  'Fiji': { es: 'Fiyi', flag: '🇫🇯', code: 'fj' },
  'Tahiti': { es: 'Tahití', flag: '🇵🇫', code: 'pf' },
  'Vanuatu': { es: 'Vanuatu', flag: '🇻🇺', code: 'vu' },
  'Solomon Islands': { es: 'Islas Salomón', flag: '🇸🇧', code: 'sb' },
  'Por definir': { es: 'Por definir', flag: '❔', code: '' },
  'TBD': { es: 'Por definir', flag: '❔', code: '' },
};

// ─────────────────────────────────────────────────────────────
// Devuelve { es, flag, code, flagUrl } para un nombre de equipo
// en inglés. flagUrl usa flagcdn.com (imágenes reales, consistentes
// en todos los sistemas — los emojis de bandera no se ven igual
// en Windows, Android, iOS, etc.)
// Si no se encuentra, devuelve el nombre original sin bandera.
// ─────────────────────────────────────────────────────────────
function obtenerEquipo(nombreAPI) {
  if (!nombreAPI) return equipoConFlagUrl({ es: 'Por definir', flag: '❔', code: '' });
  if (EQUIPOS[nombreAPI]) return equipoConFlagUrl(EQUIPOS[nombreAPI]);
  // EMPATE u otros valores especiales se devuelven igual
  return equipoConFlagUrl({ es: nombreAPI, flag: '', code: '' });
}

function equipoConFlagUrl(equipo) {
  const flagUrl = equipo.code
    ? `https://flagcdn.com/48x36/${equipo.code}.png`
    : '';
  return { ...equipo, flagUrl };
}
