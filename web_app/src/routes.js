const express = require('express');

// Router endpoints
const index = require('./routes/index');
const api = require('./routes/api/index');
const css_js_injection = require('./routes/api/css_js_injection');

const router = express.Router();

router.use('/', index);
router.use('/api', api);
router.use('/css_js_injection', css_js_injection);

module.exports = router;
