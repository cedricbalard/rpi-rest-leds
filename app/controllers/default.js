'use strict';

/**
 * Return the config  of rpio
 *
 * @param {Object} req current http request object
 * @param {Object} res current http response object
 * @param {Object} next next item to process
 */
exports.home = function (req, res, next) {

  this.get('logger').info('[ api ] - request incoming on : ' + req.url);
  next();
};
