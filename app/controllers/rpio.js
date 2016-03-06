'use strict';

var _       = require('lodash');
var utils   = require('yocto-utils');

/**
 * Default get session for current app
 * @param {Object} req current http request object
 * @param {Object} res current http response object
 * @param {Object} next next item to process
 */
exports.test = function (req, res, next) {


  // default response
  res.jsonp({
    value : 'success'
  });
};
