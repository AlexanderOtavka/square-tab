'use strict';

const gulp = require('gulp');
const $ = require('require-dir')('tasks', { camelcase: true });
const zip = require('gulp-zip');
const runSequence = require('run-sequence');
const del = require('del');

let devCopyPath = [
  srcPath(),
  `!${srcPath('styles')}`,
  `!${srcPath('elements')}`,
  `!${srcPath('views')}`,
];

let distCopyPath = [
  srcPath(),
  `!${srcPath('scripts')}`,
  `!${srcPath('styles')}`,
  `!${srcPath('elements')}`,
  `!${srcPath('views')}`,
];

// Primary Commands

gulp.task('default', ['build:dist']);

gulp.task('watch', ['build:dev'], () => {
  gulp.watch(devCopyPath, ['copy:dev']);
  gulp.watch(srcPath('styles'), ['styles:dev']);
  gulp.watch(srcPath('elements'), ['elements:dev']);
  gulp.watch(srcPath('views'), ['views:dev']);
});

gulp.task('pack', ['build:dist'], () =>
  gulp.src('dist/**')
    .pipe(zip('square-tab.zip'))
    .pipe(gulp.dest('.'))
);

// Dev build

gulp.task('build:dev', callback => {
  runSequence(
    'clean',
    ['copy:dev', 'styles:dev', 'elements:dev', 'views:dev'],
    callback
  );
});

gulp.task('copy:dev', () => gulp.src(devCopyPath).pipe(dev()));

gulp.task('styles:dev', () =>
  gulp.src(srcPath('styles'))
    .pipe($.postcss())
    .pipe(dev('styles'))
);

gulp.task('elements:dev', () =>
  gulp.src(srcPath('elements'))
    .pipe($.postcss())
    .pipe(dev('elements'))
);

gulp.task('views:dev', () =>
  gulp.src(srcPath('views'))
    .pipe($.useref())
    .pipe(dev('views'))
);

// Dist build

gulp.task('build:dist', callback => {
  runSequence(
    'clean',
    ['copy:dist', 'scripts:dist', 'styles:dist', 'elements:dist', 'views:dist'],
    callback
  );
});

gulp.task('copy:dist', () => gulp.src(distCopyPath).pipe(dist()));

gulp.task('scripts:dist', () =>
  gulp.src(srcPath('scripts'))
    .pipe($.babel())
    .pipe(dist('scripts'))
);

gulp.task('styles:dist', () =>
  gulp.src(srcPath('styles'))
    .pipe($.postcss())
    .pipe(dist('styles'))
);

gulp.task('elements:dist', () =>
  gulp.src(srcPath('elements'))
    .pipe($.postcss())
    .pipe($.babel())
    .pipe(dist('elements'))
);

gulp.task('views:dist', () =>
  gulp.src(srcPath('views'))
    .pipe($.useref())
    .pipe(dist('views'))
);

// Utility tasks/functions

gulp.task('clean', () => del(['dev/**/*', 'dist/**/*']));

function srcPath(path, files) {
  return path ? `src/${path}/${files || '**/*'}` : `src/${files || '**/*'}`;
}

function dev(path) {
  return gulp.dest(`dev/${path || ''}`);
}

function dist(path) {
  return gulp.dest(`dist/${path || ''}`);
}
