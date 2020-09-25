const path = require('path');
const express = require('express');
const bodyParser = require('body-parser');
const routes = require('./routes');

// Constructor
const app = express();

// Setting bodyparser
app.use(bodyParser.urlencoded({ extended: true }));

// Setting views
app.set('views', path.join(__dirname, 'views'));
app.use(express.json());

// Setting statics
app.use('/', express.static(path.join(__dirname, 'public')));

// Setting routes
app.use('', routes);

//

module.exports = app;
