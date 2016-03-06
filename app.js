'use strict';

var logger    = require('yocto-logger');
var core      = require('yocto-core-stack');
var _         = require('lodash');

// set debug to true. Disabled it on production
core.debug = false;

// Init your app first
core.init().then(function () {
  // Init succeed start your app
  core.start().then(function () {

  /********************************************
   *              YOUR CODE HERE              *
   *******************************************/

    console.log('app started')

  }).catch(function (error) {
    // default error use core logger
    core.logger.error([ '[ CoreWrapper.start ] -', error ].join(' '));
    // exit
    process.exit(0);
  });
}).catch(function (error) {
  // default error use core logger
  core.logger.error([ '[ CoreWrapper.init ] -', error ].join(' '));
  // exit
  process.exit(0);
});
