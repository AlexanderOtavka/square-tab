'use strict';

const fastpipe = require('fastpipe');
const gulpif = require('gulp-if');
const useref = require('gulp-useref');

module.exports = () => fastpipe()
  .pipe(gulpif('*.html', useref({
    searchPath: 'node_modules',
  })));
