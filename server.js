'use strict';

var express = require('express');
var morgan = require('morgan');
var ArduinoControl = require('./arduino-control');
var app = express();

// /dev/ttyACM0
var arduino1 = new ArduinoControl({ serialPort: '/dev/ttyACM0'}); //TODO: Add to config file

app.use(morgan('dev'));

app.get('/connect', function (req, res) {

  arduino1.connect(true)
    .then(function (message) {

      res.json({
        success: true,
        message: message
      });

    })
    .catch(function (err) {

      res.json({
        success: false,
        message: 'Failed to open port',
        error: err
      });

    });

});

app.get('/disconnect', function (req, res) {

  arduino1.disconnect()
    .then(function (message) {

      res.json({
        success: true,
        message: message
      });

    })
    .catch(function (err) {

      res.json({
        success: false,
        message: 'Failed to close port',
        error: err
      });

    });

});

var server = app.listen(3100, function () {
  var host = server.address().address;
  var port = server.address().port;

  console.log('Api started at http://%s:%s', host, port);
});
