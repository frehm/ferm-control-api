'use strict';

var events = require('events');
var serialport = require('serialport');

class ArduinoControl extends events.EventEmitter {

  constructor(serialOptions, controlOptions) {
    super();
    if (typeof controlOptions === 'undefined') { controlOptions = { }; }
    this.setpoint = controlOptions.setpoint || 19.5;
    this.kp = controlOptions.kp || 1500;
    this.ki = controlOptions.ki || 300;
    this.kd = controlOptions.kd || 50;

    this.serialOptions = serialOptions || { };
    this.serialOptions.baudrate = this.serialOptions.baudrate || 9600;
    this.serialOptions.dataBits = this.serialOptions.dataBits || 8;
    this.serialOptions.stopBits = this.serialOptions.stopBits || 1;
    this.serialOptions.parity = this.serialOptions.parity || 'none';
    this.serialOptions.buffersize = this.serialOptions.buffersize || 255;

    this.serial = null;
  }

  _serialData(line) {
    // line is string with utf-8 encoding
    var self = this;
    var timestamp = new Date();
    console.log(timestamp.toLocaleTimeString() + ' - ' + line);

    // check if incoming data is command from arduino
    // respond with data if it is
    //TODO: Should probably wait for the response from the arduino that it actually got the response
    //TODO: Adding crc checks to lines is probably also a good idea
    if (line.startsWith('?SP')) {

      let response = 'SP' + self.setpoint.toFixed(1).replace('.', '') + '\n';
      self.serial.write(response);
      console.log(' returned setpoint: ' + response);

    } else if (line.startsWith('?PID')) {

      let response = 'PID' + self.kp + ';' + self.ki + ';' + self.kd + '\n';
      self.serial.write(response);
      console.log(' returned pid params: ' + response);

    } else if (line.startsWith('?MODE')) {

      let response = 'MODEA\n';
      self.serial.write(response);
      console.log(' returned mode ' + response);
    }
  }

  //TODO: Also listen to error event from serialport factory since errors in SerialPort constructor won't be caught here
  _serialError(err) {
    console.log('serial error', err);
  }

  _serialClose() {
    console.log('port closed');
    this.serial = null;
  }

  connect(flushOnOpen) {
    let self = this;

    this.serial = new serialport.SerialPort(this.serialOptions.serialPort, {
      baudrate: this.serialOptions.baudrate,
      dataBits: this.serialOptions.dataBits,
      stopBits: this.serialOptions.stopBits,
      parity: this.serialOptions.parity,
      buffersize: this.serialOptions.buffersize,
      parser: serialport.parsers.readline('\n')
    }, false);

    let p = new Promise(function (resolve, reject) {

      self.serial.open(function (err) {
        if (err) return reject(err);


        self.serial.on('error', self._serialError.bind(self));
        self.serial.on('close', self._serialClose.bind(self));

        if (flushOnOpen) {
          self.serial.flush(function (flushErr) {

            self.serial.on('data', self._serialData.bind(self));

            if (flushErr) {
              resolve('port opened, but flush failed');
            } else {
              resolve('port opened and flushed');
            }

          });

        } else {
          self.serial.on('data', self._serialData.bind(self));
          resolve('port opened');
        }

      });
    });

    return p;
  }

  disconnect() {
    let self = this;
    let p = new Promise(function (resolve, reject) {

      self.serial.close(function (err) {
        if (err) return reject(err);

        resolve('port closed');

      });
    });

    return p;
  }

}

module.exports = ArduinoControl;
