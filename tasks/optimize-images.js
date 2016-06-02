'use strict';

const fastpipe = require('fastpipe');
const gulpif = require('gulp-if');
const cache = require('gulp-cache');
const imagemin = require('gulp-imagemin');

module.exports = () => fastpipe()
  .pipe(gulpif('*.{svg,png,jpg,jpeg}', cache(imagemin({
    progressive: true,
    interlaced: true,
  }))));
