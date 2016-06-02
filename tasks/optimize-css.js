'use strict';

const fastpipe = require('fastpipe');
const gulpif = require('gulp-if');
const htmlPostcss = require('gulp-html-postcss');
const postcss = require('gulp-postcss');
const postcssCssnano = require('cssnano');
const postcssCssVariables = require('postcss-css-variables');

let plugins = [
  postcssCssnano(),
  postcssCssVariables({
    preserve: true,
  }),
];

module.exports = () => fastpipe()
  .pipe(gulpif('**/*.html', htmlPostcss(plugins)))
  .pipe(gulpif('**/*.css', postcss(plugins)));
