const express = require('express');

// Router endpoints
const index = require('./routes/index');

const router = express.Router();

router.use('/', index);

module.exports = router;
