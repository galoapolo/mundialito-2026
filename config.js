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
  // CONCACAF — anfitriones
  'Canada':                  { es: 'Canadá',             flag: '🇨🇦' },
  'Mexico':                  { es: 'México',             flag: '🇲🇽' },
  'United States':           { es: 'Estados Unidos',     flag: '🇺🇸' },

  // CONMEBOL
  'Argentina':               { es: 'Argentina',          flag: '🇦🇷' },
  'Brazil':                  { es: 'Brasil',             flag: '🇧🇷' },
  'Uruguay':                 { es: 'Uruguay',            flag: '🇺🇾' },
  'Colombia':                { es: 'Colombia',           flag: '🇨🇴' },
  'Ecuador':                 { es: 'Ecuador',            flag: '🇪🇨' },
  'Paraguay':                { es: 'Paraguay',           flag: '🇵🇾' },

  // UEFA
  'France':                  { es: 'Francia',            flag: '🇫🇷' },
  'England':                 { es: 'Inglaterra',         flag: '🏴' },
  'Spain':                   { es: 'España',             flag: '🇪🇸' },
  'Portugal':                { es: 'Portugal',           flag: '🇵🇹' },
  'Germany':                 { es: 'Alemania',           flag: '🇩🇪' },
  'Netherlands':             { es: 'Países Bajos',       flag: '🇳🇱' },
  'Belgium':                 { es: 'Bélgica',            flag: '🇧🇪' },
  'Italy':                   { es: 'Italia',             flag: '🇮🇹' },
  'Croatia':                 { es: 'Croacia',            flag: '🇭🇷' },
  'Switzerland':             { es: 'Suiza',              flag: '🇨🇭' },
  'Denmark':                 { es: 'Dinamarca',          flag: '🇩🇰' },
  'Poland':                  { es: 'Polonia',            flag: '🇵🇱' },
  'Austria':                 { es: 'Austria',            flag: '🇦🇹' },
  'Scotland':                { es: 'Escocia',            flag: '🏴' },
  'Serbia':                  { es: 'Serbia',             flag: '🇷🇸' },
  'Norway':                  { es: 'Noruega',            flag: '🇳🇴' },
  'Ukraine':                 { es: 'Ucrania',            flag: '🇺🇦' },
  'Sweden':                  { es: 'Suecia',             flag: '🇸🇪' },
  'Czech Republic':          { es: 'Chequia',            flag: '🇨🇿' },
  'Slovenia':                { es: 'Eslovenia',          flag: '🇸🇮' },
  'Wales':                   { es: 'Gales',              flag: '🏴' },
  'Greece':                  { es: 'Grecia',             flag: '🇬🇷' },
  'Turkey':                  { es: 'Turquía',            flag: '🇹🇷' },
  'Hungary':                 { es: 'Hungría',            flag: '🇭🇺' },
  'Slovakia':                { es: 'Eslovaquia',         flag: '🇸🇰' },
  'Romania':                 { es: 'Rumania',            flag: '🇷🇴' },
  'Finland':                 { es: 'Finlandia',          flag: '🇫🇮' },
  'Republic of Ireland':     { es: 'Irlanda',            flag: '🇮🇪' },
  'Northern Ireland':        { es: 'Irlanda del Norte',  flag: '🏴' },
  'Bosnia and Herzegovina':  { es: 'Bosnia y Herzegovina', flag: '🇧🇦' },
  'North Macedonia':         { es: 'Macedonia del Norte', flag: '🇲🇰' },
  'Albania':                 { es: 'Albania',            flag: '🇦🇱' },
  'Montenegro':              { es: 'Montenegro',         flag: '🇲🇪' },
  'Iceland':                 { es: 'Islandia',           flag: '🇮🇸' },
  'Israel':                  { es: 'Israel',             flag: '🇮🇱' },
  'Kosovo':                  { es: 'Kosovo',             flag: '🇽🇰' },
  'Luxembourg':              { es: 'Luxemburgo',         flag: '🇱🇺' },

  // CONCACAF (resto)
  'Costa Rica':              { es: 'Costa Rica',         flag: '🇨🇷' },
  'Jamaica':                 { es: 'Jamaica',            flag: '🇯🇲' },
  'Panama':                  { es: 'Panamá',             flag: '🇵🇦' },
  'Honduras':                { es: 'Honduras',           flag: '🇭🇳' },
  'Curaçao':                 { es: 'Curazao',            flag: '🇨🇼' },
  'Haiti':                   { es: 'Haití',              flag: '🇭🇹' },
  'Guatemala':               { es: 'Guatemala',          flag: '🇬🇹' },
  'Trinidad and Tobago':     { es: 'Trinidad y Tobago',  flag: '🇹🇹' },
  'El Salvador':             { es: 'El Salvador',        flag: '🇸🇻' },
  'Surinam':                 { es: 'Surinam',            flag: '🇸🇷' },
  'Suriname':                { es: 'Surinam',            flag: '🇸🇷' },

  // CAF — África
  'Morocco':                 { es: 'Marruecos',          flag: '🇲🇦' },
  'Senegal':                 { es: 'Senegal',            flag: '🇸🇳' },
  'Tunisia':                 { es: 'Túnez',              flag: '🇹🇳' },
  'Egypt':                   { es: 'Egipto',             flag: '🇪🇬' },
  'Algeria':                 { es: 'Argelia',            flag: '🇩🇿' },
  'Ivory Coast':             { es: 'Costa de Marfil',    flag: '🇨🇮' },
  "Côte d'Ivoire":           { es: 'Costa de Marfil',    flag: '🇨🇮' },
  'Nigeria':                 { es: 'Nigeria',            flag: '🇳🇬' },
  'Cameroon':                { es: 'Camerún',            flag: '🇨🇲' },
  'Ghana':                   { es: 'Ghana',              flag: '🇬🇭' },
  'South Africa':            { es: 'Sudáfrica',          flag: '🇿🇦' },
  'Cape Verde':              { es: 'Cabo Verde',         flag: '🇨🇻' },
  'Mali':                    { es: 'Mali',               flag: '🇲🇱' },
  'DR Congo':                { es: 'RD del Congo',       flag: '🇨🇩' },
  'Democratic Republic of the Congo': { es: 'RD del Congo', flag: '🇨🇩' },
  'Gabon':                   { es: 'Gabón',              flag: '🇬🇦' },
  'Benin':                   { es: 'Benín',              flag: '🇧🇯' },
  'Guinea':                  { es: 'Guinea',             flag: '🇬🇳' },
  'Equatorial Guinea':       { es: 'Guinea Ecuatorial',  flag: '🇬🇶' },
  'Burkina Faso':            { es: 'Burkina Faso',       flag: '🇧🇫' },
  'Zambia':                  { es: 'Zambia',             flag: '🇿🇲' },
  'Mozambique':              { es: 'Mozambique',         flag: '🇲🇿' },
  'Comoros':                 { es: 'Comoras',            flag: '🇰🇲' },
  'Madagascar':              { es: 'Madagascar',         flag: '🇲🇬' },

  // AFC — Asia
  'Japan':                   { es: 'Japón',              flag: '🇯🇵' },
  'South Korea':             { es: 'Corea del Sur',      flag: '🇰🇷' },
  'Republic of Korea':       { es: 'Corea del Sur',      flag: '🇰🇷' },
  'Iran':                    { es: 'Irán',               flag: '🇮🇷' },
  'Saudi Arabia':            { es: 'Arabia Saudita',     flag: '🇸🇦' },
  'Australia':               { es: 'Australia',          flag: '🇦🇺' },
  'Qatar':                   { es: 'Catar',              flag: '🇶🇦' },
  'Jordan':                  { es: 'Jordania',           flag: '🇯🇴' },
  'Iraq':                    { es: 'Irak',               flag: '🇮🇶' },
  'United Arab Emirates':    { es: 'Emiratos Árabes Unidos', flag: '🇦🇪' },
  'Uzbekistan':              { es: 'Uzbekistán',         flag: '🇺🇿' },
  'China':                   { es: 'China',              flag: '🇨🇳' },
  'China PR':                { es: 'China',              flag: '🇨🇳' },
  'Indonesia':               { es: 'Indonesia',          flag: '🇮🇩' },
  'Bahrain':                 { es: 'Baréin',             flag: '🇧🇭' },
  'Kuwait':                  { es: 'Kuwait',             flag: '🇰🇼' },
  'Oman':                    { es: 'Omán',               flag: '🇴🇲' },
  'Kyrgyzstan':              { es: 'Kirguistán',         flag: '🇰🇬' },
  'Palestine':               { es: 'Palestina',          flag: '🇵🇸' },
  'North Korea':             { es: 'Corea del Norte',    flag: '🇰🇵' },
  'Tajikistan':              { es: 'Tayikistán',         flag: '🇹🇯' },
  'Vietnam':                 { es: 'Vietnam',            flag: '🇻🇳' },
  'Thailand':                { es: 'Tailandia',          flag: '🇹🇭' },
  'India':                   { es: 'India',              flag: '🇮🇳' },

  // OFC — Oceanía
  'New Zealand':             { es: 'Nueva Zelanda',      flag: '🇳🇿' },
  'New Caledonia':           { es: 'Nueva Caledonia',    flag: '🇳🇨' },
  'Fiji':                    { es: 'Fiyi',               flag: '🇫🇯' },
  'Tahiti':                  { es: 'Tahití',             flag: '🇵🇫' },
  'Vanuatu':                 { es: 'Vanuatu',            flag: '🇻🇺' },
  'Solomon Islands':         { es: 'Islas Salomón',      flag: '🇸🇧' },
  'Papua New Guinea':        { es: 'Papúa Nueva Guinea', flag: '🇵🇬' },

  // Repechajes / playoffs sin definir
  'Por definir':             { es: 'Por definir',        flag: '❔' },
  'TBD':                     { es: 'Por definir',        flag: '❔' },
};

// ─────────────────────────────────────────────────────────────
// Devuelve { es, flag } para un nombre de equipo en inglés.
// Si no se encuentra, devuelve el nombre original sin bandera.
// ─────────────────────────────────────────────────────────────
function obtenerEquipo(nombreAPI) {
  if (!nombreAPI) return { es: 'Por definir', flag: '❔' };
  if (EQUIPOS[nombreAPI]) return EQUIPOS[nombreAPI];
  // EMPATE u otros valores especiales se devuelven igual
  return { es: nombreAPI, flag: '' };
}
