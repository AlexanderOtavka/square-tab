'use strict';

const fastpipe = require('fastpipe');
const gulpif = require('gulp-if');
const unassert = require('gulp-unassert');
const uglify = require('gulp-uglify');

module.exports = () => fastpipe()
  .pipe(gulpif('*.js', fastpipe()
    .pipe(unassert())
    .pipe(uglify())
  ));
