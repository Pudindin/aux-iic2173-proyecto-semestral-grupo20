const express = require('express');

const authApi = require('./auth');
const roomsApi = require('./rooms');

const router = express.Router();

// unauthenticated endpoints
router.use('/auth', authApi);
router.use('/rooms', roomsApi);

module.exports = router;
