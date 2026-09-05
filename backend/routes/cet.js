const express = require('express');
const cetController = require('../controllers/cetController');

module.exports = (db) => {
  const router = express.Router();
  
  router.post('/verify', (req, res) => cetController.verifyGuess(req, res, db));
  
  return router;
};
