'use strict';

const fastpipe = require('fastpipe');
const gulpif = require('gulp-if');
const htmlPostcss = require('gulp-html-postcss');
const postcss = require('gulp-postcss');
const postcssImport = require('postcss-import');
const postcssAutoprefixer = require('autoprefixer');
const postcssCssVariables = require('postcss-css-variables');

module.exports = config => {
  let plugins = () => [
    postcssImport({
      path: ['src'],
    }),
    postcssAutoprefixer({
      // First version with native webcomponents
      browsers: ['Chrome >= 36'],
    }),
    postcssCssVariables({
      preserve: config.preserveVars,
    }),
  ];

  return fastpipe()
    .pipe(gulpif('**/*.html', htmlPostcss(plugins())))
    .pipe(gulpif('**/*.css', postcss(plugins())));
};
