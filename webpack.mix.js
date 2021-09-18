const path = require('path');
const mix = require('laravel-mix');

// Specify an alias for the location of the KSP lib for easier includes
mix.webpackConfig({
    resolve: {
        alias: {
            'KSP': path.resolve(__dirname, '../ts-ksp/lib')
        }
    }
});

mix.setPublicPath('public');
mix.ts('src/app.ts', 'js');
mix.js('src/porkchop-worker.js', 'js');
mix.js('src/slingshot-porkchop-worker.js', 'js');
mix.vue({version: 3});
mix.sass('sass/app.scss', 'css');
