import gulp from 'gulp';
import webp from 'gulp-webp';
import autoprefixer from "gulp-autoprefixer";
import removeComments from "gulp-strip-css-comments";
import gulpSass from 'gulp-sass';
import * as sassCompiler from 'sass';
import cssnano from "gulp-cssnano";
import uglify from "gulp-uglify";
import panini from "panini";
import del from "del";
import webpackStream from "webpack-stream";
import browserSync from "browser-sync";
import ttf2woff2 from 'gulp-ttf2woff2';
import svgSprite from "gulp-svg-sprite";
import { glob, globSync, globStream, globStreamSync, Glob } from "glob";
import avif from 'gulp-avif';
import plumber from 'gulp-plumber';
import notify from 'gulp-notify';
import imagemin from 'gulp-imagemin'; // Импортируем оптимизатор изображений
import mozjpeg from 'imagemin-mozjpeg'; // Импортируем плагин для jpeg
import optipng from 'imagemin-optipng'; // Импортируем плагин для png
import svgo from 'imagemin-svgo'; // Импортируем плагин для svg
/* Установка компилятора для gulp-sass */
const sass = gulpSass(sassCompiler);
// Путь для исходных и выходных данных
const srcPath = 'src/';
const distPath = 'dist/';

// Структура путей
const path = {
    build: {
        html: distPath, // Путь для HTML-файлов
        js: distPath + "assets/js/", // Путь для JavaScript
        css: distPath + "assets/css/", // Путь для CSS
        images: distPath + "assets/images/", // Путь для изображений
        fonts: distPath + "assets/fonts/" // Путь для шрифтов
    },
    src: {
        html: srcPath + "*.html", // Исходные HTML файлы
        js: srcPath + "assets/js/*.js", // Исходные JavaScript файлы
        css: srcPath + "assets/scss/*.scss", // Исходные SCSS файлы
        images: srcPath + "assets/images/**/*.{jpg,png,gif,ico,webp,webmanifest,xml,json}", // Все изображения
        imagesnosvg: [ // Все изображения, кроме SVG
            srcPath + "assets/images/**/*.{jpg,png,gif,ico,webp,webmanifest,xml,json}",
            `!${srcPath}assets/images/**/*.svg` // Исключаем SVG
        ],
        imagesnosvgandwebp: [ // Все изображения, кроме SVG
            srcPath + "assets/images/**/*.{jpg,png,gif,ico,webp,webmanifest,xml,json}",
            `!${srcPath}assets/images/**/*.svg`, `!${srcPath}assets/images/**/*.webp` // Исключаем SVG
        ],
        imagessvg: srcPath + "assets/images/**/*.svg", // SVG изображения
        fonts: srcPath + "assets/fonts/**/*.{eot,woff,woff2,ttf}" // Шрифты
    },
    watch: {
        html: srcPath + "**/*.html", // Наблюдение за HTML файлами
        js: srcPath + "assets/js/**/*.js", // Наблюдение за JavaScript файлами
        css: srcPath + "assets/scss/**/*.scss", // Наблюдение за SCSS файлами
        images: srcPath + "assets/images/**/*.{jpg,png,svg,gif,ico,webp,webmanifest,xml,json}", // Наблюдение за изображениями всех форматов
        imagesnosvg: [ // Наблюдение за изображениями, исключая SVG
            srcPath + "assets/images/**/*.{jpg,png,gif,ico,webp,webmanifest,xml,json}",
            `!${srcPath}assets/images/**/*.svg`
        ],
        imagesnosvgandwebp: [ // Все изображения, кроме SVG
            srcPath + "assets/images/**/*.{jpg,png,gif,ico,webp,webmanifest,xml,json}",
            `!${srcPath}assets/images/**/*.svg`, `!${srcPath}assets/images/**/*.webp` // Исключаем SVG
        ],
        imagessvg: distPath + "assets/images/**/*.svg", // Наблюдение за SVG изображениями в папке dist
        fonts: srcPath + "assets/fonts/**/*.{eot,woff,woff2,ttf}" // Наблюдение за шрифтами
    },
    clean: distPath // Путь для очистки dist
};

