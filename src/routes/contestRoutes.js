// src/routes/contestRoutes.js
const express = require('express');
const router = express.Router();
const { executeCode } = require('../controllers/contestController');
router.post('/execute', executeCode);

module.exports = router;
