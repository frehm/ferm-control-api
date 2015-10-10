'use strict';

var express = require('express');
var morgan = require('morgan');
var app = express();

app.use(morgan('dev'));

app.get('/', function (req, res) {

  res.json({
    success: true,
    message: 'This api does nothing!'
  });

});

var server = app.listen(3100, function () {
  var host = server.address().address;
  var port = server.address().port;

  console.log('Api started at http://%s:%s', host, port);
});
