import { visualizer } from 'rollup-plugin-visualizer';
import tailwindcss from 'tailwindcss';
import { defineConfig } from 'vite';
import compression from 'vite-plugin-compression';
import { createHtmlPlugin } from 'vite-plugin-html';
import { ViteImageOptimizer } from 'vite-plugin-image-optimizer';
import inspect from 'vite-plugin-inspect';

// Assert the correct callable signature.
// Either cast it to any or to a known function type.
const compressionPlugin = compression as unknown as (options?: {
    algorithm?: string;
    ext?: string;
    deleteOriginFile?: boolean;
    threshold?: number;
    compressionOptions?: Record<string, unknown>;
    filter?: RegExp;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
}) => any;

export default defineConfig(({ mode }) => ({
    // Base public path - update if deploying to a subdirectory.
    base: '/',

    // Development server configuration.
    server: {
        port: 3000,
        open: true,
        cors: true,
        hmr: {
            overlay: true
        }
    },

    // Production build configuration.
    build: {
        outDir: 'dist',

        // CommonJS dependencies optimization.
        commonjsOptions: {
            include: []
        },

        // Code minification settings.
        minify: 'terser',
        terserOptions: {
            compress: {
                // eslint-disable-next-line @typescript-eslint/naming-convention
                drop_console: true,

                // eslint-disable-next-line @typescript-eslint/naming-convention
                drop_debugger: true
            }
        },

        // Chunk splitting configuration.
        rollupOptions: {
            output: {
                // Remove manual chunks if not needed, or configure properly.
                chunkFileNames: 'assets/[name]-[hash].js',
                entryFileNames: 'assets/[name]-[hash].js',
                assetFileNames: 'assets/[name]-[hash][extname]'

                // Only keep manualChunks if you really need custom chunk splitting.
                // manualChunks: (id: string) => {
                //     if (id.includes('node_modules')) {
                //         return 'vendor';
                //     }
                // }
            }
        },

        sourcemap: false,
        reportCompressedSize: true
    },

    // Dependency optimization.
    optimizeDeps: {
        include: []
    },

    // Asset handling.
    assetsInclude: ['**/*.svg'],

    // CSS configuration.
    css: {
        modules: {
            localsConvention: 'camelCase'
        },
        devSourcemap: true
    },

    // Plugin configuration.
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    plugins: [
        tailwindcss(),

        // Development inspection tool (available at /__inspect/).
        mode === 'development' &&
            inspect({
                build: true,
                outputDir: '.inspect'
            }),

        // Image and SVG optimization.
        ViteImageOptimizer({
            test: /\.(?<imageExt>jpe?g|png|gif|tiff|webp|svg|avif)$/i,

            includePublic: true,
            logStats: true,
            svg: {
                multipass: true,
                plugins: [
                    {
                        name: 'preset-default',
                        params: {
                            overrides: {
                                removeViewBox: false,
                                cleanupNumericValues: false,
                                cleanupIds: false,
                                convertPathData: false
                            }
                        }
                    },
                    'sortAttrs',
                    {
                        name: 'addAttributesToSVGElement',
                        params: {
                            attributes: [{ xmlns: 'http://www.w3.org/2000/svg' }]
                        }
                    }
                ]
            },

            // Image quality settings.
            png: { quality: 85 },
            jpeg: { quality: 85 },
            jpg: { quality: 85 },
            webp: {
                lossless: false,
                quality: 85
            }
        }),

        // Brotli compression for text-based assets and fonts.
        compressionPlugin({
            algorithm: 'brotliCompress',
            ext: '.br',
            deleteOriginFile: false,
            threshold: 10240,
            compressionOptions: { level: 11 },
            filter: /\.(?<imageExt>js|mjs|json|css|html|svg|woff2)$/i
        }),

        // Gzip compression (fallback for browsers without Brotli support).
        compressionPlugin({
            algorithm: 'gzip',
            ext: '.gz',
            deleteOriginFile: false,
            threshold: 10240,
            compressionOptions: { level: 9 },
            filter: /\.(?<imageExt>js|mjs|json|css|html|svg|woff2)$/i
        }),

        // Bundle analysis (generates .stats/stats.html in analyze mode).
        mode === 'analyze' &&
            // eslint-disable-next-line @typescript-eslint/no-unsafe-call
            visualizer({
                open: true,
                gzipSize: true,
                brotliSize: true,
                filename: '.stats/stats.html'
            })(),

        createHtmlPlugin({
            entry: '/src/main.ts',
            inject: {
                data: {
                    title: 'A tool for inspecting, formatting, and visualizing SDG JSONL files',
                    injectScript: `<script src="./inject.js"></script>`
                }
            },
            minify: {
                collapseWhitespace: true,
                removeComments: true,
                removeRedundantAttributes: true,
                removeScriptTypeAttributes: true,
                removeStyleLinkTypeAttributes: true,
                useShortDoctype: true,
                minifyCSS: true,
                minifyJS: true,
                minifyURLs: true,
                removeEmptyAttributes: true,
                removeOptionalTags: true,
                sortAttributes: true,
                sortClassName: true
            }
        })
    ].filter(Boolean) // remove false values from plugins array
}));
