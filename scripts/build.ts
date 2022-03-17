import { readFile, copyFile } from "fs/promises";
import esbuild, { Plugin } from "esbuild";
import babel from "@babel/core";
import { dependencies } from "../package.json";

const config = await babel.loadPartialConfigAsync({
  configFile: false,
  sourceType: "module",
  sourceMaps: "inline",
  presets: [
    [
      "@babel/preset-env",
      {
        targets: { chrome: "81" },
        corejs: dependencies["core-js"].slice(1),
        useBuiltIns: "usage",
      },
    ],
  ],
  caller: {
    name: "esbuild",
    supportsStaticESM: true,
    supportsDynamicImport: true,
    supportsTopLevelAwait: true,
    supportsExportNamespaceFrom: true,
  },
});

const babel_plugin: Plugin = {
  name: "babel",
  setup({ onLoad, esbuild }) {
    onLoad({ filter: /\.ts$/ }, async args => {
      let code = await readFile(args.path, "utf-8");
      ({ code } = await esbuild.transform(code, {
        loader: "ts",
        sourcefile: args.path,
        sourcemap: "inline",
      }));
      ({ code } = await babel.transformAsync(code, config.options));
      return { contents: code };
    });
  },
};

try {
  await esbuild.build({
    entryPoints: ["./src/main.ts"],
    bundle: true,
    outdir: "dist",
    target: "chrome81",
    sourcemap: true,
    minify: true,
    plugins: [babel_plugin],
    logLevel: "info",
  });
  await copyFile("./src/index.html", "./dist/index.html");
} catch {
  process.exit(1);
}