// Сервер разработки
gulp.task('serve', () => {
    browserSync.init({
        server: {
            baseDir: "./" + distPath // Устанавливаем базовую директорию для сервера
        }
    });
});

// Сборка HTML с использованием Panini
gulp.task('html', () => {
    panini.refresh(); // Сбрасываем кеш Panini (или используем panini.reset(), если версия устаревшая)
    return gulp.src(path.src.html, { base: srcPath }) // Путь к HTML-файлам
        .pipe(plumber({
            errorHandler: notify.onError({
                title: "HTML Error",
                message: "Error: <%= error.message %>"
            })
        }))
        .pipe(panini({
            root: srcPath,                     // Указываем корень src, где хранятся страницы
            layouts: srcPath + 'layouts/',     // Папка с лэйаутами
            partials: srcPath + 'partials/',   // Папка с частями
            helpers: srcPath + 'helpers/',     // Папка с хелперами
            data: srcPath + 'data/'            // Папка с данными
        }))
        .pipe(gulp.dest(path.build.html)) // Путь для сборки HTML
        .pipe(browserSync.stream()); // Автообновление браузера
});

gulp.task('htmlWatch', () => {
    gulp.watch(path.watch.html, gulp.series('html')); // Следит за изменениями в HTML-файлах
});

// css
function processCss(srcPath, destPath, reload = false) {
    return gulp.src(srcPath, { base: srcPath })
        .pipe(plumber({
            errorHandler: function (err) {
                notify.onError({
                    title: "SCSS Error",
                    message: "Error: <%= error.message %>"
                })(err);
                this.emit('end');
            }
        }))
        .pipe(sass({
            includePaths: ['./node_modules/']
        }).on('error', sass.logError))
        .pipe(autoprefixer({
            cascade: true
        }))
        .pipe(cssnano({
            zindex: false,
            discardComments: {
                removeAll: true
            }
        }))
        .pipe(removeComments())
        .pipe(gulp.dest(destPath)) // Путь для сохранения
        .pipe(reload ? browserSync.stream() : plumber.stop());
}

gulp.task('css', (cb) => {
    // Убедитесь, что путь к директории css указан правильно
    processCss(path.src.css, path.build.css + '/css', true); // Указываем, чтобы файлы попадали в assets/css
    cb();
});

gulp.task('cssWatch', () => {
    gulp.watch(path.watch.css, gulp.series('css'));
});


function getEntryPoints() {
    const entries = {};
    const files = glob.sync(path.src.js);

    if (!files.length) {
        console.error('No JS files found in ./src/assets/js/');
    } else {
        files.forEach(file => {
            const normalizedFile = file.replace(/\\/g, '/'); // Приведение путей к Unix-формату
            const match = normalizedFile.match(/\/([^/]+)\.js$/);
            if (match) {
                const name = match[1];
                // Добавляем './' перед путём
                entries[name] = `./${normalizedFile}`;
            } else {
                console.warn('File does not match expected format:', file);
            }
        });
    }

    return entries;
}

// Задача для обработки JavaScript файлов
gulp.task('js', (cb) => {
    const entries = getEntryPoints();

    return gulp.src(path.src.js, { base: srcPath + './assets/js/' })
        .pipe(plumber({
            errorHandler: function (err) {
                notify.onError({
                    title: "JS Error",
                    message: "Error: <%= error.message %>"
                })(err);
                this.emit('end');
            }
        }))
        .pipe(webpackStream({
            mode: "development",
            entry: entries,
            output: {
                filename: '[name].js',
            },
            optimization: {
                splitChunks: {
                    chunks: 'all',
                    name: 'common',
                },
            },
        }))
        .pipe(uglify())
        .pipe(gulp.dest(path.build.js))
        .pipe(browserSync.reload({ stream: true }));

    cb();
});

