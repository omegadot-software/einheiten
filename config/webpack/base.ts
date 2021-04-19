/**
 * This module provides a base webpack configuration with common settings and various build time
 * constants for use with webpack's DefinePlugin.
 *
 * NOTE: DefinePlugin performs simple text replacement, JSON.stringify creates a safe value by
 *       adding quotes around strings
 */
/* eslint-disable @typescript-eslint/no-unsafe-member-access,@typescript-eslint/no-unsafe-assignment */
import * as path from "path";

import { DefinePlugin } from "webpack";

/**
 * The absolute path to the top level project directory.
 */
export const PROJECT_DIR = path.resolve(__dirname, "../..");

/**
 * Build time constant to show the version of the app within the app.
 */
export const APP_VERSION = JSON.stringify(
	// eslint-disable-next-line import/order
	process.env.CI_COMMIT_SHORT_SHA ?? require("../../package.json").version
);

/**
 * Build time constant to show the when the app was built.
 */
export const BUILD_TIMESTAMP = Date.now();

/**
 * Whether webpack dev server is running.
 */
export const WEBPACK_DEV_SERVER = !!process.env.WEBPACK_DEV_SERVER;

const runtimeConfig: any = require("../babel/plugin-transform-runtime");
const envConfig: any = require("../babel/preset-env");

/**
 * Our application wide defaults that are used to compose the webpack configurations in the
 * webpack.*.config.ts files.
 */
export const baseConfig = {
	devtool: "eval-cheap-module-source-map",
	output: {
		path: path.resolve(PROJECT_DIR, "dist"),
	},

	resolve: {
		extensions: [".wasm", ".js", ".ts"],
	},

	module: {
		rules: [
			{
				oneOf: [
                    // The configuration for the project's source
                    {
                        test: /\.[jt]s$/,
                        exclude: [/node_modules/],
                        use: babelLoaderConfig(),
                    },
					// The configuration for node_modules
					// Unlike the application JS, we only compile the standard ES features.
					{
						test: /\.js$/,
						exclude: [/@babel\/runtime/, /core-js/],
						use: babelLoaderConfig([], {
							plugins: [],
							// Do not merge into the project babel.config.js
							configFile: false,
							babelrc: false,
						}),
					},
				],
			},
		],
	},
	plugins: [
		new DefinePlugin({
			APP_VERSION,
			BUILD_TIMESTAMP,
		}),
	],
};

function babelLoaderConfig(plugins: any[] = [], options = {}) {
	const presetEnvConfig = [
		"@babel/preset-env",
		{ ...envConfig, targets: { electron: "11" }, modules: false },
	];

	return {
		loader: "babel-loader",
		// Use babel options from top-level config file. This is the same config that jest uses.
		options: {
			// This is a feature of `babel-loader` for webpack (not Babel itself).
			// It enables caching results in ./node_modules/.cache/babel-loader/
			// directory for faster rebuilds.
			cacheDirectory: true,
			// See https://github.com/facebook/create-react-app/issues/6846
			// for context on why cacheCompression is disabled
			cacheCompression: false,

			// The following is merged into the project babel.config.js
			plugins: [
				...plugins,
				[
					"@babel/plugin-transform-runtime",
					{
						...runtimeConfig,
						useESModules: false,
					},
				],
			].filter(Boolean),

			presets: [presetEnvConfig],

			...options,
		},
	};
}
