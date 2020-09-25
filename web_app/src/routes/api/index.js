const express = require('express');

const authApi = require('./auth');

const router = express.Router();

// unauthenticated endpoints
router.use('/auth', authApi);

module.exports = router;
