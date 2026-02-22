const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');

const db = new sqlite3.Database(
  path.join(__dirname, 'clinicas.db')
);

db.serialize(() => {

  db.run(`
    CREATE TABLE IF NOT EXISTS cities (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT,
      state TEXT,
      slug TEXT
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS clinics (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      city_id INTEGER,
      name TEXT,
      description TEXT,
      address TEXT,
      phone TEXT,
      whatsapp TEXT,
      latitude REAL,
      longitude REAL,
      logoImage TEXT
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE,
      password TEXT
    )
  `);



});


module.exports = db;
