'use strict';

var _       = require('lodash');
var utils   = require('yocto-utils');
var joi     = require('joi');
var rpio    = require('rpio');

/**
* Return the config  of rpio
*
* @param {Object} req current http request object
* @param {Object} res current http response object
* @param {Object} next next item to process
*/
exports.getConfig = function (req, res, next) {

  this.get('logger').debug('[ rpio.getConfig ] - retrieve config')

  // default response
  res.jsonp(this.rpioConfig || {});
};

/**
* Set standard value to gpio
*
* @param {Object} req current http request object
* @param {Object} res current http response object
* @param {Object} next next item to process
*/
exports.setStandard = function (req, res, next) {

  // joi validation
  var schema = joi.object().required().keys({
    pin       : joi.number().integer().required().valid([12, 19, 35, 35]),
    value     : joi.number().optional().min(0).max(100).default(100),
    delay     : joi.number().integer().optional().min(0).max(5000).default(1000),
  });

  // Made a joi validation
  var result = joi.validate(_.merge(req.params, req.body), schema);

  // Check if an error was occured
  if (!_.isEmpty(result.error)) {

    this.get('logger').error('[ rpio.setStandard ] - the joi validation failed, more details : ' +
    result.error.toString());

    return res.jsonp({
      status  : 'error',
      message : 'Error on request, data missing',
      data    : result.error
    });
  }

  // floor the value to increaze precision
  result.value.value = Math.floor(result.value.value * 10);

  // try to retrieve actual conf of pin
  var confPin = _.find(this.rpioConfig, {
    pin   : result.value.pin
  });

  // Check if conf is already set to change value of led with an cool effect
  if (!_.isUndefined(confPin) && !_.isUndefined(confPin.interval)) {
    clearInterval(confPin.interval);
  }

  var interval = {};

  // Check if conf is already set to change value of led with an cool effect
  if (!_.isUndefined(confPin) && confPin === 'standard') {

    // determine how the pin should be variate
    var direction = result.value.value <= confPin.value ? -1 : 1;

    // determine interval delay
    var inter = Math.floor(result.value.delay/Math.abs(result.value.value - confPin.value));

    clearInterval(confPin.interval);

    // set interval to change the value of the output slowly
    interval = setInterval(function () {

      // update value
      rpio.pwmSetData(result.value.pin, confPin.value);

      // check if the value of output correpond to the needed value
      if (confPin.value === result.value.value) {

        // clearInterval
        clearInterval(interval);
        return;
      }

      // increment the value
      confPin.value += direction;
    }, inter);

    this.get('logger').info('[ rpio.setStandard ] - The value of pin : ' + result.value.pin +
    ' was move from ' + confPin.value/10 + '% to ' + result.value.value/10 + '%');
  } else {

    // Enable PWM on the chosen pin and set the clock and range.
    rpio.open(result.value.pin, rpio.PWM);
    rpio.pwmSetClockDivider(32);
    rpio.pwmSetRange(result.value.pin, 1000);
    rpio.pwmSetData(result.value.pin, result.value.value);

    this.get('logger').info('[ rpio.setStandard ] - The value of pin : ' + result.value.pin +
    ' was moved to ' + result.value.value/10 + '%');
  }

  // update config
  updateConfig.apply(this, [ 'standard', result.value.pin, {
    interval  : interval,
    value     : result.value.value
  }]);

  // return the response
  return res.jsonp({
    status  : 'success',
    message : 'Value updated',
    data    : {}
  });
};

/**
* Set gpio to off
*
* @param {Object} req current http request object
* @param {Object} res current http response object
* @param {Object} next next item to process
*/
exports.setOff = function (req, res, next) {

  // joi validation
  var schema = joi.object().required().keys({
    pin   : joi.number().integer().required().valid([12, 19, 35, 35])
  });

  // Made a joi validation
  var result = joi.validate(_.merge(req.params, req.body), schema);

  // Check if an error was occured
  if (!_.isEmpty(result.error)) {

    this.get('logger').error('[ rpio.setOff ] - the joi validation failed, more details : ' +
    result.error.toString());

    return res.jsonp({
      status  : 'error',
      message : 'Error on request, data missing',
      data    : result.error
    });
  }

  // Update config
  updateConfig.apply(this, [ 'none', result.value.pin ]);

  // set pin to off
  rpio.open(result.value.pin, rpio.INPUT);

  this.get('logger').info('[ rpio.setOff ] - The value of pin : ' + result.value.pin +
  ' to OFF mode');

  return res.jsonp({
    status  : 'success',
    message : 'Value updated',
    data    : {}
  });
};

