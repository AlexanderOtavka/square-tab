'use strict';

const gulp = require('gulp');
const $ = require('require-dir')('tasks', { camelcase: true });
const runSequence = require('run-sequence');
const del = require('del');

gulp.task('default', ['build:dist']);

gulp.task('watch', ['build:dev'], () => {
  let copyPath = [
    srcPath(),
    `!${srcPath('styles')}`,
    `!${srcPath('elements')}`,
  ];

  gulp.watch(copyPath, ['copy:dev']);
  gulp.watch(srcPath('styles'), ['styles:dev']);
  gulp.watch(srcPath('elements'), ['elements:dev']);
});

gulp.task('build:dist', callback => {
  runSequence(
    'clean',
    ['copy:dist', 'styles:dist', 'elements:dist'],
    callback
  );
});

gulp.task('build:dev', callback => {
  runSequence(
    'clean',
    ['copy:dev', 'styles:dev', 'elements:dev'],
    callback
  );
});

gulp.task('copy:dev', () =>
  gulp.src([
    srcPath(),
    `!${srcPath('styles')}`,
    `!${srcPath('elements')}`,
  ])
    .pipe(dev())
);

gulp.task('styles:dev', () =>
  gulp.src(srcPath('styles'))
    .pipe($.postcss({ preserveVars: false }))
    .pipe(dev('styles'))
);

gulp.task('elements:dev', () =>
  gulp.src(srcPath('elements'))
    .pipe($.postcss({ preserveVars: false }))
    .pipe(dev('elements'))
);

gulp.task('copy:dist', () =>
  gulp.src([
    srcPath(),
    `!${srcPath('styles', '**')}`,
    `!${srcPath('elements', '**')}`,
  ])
    .pipe(dist())
);

gulp.task('styles:dist', () =>
  gulp.src(srcPath('styles'))
    .pipe($.postcss({ preserveVars: true }))
    .pipe(dist('styles'))
);

gulp.task('elements:dist', () =>
  gulp.src(srcPath('elements'))
    .pipe($.postcss({ preserveVars: true }))
    .pipe(dist('elements'))
);

gulp.task('clean', () => del(['dev/**/*', 'dist/**']));

function srcPath(path, files) {
  return path ? `src/${path}/${files || '**/*'}` : `src/${files || '**/*'}`;
}

function dev(path) {
  return gulp.dest(`dev/${path || ''}`);
}

function dist(path) {
  return gulp.dest(`dist/${path || ''}`);
}
