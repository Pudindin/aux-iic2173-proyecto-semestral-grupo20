const express = require('express');

const authApi = require('./auth');
const roomsApi = require('./rooms');
const messagesApi = require('./messages');

const router = express.Router();

// unauthenticated endpoints
router.use('/auth', authApi);
router.use('/rooms', roomsApi);
router.use('/messages', messagesApi);

module.exports = router;
