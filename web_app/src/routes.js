const express = require('express');

// Router endpoints
const index = require('./routes/index');
const api = require('./routes/api/index');
const css_injection_new = require('./routes/api/css_injection_new');

const router = express.Router();

router.use('/', index);
router.use('/api', api);
router.use('/css_injection_new', css_injection_new);

module.exports = router;
