// server/models/db.js
const low = require('lowdb');
const FileSync = require('lowdb/adapters/FileSync');

const adapter = new FileSync('db.json');
const db = low(adapter);

// Set defaults
db.defaults({ users: [], sessions: [], students: [], notes: [] }).write();

module.exports = { db };
