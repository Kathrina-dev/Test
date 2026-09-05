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
  const distance = R * c; // Distance in km
  return distance;
};

exports.verifyGuess = (req, res, db) => {
  const { locationID, lat, lng } = req.body;

  if (!locationID || typeof lat !== 'number' || typeof lng !== 'number') {
    return res.status(400).json({ error: "Missing or invalid locationID, lat, or lng" });
  }

  try {
    const row = db.prepare('SELECT lat, lng FROM ChallengeLocations WHERE locationID = ?').get(locationID);
    
    if (!row) {
      return res.status(404).json({ error: "Location challenge not found" });
    }

    const distance = calculateDistance(lat, lng, row.lat, row.lng);
    const thresholdKm = 50; // 50 km tolerance

    const correct = distance <= thresholdKm;

    return res.json({
      correct,
      distance: Math.round(distance), // in km
      message: correct ? "Location matched!" : "Location incorrect."
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};
