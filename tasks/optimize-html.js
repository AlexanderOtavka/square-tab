'use strict';

const fastpipe = require('fastpipe');
const gulpif = require('gulp-if');
const htmlmin = require('gulp-htmlmin');

module.exports = () => fastpipe()
  .pipe(gulpif('*.html', htmlmin({
    collapseInlineTagWhitespace: true,
    collapseWhitespace: true,
  })));
