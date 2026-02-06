/* eslint-disable import/no-extraneous-dependencies, @typescript-eslint/no-var-requires */

import "zx/globals";
import fs from "fs";
import path from "path";

function getWorkspacePackages() {
  const rootDir = path.resolve(__dirname, "..");
  const result = [];

  for (const parent of ["packages", "apps"]) {
    const parentDir = path.join(rootDir, parent);
    if (!fs.existsSync(parentDir)) continue;

    for (const dir of fs.readdirSync(parentDir)) {
      const pkgDir = path.join(parentDir, dir);
      const stat = fs.statSync(pkgDir);
      if (!stat.isDirectory()) continue;

      const pkgJsonPath = path.join(pkgDir, "package.json");
      const tsconfigPath = path.join(pkgDir, "tsconfig.json");
      const srcDir = path.join(pkgDir, "src");

      // tsconfig.json과 src/ 둘 다 있는 패키지만 대상
      if (
        !fs.existsSync(pkgJsonPath) ||
        !fs.existsSync(tsconfigPath) ||
        !fs.existsSync(srcDir)
      ) {
        continue;
      }

      const pkgJson = JSON.parse(fs.readFileSync(pkgJsonPath, "utf8"));
      if (!pkgJson.name || !pkgJson.name.startsWith("@keplr-wallet/")) {
        continue;
      }

      result.push({
        name: pkgJson.name,
        dir: pkgDir,
      });
    }
  }

  return result;
}

(async () => {
  const packages = getWorkspacePackages();

  for (const pkg of packages) {
    const paths = {};

    for (const other of packages) {
      if (other.name === pkg.name) continue;

      // 현재 패키지에서 대상 패키지의 src/로의 상대 경로
      const relativeSrc = path
        .relative(pkg.dir, path.join(other.dir, "src"))
        .split(path.sep)
        .join("/");

      // @keplr-wallet/xxx -> xxx/src
      paths[other.name] = [relativeSrc];
      // @keplr-wallet/xxx/build/* -> xxx/src/* (deep import 지원)
      paths[`${other.name}/build/*`] = [`${relativeSrc}/*`];
    }

    const tsconfig = {
      extends: "./tsconfig.json",
      compilerOptions: {
        baseUrl: ".",
        noEmit: true,
        paths,
      },
    };

    const outPath = path.join(pkg.dir, "tsconfig.check.json");
    fs.writeFileSync(outPath, JSON.stringify(tsconfig, null, 2) + "\n");
    console.log(`Generated: ${path.relative(path.resolve(__dirname, ".."), outPath)}`);
  }

  console.log(`\nDone! Generated ${packages.length} tsconfig.check.json files.`);
})();

/* eslint-enable import/no-extraneous-dependencies, @typescript-eslint/no-var-requires */
