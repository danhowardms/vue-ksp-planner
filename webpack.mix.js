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
mix.js('src/app.js', 'js');
mix.js('src/porkchop-worker.js', 'js');
mix.vue();
mix.sass('sass/app.scss', 'css');
