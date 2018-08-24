'use strict';

const postcss = require('postcss');
const Processor = require('modular-css-core');
const usePlugin = require('./use-plugin');

function plugin(name, text, timeout) {
    return postcss.plugin(name, () => {
        return (css, result) => new Promise(resolve => setTimeout(() => {
            console.log(text);
            resolve();
        }, timeout));
    })();
}

function createPlugins() {
    return [
        plugin('plugin1', '1', 300),
        usePlugin({
            plugins: {
                plugin2: plugin('plugin2', '2', 500),
                plugin3: plugin('plugin3', '3', 100),
                plugin4: plugin('plugin4', '4', 200),
            },
        }),
    ];
}

async function runProcessor(processor) {
    await processor.string('a.css', `
        @use "plugin3";
        @use "plugin4";

        a {
          color: red;
        }
    `);

    await processor.string('b.css', `
        @use "plugin2";
        @use "plugin3";
        @use "plugin4";

        b {
          color: blue;
        }
    `);

    await processor.output();
}

(async () => {
    // before plugins
    await runProcessor(new Processor({
        verbose: true,
        rewrite: false,
        before: createPlugins(),
        processing: [],
        after: [],
        done: [],
    }));
    
    // after plugins
    await runProcessor(new Processor({
        verbose: true,
        rewrite: false,
        before: [],
        processing: [],
        after: createPlugins(),
        done: [],
    }));
})();
