const {resolve} = require("path");

function webpackInjectPublicPath(webpackConfig, publicPath) {
    const configHtmlWebPackPlugin = webpackConfig.plugins.find(
        (plugin) => plugin.constructor.name === 'HtmlWebpackPlugin',
    );
    const templateParameters = configHtmlWebPackPlugin.options.templateParameters

    configHtmlWebPackPlugin.options.publicPath = publicPath;
    webpackConfig.output.publicPath = publicPath;

    configHtmlWebPackPlugin.options.templateParameters = (compilation, files, options) => {
        const result = templateParameters(compilation, files, options);
        result.globals.PREVIEW_URL = `${publicPath}iframe.html`;
        return result;
    }
}

function viteForceBundleDependencies() {
    const virtualFileId = '/virtual:/@storybook/builder-vite/vite-app.js';

    return {
        name: 'force-bundle-config-dep',
        enforce: 'pre',
        transform(code, id) {
            if (id !== virtualFileId) {
                return;
            }

            // match last node_modules
            // .../node_modules/.../node_modules/yy/zz -> yy/zz
            const transformedCode = code.replace(
                /import \* as (config_.*?) from '.*\/node_modules\/(.*?)'/g,
                (_substr, name, mpath) => {
                    return `import * as ${name} from '${mpath}'`;
                }
            );

            return {
                code: transformedCode,
                map: null,
            };
        },
    };
}

function viteHtmlPlugin() {
    return {
        name: 'html',
        transform (code, id) {
            if (/\.html$/.test(id)) {
                return `export default ${JSON.stringify(code)}`;
            }
        }
    };
}

module.exports = {
    framework: '@storybook/vue3',
    features: {
        storyStoreV7: true,
    },
    stories: [
        "../src/**/*.stories.mdx",
        "../src/**/*.stories.@(js|jsx|ts|tsx)"
    ],
    addons: [
        "@storybook/addon-links",
        "@storybook/addon-essentials",
        "@storybook/addon-a11y"
    ],
    core: {
        builder: "storybook-builder-vite"
    },
    async viteFinal(config, { configType }) {
        config.resolve.alias = [
            {
                find: /^@inkline\/inkline\//,
                replacement: `${resolve(__dirname)}/../src/`
            },
            {
                find: /^~@inkline\/icons/,
                replacement: '@inkline/icons'
            }
        ];

        if (configType === 'DEVELOPMENT') {
            config.plugins = config.plugins.concat([
                viteHtmlPlugin(),
                // viteForceBundleDependencies()
            ]);

            // config.resolve.alias.push({
            //     find: /^vue$/,
            //     replacement: 'vue/dist/vue.esm-bundler.js'
            // });

            config.server.force = false;
        } else {
            config.base = "/storybook/";
        }

        return config;
    },
    managerWebpack: async (config, { configType }) => {
        if (configType !== 'DEVELOPMENT') {
            webpackInjectPublicPath(config, '/storybook/');
        }

        return config;
    },
}