// Задача для наблюдения за изменениями JavaScript файлов
gulp.task('jsWatch', gulp.series('js', (cb) => {
    gulp.watch(path.watch.js, gulp.series('js'));
    cb();
}));


// Задача для оптимизации изображений
gulp.task('imagesOptimize', () => {
    return gulp.src(path.src.imagesnosvg)
        .pipe(imagemin([
            mozjpeg({ quality: 75, progressive: true }), // Используем плагин mozjpeg для оптимизации jpg
            optipng({ optimizationLevel: 3 }), // Оптимизация png
            svgo() // Оптимизация svg
        ]))
        .pipe(gulp.dest(path.build.images)); // Сохраняем в папку dist/images
});

gulp.task('imagesOptimizeWatch', gulp.series('imagesOptimize', (cb) => {
    gulp.watch(path.watch.imagesnosvg, gulp.series('imagesOptimize'));
    cb();  
}));

// Задача для конвертации изображений в WebP
gulp.task('imagesWebp', () => {
    return gulp.src(path.src.imagesnosvg) // Исключаем SVG
        .pipe(webp())
        .pipe(gulp.dest(path.build.images)); // Сохраняем в папку dist/images
});

gulp.task('imagesWebpWatch', gulp.series('imagesWebp',(cb) => {
    gulp.watch(path.watch.imagesnosvg, gulp.series('imagesWebp'));
    cb();
}));

// Задача для конвертации изображений в AVIF
gulp.task('imagesAvif', () => {
    return gulp.src(path.src.imagesnosvgandwebp) // Используем только JPG и PNG
        .pipe(plumber({
            errorHandler: notify.onError({
                title: "Image AVIF Error",
                message: "Error: <%= error.message %>"
            })
        }))
        .pipe(avif())
        .pipe(gulp.dest(path.build.images)); // Сохраняем в папку dist/images
});

gulp.task('imagesAvifWatch', gulp.series('imagesAvif', (cb) => {
    gulp.watch(path.watch.imagesnosvgandwebp, gulp.series('imagesAvif'));
    cb();
}));

gulp.task('sprite', () => {
    return gulp.src(path.src.imagessvg)
        .pipe(svgSprite({
            mode: {
                stack: {
                    sprite: '../sprite.svg',
                    example: false
                }
            }
        }))
        .pipe(gulp.dest(path.build.images));
});

gulp.task('spriteWatch', gulp.series('sprite', (cb) => {
    gulp.watch(path.watch.imagessvg, gulp.series('sprite'));
    cb();
}));

gulp.task('fonts', () => {
    return gulp.src(path.src.fonts, {
        encoding: false, // Important!
        removeBOM: false,
    })
        .pipe(ttf2woff2())  // Преобразование шрифтов в woff2
        .pipe(gulp.dest(path.build.fonts))  // Путь для сохранения шрифтов
        .pipe(browserSync.reload({ stream: true }));  // Обновление браузера
});

gulp.task('fontsWatch', gulp.series('fonts', (cb) => {
    gulp.watch(path.watch.fonts, gulp.series('fonts'));
    cb();
}));

gulp.task('clean', (cb) => {
    return del(path.clean);

    cb();
});

// Основная задача
gulp.task('default', 
    gulp.series(
      'clean',               // Очистка
      'html',                // HTML
      'css',                 // CSS
      'js',                  // JS
      'fonts',               // Шрифты
    //   'sprite',              // Спрайты
      gulp.parallel(         // Параллельно
        'imagesOptimize',     // Оптимизация изображений
        'imagesWebp',         // Конвертация в WebP
        'imagesAvif'          // Конвертация в AVIF
      ),
      gulp.parallel(         
        'cssWatch',           
        'jsWatch', 
        'htmlWatch',            
        'imagesOptimizeWatch',            
        'imagesWebpWatch',            
        'imagesAvifWatch',            
        // 'spriteWatch',            
        'fontsWatch',            
        'serve'              
      )
    )
  );
  