'use strict';

const combine = require('stream-combiner');
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

  return combine(
    gulpif('**/*.html', htmlPostcss(plugins())),
    gulpif('**/*.css', postcss(plugins()))
  );
};
