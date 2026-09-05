const express = require('express');
const Database = require('better-sqlite3');

const app = express();
app.use(express.json());

// 1. Initialize/Connect to the SQLite database file directly
const db = new Database('./dev.db');

// 2. Automatically create the User table if it doesn't exist yet
db.prepare(`
  CREATE TABLE IF NOT EXISTS User (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    name TEXT
  )
`).run();

// 3. Create ChallengeLocations table and insert mock data
db.prepare(`
  CREATE TABLE IF NOT EXISTS ChallengeLocations (
    locationID TEXT PRIMARY KEY,
    lat REAL,
    lng REAL
  )
`).run();

db.prepare(`
  INSERT OR IGNORE INTO ChallengeLocations (locationID, lat, lng)
  VALUES ('target-1', 40.7128, -74.0060)
`).run();

// 🟢 Health Check Route
app.get('/health', (req, res) => {
  try {
    // Run a simple, native SQL test query
    const result = db.prepare('SELECT 1 AS test').get();
    
    if (result && result.test === 1) {
      res.status(200).json({
        status: 'UP',
        timestamp: new Date(),
        services: {
          database: 'HEALTHY',
          server: 'HEALTHY'
        }
      });
    } else {
      throw new Error("Database responded unexpectedly");
    }
  } catch (error) {
    res.status(500).json({
      status: 'DOWN',
      timestamp: new Date(),
      error: error.message
    });
  }
});

// 📁 GET Route: Fetch all users
app.get('/users', (req, res) => {
  try {
    const users = db.prepare('SELECT * FROM User').all();
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 📥 POST Route: Create a user (For Postman testing)
app.post('/users', (req, res) => {
  const { email, name } = req.body;
  
  if (!email) {
    return res.status(400).json({ error: "Email is required" });
  }

  try {
    const insert = db.prepare('INSERT INTO User (email, name) VALUES (?, ?)');
    const result = insert.run(email, name || null);
    
    res.status(201).json({
      message: "User created successfully!",
      userId: result.lastInsertRowid
    });
  } catch (error) {
    if (error.message.includes('UNIQUE constraint failed')) {
      return res.status(400).json({ error: "Email already exists" });
    }
    res.status(500).json({ error: error.message });
  }
});

// Mount specific routes
const cetRoutes = require('./routes/cet')(db);
app.use('/api/cet', cetRoutes);

// Start Server
const PORT = 8080;
app.listen(PORT, () => {
  console.log(`🚀 Server is flying safely on http://localhost:${PORT}`);
});
