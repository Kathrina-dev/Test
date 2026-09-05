const express = require('express');
const path = require('path');
const Database = require('better-sqlite3');

const app = express();
app.use(express.json());

// Connect to the SQLite database that lives next to this file, regardless of
// the working directory the process is launched from.
const db = new Database(path.join(__dirname, 'dev.db'));
db.pragma('journal_mode = WAL');

// --- Schema -------------------------------------------------------------
db.prepare(`
  CREATE TABLE IF NOT EXISTS ChallengeLocations (
    locationID TEXT PRIMARY KEY,
    lat REAL,
    lng REAL,
    flag TEXT,
    image TEXT
  )
`).run();

db.prepare(`
  CREATE TABLE IF NOT EXISTS Sessions (
    token TEXT PRIMARY KEY,
    createdAt INTEGER NOT NULL,
    expiresAt INTEGER NOT NULL,
    solved TEXT NOT NULL DEFAULT '[]'
  )
`).run();

// --- Seed challenge locations (real-world answers) ----------------------
const seedPlaces = [
  { id: 'place1', lat: 35.1563889, lng: 129.141111, image: 'place1.png' },
  { id: 'place2', lat: 42.996111, lng: -78.956667, image: 'place2.png' },
  { id: 'place3', lat: 56.688805, lng: 9.068584, image: 'place3.png' },
  { id: 'place4', lat: 35.290556, lng: 136.736667, image: 'place4.png' },
  { id: 'place5', lat: 24.600056, lng: 120.999055, image: 'place5.png' },
  { id: 'place6', lat: 47.553167, lng: 7.529945, image: 'place6.png' },
  { id: 'place7', lat: 34.687889, lng: 135.188, image: 'place7.png' },
  { id: 'place8', lat: 40.753556, lng: -73.934305, image: 'place8.png' },
];
const insertStmt = db.prepare(
  'INSERT INTO ChallengeLocations (locationID, lat, lng, flag, image) VALUES (?, ?, ?, NULL, ?) ' +
  'ON CONFLICT(locationID) DO UPDATE SET lat = excluded.lat, lng = excluded.lng, image = excluded.image'
);
for (const p of seedPlaces) insertStmt.run(p.id, p.lat, p.lng, p.image);

// Drop any stale helper/typo rows from earlier iterations of the DB.
db.prepare("DELETE FROM ChallengeLocations WHERE locationID NOT GLOB 'place[0-9]'").run();

// --- Routes -------------------------------------------------------------
app.get('/health', (req, res) => {
  try {
    const result = db.prepare('SELECT 1 AS test').get();
    if (result && result.test === 1) {
      return res.status(200).json({ status: 'UP', database: 'HEALTHY' });
    }
    throw new Error('Database responded unexpectedly');
  } catch (error) {
    return res.status(500).json({ status: 'DOWN', error: error.message });
  }
});

const cetRoutes = require('./routes/cet')(db);
app.use('/api/cet', cetRoutes);

// --- Start --------------------------------------------------------------
const PORT = process.env.PORT_BACKEND || 8080;
app.listen(PORT, () => {
  console.log(`🚀 CET backend running on http://localhost:${PORT}`);
});
