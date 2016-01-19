var gulp = require('gulp')
var babel = require('gulp-babel')

gulp.task('build', function () {
  return gulp.src('index.js')
    .pipe(babel())
    .pipe(gulp.dest('dist'))
})

gulp.task('copy', function () {
  return gulp.src('examples/*')
    .pipe(gulp.dest('dist'))
})

gulp.task('watch', function () {
  return gulp.watch(
    ['index.js', 'examples/*'],
    gulp.parallel('build', 'copy')
  )
})

gulp.task('default', gulp.parallel('build', 'copy'))
