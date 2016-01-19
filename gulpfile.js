var gulp = require('gulp')
var sass = require('gulp-sass')
var babel = require('gulp-babel')

gulp.task('script', function () {
  return gulp.src('src/index.js')
    .pipe(babel())
    .pipe(gulp.dest('dist'))
})

gulp.task('sass', function () {
  return gulp.src('src/index.sass')
    .pipe(sass({outputStyle: 'compact'}))
    .pipe(gulp.dest('dist'))
})

gulp.task('examples', function () {
  return gulp.src('examples/*')
    .pipe(gulp.dest('dist'))
})

gulp.task('watch', function () {
  return gulp.watch(
    ['src/*', 'examples/*'],
    gulp.parallel('script', 'sass', 'examples')
  )
})

gulp.task('build', gulp.parallel('script', 'sass', 'examples'))
gulp.task('default', gulp.parallel('build'))
