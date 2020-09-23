// ==========================
//  Puerto
// ==========================
process.env.PORT = process.env.PORT || 3000;

// ==========================
//  Entorno
// ==========================
process.env.NODE_ENV = process.env.NODE_ENV || 'dev';

// ==========================
//  Vencimiento del Token
// ==========================
// 60 segundos
// 60 minutos
// 24 horas
// 30 dias
process.env.CADUCIDAD_TOKEN = '48h';


// =========================
// Datos de acceso para enviar emails
// =========================

process.env.GMAIL_USERNAME = 'prohalo2009@gmail.com';
process.env.GMAIL_PASSWORD = 'qbesksneebrfeswn';

// ==========================
//  SEED de autenticación
// ==========================
process.env.SEED = process.env.SEED || 'este-es-el-seed-desarrollo';

// ==========================
//  Base de datos
// ==========================
let urlDB;

if (process.env.NODE_ENV === 'dev') {
    urlDB = 'mongodb://localhost:27017/sgdar';
} else {
    urlDB = process.env.MONGO_URI;
}

process.env.URLDB = urlDB;

// ==========================
//  Google Cliente ID
// ==========================
process.env.CLIENT_ID = process.env.CLIENT_ID || '797847559027-nb8burqkm2t8dfa7b82pfopu5pb45nva.apps.googleusercontent.com'