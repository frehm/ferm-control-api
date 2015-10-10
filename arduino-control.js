'use strict';

var events = require('events');
var serialport = require('serialport');

class ArduinoControl extends events.EventEmitter {

  constructor(serialOptions, controlOptions) {

    this.setpoint = controlOptions.setpoint || 19.5;
    this.kp = controlOptions.kp || 1500;
    this.ki = controlOptions.ki || 300;
    this.kd = controlOptions.kd || 50;

    this.serial = new serialport.SerialPort(serialOptions.serialPort, {
      baudrate: serialOptions.baudrate || 9600,
      dataBits: serialOptions.dataBits || 8,
      stopBits: serialOptions.stopBits || 1,
      parity: serialOptions.parity || 'none',
      buffersize: serialOptions.buffersize || 255,
      parser: serialport.parsers.readline('\n')
    }, false);

    let self = this;
    this.serial.on('data', function (line) {
      // line is string with utf-8 encoding

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
        console.log(' returned mode auto');
      }


    });

    //TODO: Also listen to error event from serialport factory since errors in SerialPort constructor won't be caught here
    this.serial.on('error', function (err) {
      console.log('serial error', err);
    });

  }

  connect(flushOnOpen) {
    let self = this;
    let p = new Promise(function (resolve, reject) {

      self.serial.open(function (err) {
        if (err) return reject(err);

        if (flushOnOpen) {
          self.serial.flush(function (flushErr) {

            if (flushErr) {
              resolve('port opened, but flush failed');
            } else {
              resolve('port opened and flushed');
            }

          });

        } else {
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
