const express = require('express');

// Router endpoints
const index = require('./routes/index');
const api = require('./routes/api/index');

const router = express.Router();

router.use('/', index);
router.use('/api', api);

module.exports = router;
