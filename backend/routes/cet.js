const express = require('express');
const cetController = require('../controllers/cetController');

module.exports = (db) => {
  const router = express.Router();

  router.post('/session', (req, res) => cetController.createSession(req, res, db));
  router.get('/session/:token', (req, res) => cetController.getSession(req, res, db));
  router.get('/challenge/:id', (req, res) => cetController.getChallenge(req, res, db));
  router.post('/verify', (req, res) => cetController.verifyGuess(req, res, db));

  return router;
};
