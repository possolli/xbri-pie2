/*
    vite.config.js
*/

import { defineConfig } from 'vite';
import { createHtmlPlugin } from 'vite-plugin-html';
import lightningcss from 'vite-plugin-lightningcss';

export default defineConfig({
    root: "src",

    plugins: [
        lightningcss({
            browserslist: ['> 0.25%', 'last 2 versions', 'not dead', 'not IE <= 11', 'not op_mini all'],
            drafts: { nesting: true },
            include: "**/*.css",
            minify: true,
            cache: true,
            sourceMap: false
        }),

        createHtmlPlugin({
            minify: true
        })
    ],

    build: {
        sourcemap: false,
        minify: 'esbuild',
    },

    server: {
        port: 7070,
        open: true,
    }
});
