const crypto = require('crypto');

// --- Challenge configuration ---------------------------------------------
const SESSION_DURATION_MS = 30 * 60 * 1000; // 30 minute session window
const THRESHOLD_KM = 0.1; // 100 meters tolerance for a correct guess
// Final reward, only released once every challenge is solved within a session.
const FINAL_FLAG = 'ENTRE{O51NT_5ens3s_4re_t1ngl1ng}';

const calculateDistance = (lat1, lon1, lat2, lon2) => {
  // Haversine formula
  const R = 6371; // Radius of the Earth in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // Distance in km
};

// The set of location IDs a player must solve (place1..place9). This GLOB
// deliberately excludes helper/typo rows like `target-1` or `plave1`.
const requiredChallengeIds = (db) =>
  db.prepare("SELECT locationID FROM ChallengeLocations WHERE locationID GLOB 'place[0-9]' ORDER BY locationID")
    .all()
    .map((r) => r.locationID);

const readToken = (req) =>
  req.headers['x-session-token'] || (req.body && req.body.sessionToken) || req.params.token || null;

const loadSession = (db, token) => {
  if (!token) return null;
  return db.prepare('SELECT token, createdAt, expiresAt, solved FROM Sessions WHERE token = ?').get(token) || null;
};

const sessionSnapshot = (db, session, now) => {
  const required = requiredChallengeIds(db);
  const solved = JSON.parse(session.solved || '[]');
  const expired = now > session.expiresAt;
  const complete = required.length > 0 && required.every((id) => solved.includes(id));
  return {
    solved,
    total: required.length,
    remainingMs: Math.max(0, session.expiresAt - now),
    expiresAt: session.expiresAt,
    expired,
    complete,
    flag: complete && !expired ? FINAL_FLAG : null,
  };
};

// POST /api/cet/session -> start a fresh 30 minute session
exports.createSession = (req, res, db) => {
  try {
    const token = crypto.randomBytes(24).toString('hex');
    const now = Date.now();
    const expiresAt = now + SESSION_DURATION_MS;
    db.prepare('INSERT INTO Sessions (token, createdAt, expiresAt, solved) VALUES (?, ?, ?, ?)')
      .run(token, now, expiresAt, '[]');
    return res.status(201).json({
      token,
      expiresAt,
      durationMs: SESSION_DURATION_MS,
      total: requiredChallengeIds(db).length,
      solved: [],
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

// GET /api/cet/session/:token -> current progress + timer
exports.getSession = (req, res, db) => {
  try {
    const session = loadSession(db, readToken(req));
    if (!session) return res.status(404).json({ error: 'Session not found' });
    return res.json(sessionSnapshot(db, session, Date.now()));
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

// GET /api/cet/challenge/:id -> image for a challenge location
exports.getChallenge = (req, res, db) => {
  const { id } = req.params;
  try {
    const row = db.prepare('SELECT image FROM ChallengeLocations WHERE locationID = ?').get(id);
    if (!row) return res.status(404).json({ error: 'Challenge not found' });
    return res.json({ id, image: row.image });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

// POST /api/cet/verify -> check a guess and record progress on the session
exports.verifyGuess = (req, res, db) => {
  const { locationID, lat, lng } = req.body;

  if (!locationID || typeof lat !== 'number' || typeof lng !== 'number') {
    return res.status(400).json({ error: 'Missing or invalid locationID, lat, or lng' });
  }

  try {
    const session = loadSession(db, readToken(req));
    if (!session) return res.status(401).json({ error: 'No active session', needsSession: true });

    const now = Date.now();
    if (now > session.expiresAt) {
      return res.status(410).json({ error: 'Session expired', expired: true });
    }

    const row = db.prepare('SELECT lat, lng FROM ChallengeLocations WHERE locationID = ?').get(locationID);
    if (!row) return res.status(404).json({ error: 'Location challenge not found' });

    const distance = calculateDistance(lat, lng, row.lat, row.lng);
    const correct = distance <= THRESHOLD_KM;

    // Record newly solved challenges against the session.
    const solved = JSON.parse(session.solved || '[]');
    if (correct && !solved.includes(locationID)) {
      solved.push(locationID);
      db.prepare('UPDATE Sessions SET solved = ? WHERE token = ?').run(JSON.stringify(solved), session.token);
    }

    const required = requiredChallengeIds(db);
    const complete = required.length > 0 && required.every((id) => solved.includes(id));

    // Deliberately omit `distance` from the response: returning it would turn
    // this endpoint into a distance oracle that lets players trilaterate the
    // answer without ever identifying the location.
    return res.json({
      correct,
      solved,
      total: required.length,
      remainingMs: Math.max(0, session.expiresAt - now),
      complete,
      // The flag is only ever released once the whole set is solved.
      flag: complete ? FINAL_FLAG : null,
      message: correct ? 'Location matched!' : 'Location incorrect.',
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};
