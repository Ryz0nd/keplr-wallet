## Build & Typecheck Rules

Running `yarn build` at the root triggers a full build and takes a very long time. Only run it when absolutely necessary.

### Typecheck (for verifying code changes)

After modifying code, use **`yarn typecheck` instead of `yarn build`** to verify correctness.
Each package has a `tsconfig.check.json` that enables source-level type checking without building.

- **Typecheck only the modified package**: `yarn workspace {package_name} typecheck`
- **Typecheck all packages** (if needed): `yarn typecheck` (runs all packages in parallel from root)
- Can be run immediately without dependency ordering or prior builds

### Build

Only use builds for production deployment or when actual build output is required.

- Build an individual package: `yarn workspace {package_name} build`
- Already-built packages (those with a `build/` directory) do not need to be rebuilt unless modified
- When multiple packages are modified, check `package.json` `dependencies` and build in dependency order

### Adding New Packages

When adding a new `@keplr-wallet/*` package, you must run `yarn check:gen` to generate
the `tsconfig.check.json` and `.eslintrc.json` for that package.