/**
* Set pulse mode
*
* @param {Object} req current http request object
* @param {Object} res current http response object
* @param {Object} next next item to process
*/
exports.setPulse = function (req, res, next) {

  // joi validation
  var schema = joi.object().required().keys({
    pin       : joi.number().integer().required().valid([12, 19, 35, 35]),
    valueMin  : joi.number().optional().min(0).max(100).default(1),
    valueMax  : joi.number().optional().min(0).max(100).default(100),
    delay     : joi.number().integer().optional().min(0).max(60000).default(1000),
    precision : joi.number().optional().min(1).max(1000).default(1)
  });

  // Made a joi validation
  var result = joi.validate(_.merge(req.params, req.body), schema);

  // Check if an error was occured
  if (!_.isEmpty(result.error)) {

    this.get('logger').error('[ rpio.setStandard ] - the joi validation failed, more details : ' +
    result.error.toString());

    return res.jsonp({
      status  : 'error',
      message : 'Error on request, data missing',
      data    : result.error
    });
  }

  // floor the value to increaze precision
  result.value.valueMin = Math.floor(result.value.valueMin * 10);
  result.value.valueMax = Math.floor(result.value.valueMax * 10);

  // try to retrieve actual conf of pin
  var confPin = _.find(this.rpioConfig, {
    pin   : result.value.pin,
    mode  : 'pulse'
  });

  var interval = {};

  // Check if conf is already set to change value of led with an cool effect
  if (!_.isUndefined(confPin) && !_.isUndefined(confPin.interval)) {
    clearInterval(confPin.interval);
  }

  // determine how the pin should be variate
  var direction = - result.value.precision;

  // determine interval delay
  var inter = Math.floor(result.value.delay / Math.abs(
    result.value.valueMax - result.value.valueMin
  )) * result.value.precision;

  var value = result.value.valueMax;

  // Enable PWM on the chosen pin and set the clock and range.
  rpio.open(result.value.pin, rpio.PWM);
  rpio.pwmSetClockDivider(32);
  rpio.pwmSetRange(result.value.pin, 1000);
  rpio.pwmSetData(result.value.pin, value);

  // set interval to change the value of the output slowly
  interval = setInterval(function () {

    // update value
    rpio.pwmSetData(result.value.pin, value);

    // check if the value of output correpond to the needed value
    if (value >= result.value.valueMax) {

      direction = - result.value.precision;
    } else if (value <= result.value.valueMin) {

      direction = result.value.precision;
    }

    // increment the value
    value += direction;
  }, inter);

  this.get('logger').info('[ rpio.setPulse ] - The pin mode of : ' + result.value.pin +
  ' was changed to pulse delay : ' + result.value.delay);

  // update config
  updateConfig.apply(this, [ 'pulse', result.value.pin, {
    interval  : interval,
    delay     : result.value.delay,
    valueMax  : result.value.valueMax,
    valueMin  : result.value.valueMin
  }]);

  // return the response
  return res.jsonp({
    status  : 'success',
    message : 'Value updated',
    data    : {}
  });
};

/**
* Update config file
*
* @param  {[type]} mode   [description]
* @param  {[type]} result [description]
* @return {[type]}        [description]
*/
var updateConfig = function (mode, pin, optionalData) {

  optionalData = optionalData || {};

  // default config
  var config =   _.merge({
    mode  : mode,
    pin   : pin
  }, optionalData);

  // check if config object is set
  if (_.isUndefined(this.rpioConfig)) {

    // set config
    this.rpioConfig = [
      config
    ];
  } else {

    // Read all items in array and remove the config for pin
    this.rpioConfig = _.compact(_.map(this.rpioConfig, function (item) {

      // check if new pin equals to pin of item
      if (item.pin !== pin) {

        return item;
      }
    }));

    // add the new config for this pin
    this.rpioConfig.push(config);
  }
};
