import { readFile, copyFile } from "fs/promises";
import cp from "child_process";
import esbuild from "esbuild";
import babel from "@babel/core";
import { dependencies } from "../package.json";
import { relative } from "path";

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

const babel_plugin = {
  name: "babel",
  setup({ onLoad, esbuild }) {
    onLoad({ filter: /\.ts$/ }, async args => {
      let code = await readFile(args.path, "utf-8");
      ({ code } = await esbuild.transform(code, {
        loader: "ts",
        sourcefile: relative(process.cwd(), args.path),
        sourcemap: "inline",
      }));
      ({ code } = await babel.transformAsync(code, config.options));
      return { contents: code };
    });
  },
};

try {
  await esbuild.build({
    entryPoints: ["./src/whiteboard"],
    bundle: true,
    outdir: "dist",
    target: "chrome81",
    sourcemap: true,
    minify: true,
    plugins: [babel_plugin],
    legalComments: "external",
    logLevel: "info",
  });
  await copyFile("./src/index.html", "./dist/index.html");
  cp.spawnSync("ruby scripts/cs.rb", { stdio: "inherit", shell: true });
  await copyFile("./cs/Whiteboard.cs", "./dist/Whiteboard.cs");
} catch {
  process.exit(1);
}
