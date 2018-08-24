'use strict';

const postcss = require('postcss');

module.exports = postcss.plugin('use', (opts = {}) => {
    const {
        plugins,
    } = opts;

    function findPluginById(name) {
        return plugins[Object.keys(plugins).filter(p => {
            return name === p;
        })[0]];
    }

    return (css, result) => {
        const originalPlugins = result.processor.plugins.slice();
        const contextPlugins = [];

        css.walkAtRules('use', rule => {
            const pluginId = String(rule.params).replace(/^[\s\uFEFF\xA0'"]+|[\s\uFEFF\xA0'"]+$/g, '');

            let plugin = findPluginById(pluginId);

            if (!plugin) {
                throw new Error(`Context plugin "${pluginId}" not found`);
            }

            if (plugin.postcss) {
                plugin = plugin.postcss;
            }

            if (plugin.plugins) {
                plugin.plugins.forEach((p) => {
                    contextPlugins.push(p);
                });
            }
            else {
                contextPlugins.push(plugin);
            }

            rule.remove();
        });

        if (!contextPlugins.length) {
            return;
        }

        let thisPluginIndex = null;

        result.processor.plugins.forEach((p, index) => {
            if (p.postcssPlugin === 'use') {
                thisPluginIndex = index;
            }
        });

        console.log('BEFORE CHANGE');
        console.log(result.processor.plugins);

        if (thisPluginIndex !== null) {
            result.processor.plugins = [].concat(
                result.processor.plugins.slice(0, thisPluginIndex + 1),
                contextPlugins,
                result.processor.plugins.slice(thisPluginIndex + 1),
            );
        }
        else {
            result.processor.plugins = result.processor.plugins.concat(contextPlugins);
        }

        result.processor.plugins.push(postcss.plugin('use#reset', () => {
            return (c, r) => {
                result.processor.plugins = originalPlugins;
                console.log('RESTORED');
                console.log(result.processor.plugins);
            };
        })());

        console.log('AFTER CHANGE');
        console.log(result.processor.plugins);
    };
});
