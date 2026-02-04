// server/models/db.js
const low = require('lowdb');
const FileSync = require('lowdb/adapters/FileSync');
const path = require('path');

const dbPath = path.join(__dirname, '..', 'db.json');
const adapter = new FileSync(dbPath);
const db = low(adapter);

console.log(`Database initialized at: ${dbPath}`);

// Set defaults
db.defaults({ users: [], sessions: [], students: [], questions: [], notes: [] }).write();

module.exports = { db };
