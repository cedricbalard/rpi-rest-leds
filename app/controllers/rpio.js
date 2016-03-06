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
    pin   : joi.number().integer().required().valid([12, 19, 35, 35]),
    value : joi.number().integer().optional().min(0).max(100).default(100)
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

  // update config
  updateConfig.apply(this, [ 'standard', result.value ]);

  // Enable PWM on the chosen pin and set the clock and range.
  rpio.open(result.value.pin, rpio.PWM);
  rpio.pwmSetClockDivider(32);
  rpio.pwmSetRange(result.value.pin, 100);
  rpio.pwmSetData(result.value.pin, result.value.value);

  this.get('logger').info('[ rpio.setStandard ] - The value of pin : ' + result.value.pin +
  ' to ' + result.value.value + '%');
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
    pin   : joi.number().integer().required().valid([12, 19, 35, 35]),
    value : joi.number().integer().optional().valid(0).default(0)
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
  updateConfig.apply(this, [ 'none', result.value ]);

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
 * Update config file
 *
 * @param  {[type]} mode   [description]
 * @param  {[type]} result [description]
 * @return {[type]}        [description]
 */
var updateConfig = function (mode, result) {

  // default config
  var config =   {
    mode  : 'standard',
    value : result.value,
    pin   : result.pin
  };

  if (_.isUndefined(this.rpioConfig)) {

    this.rpioConfig = [
      config
    ];
  } else {

    this.rpioConfig = _.compact(_.map(this.rpioConfig, function (item) {

      if (item.pin !== result.pin) {

        return item;
      }
    }));

    this.rpioConfig.push(config);
  }
};
