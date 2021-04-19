import {resolve} from "path";

import {baseConfig} from "./base";

const outputPath = resolve(baseConfig.output.path, "web");

export default function configure(_env: Record<string, string>, argv: Record<string, string>) {
    function env<T1, T2>(dev: T1, prod?: T2): T1 | T2 | undefined {
        const mode = argv.mode ?? "production";

        if (mode.startsWith("prod")) {
            return prod;
        } else {
            return dev;
        }
    }

    return {
        ...baseConfig,
        devtool: env("eval-cheap-module-source-map", false),

        entry: {
            main: "./src/index.ts",
        },

        output: {
            path: outputPath,
        },

        devServer: {
            hot: true,
        },

        resolve: {
            fallback: {
                assert: require.resolve("assert/"),
            },
            extensions: baseConfig.resolve.extensions,
        },

        target: "web",
    };
}
