'use strict';

const fastpipe = require('fastpipe');
const gulpif = require('gulp-if');
const babel = require('gulp-babel');

module.exports = () => fastpipe()
  .pipe(gulpif('*.js', babel({
    presets: ['es2015'],
  })));
