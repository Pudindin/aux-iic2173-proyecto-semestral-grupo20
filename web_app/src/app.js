const path = require('path');
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const request = require('request');
const routes = require('./routes');

// Constructor
const app = express();

app.use(cors());
// Setting bodyparser
app.use(bodyParser.urlencoded({ extended: true }));

// Setting views
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.use(express.json());

// Setting statics
app.use('/', express.static(path.join(__dirname, 'public')));

// Setting a header
app.use((req, res, next) => {
  request('http://169.254.269.254/latest/meta-data/instance-id', (error, response, body) => {
    if (!error && response.statusCode == 200) {
      res.setHeader('EC2-instace-id', body);
    }
  });
  next();
});

// Setting routes
app.use('', routes);

// Setting redis
var redis = require('redis');
var client = redis.createClient('6379', '34.224.111.177');
client.on('connect', function() {
  console.log('REDIS connected !!!');
})
client.set('test1', 'value', function(err, reply) {
  console.log(reply);
});

module.exports = app;
