# Changelog

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project adheres to semantic versioning.

## [0.0.21] - 2025-07-18

### Changed

- Switched package development typings from `@types/node` 20 to `@types/node` 22.

## [0.0.20] - 2025-04-01

### Changed

- Updated development dependencies: `@types/lodash` from `4.17.15` to `4.17.16` and TypeScript from `5.7.3` to `5.8.2`.

## [0.0.19] - 2025-02-07

### Fixed

- Explicitly marked the package as CommonJS by adding `"type": "commonjs"` to `package.json`.

## [0.0.18] - 2025-02-04

### Changed

- Updated development dependencies: `@types/lodash` from `4.17.13` to `4.17.15` and TypeScript from `5.6.3` to `5.7.3`.

## [0.0.17] - 2024-11-11

### Changed

- Updated `@types/lodash` from `4.17.12` to `4.17.13`.
- Standardized the package workspace file with the rest of the repository.

### Fixed

- Fixed README typos and standardized licensing text.

## [0.0.16] - 2024-10-21

### Changed

- Updated `@types/lodash` from `4.17.10` to `4.17.12`.

## [0.0.15] - 2024-10-16

### Changed

- Updated TypeScript from `5.6.2` to `5.6.3`.

## [0.0.14] - 2024-10-07

### Changed

- Updated `@types/lodash` from `4.17.9` to `4.17.10`.

## [0.0.13] - 2024-09-26

### Changed

- Reverted package manager metadata from pnpm 9 to pnpm `8.6.2`.

## [0.0.12] - 2024-09-25

### Changed

- Updated development dependencies: `@types/lodash` from `4.17.6` to `4.17.9` and TypeScript from `5.5.3` to `5.6.2`.

## [0.0.11] - 2024-07-18

### Changed

- Updated `@types/yargs` from `^17.0.24` to `^17.0.32`.

## [0.0.10] - 2024-07-02

### Changed

- Updated development dependencies: `@types/lodash` from `4.17.5` to `4.17.6` and TypeScript from `5.4.5` to `5.5.3`.
- Renamed the type-check script from `type:check` to `check:type`.

## [0.0.9] - 2024-06-10

### Changed

- Updated `@types/lodash` from `4.17.4` to `4.17.5`.

## [0.0.8] - 2024-05-31

### Changed

- Updated development dependencies: `@types/lodash` from `4.17.0` to `4.17.4` and Vitest from `1.5.3` to `1.6.0`.
- Migrated package manager metadata to pnpm `9.1.0` and pinned the pnpm engine version.

## [0.0.7] - 2024-05-01

### Changed

- Updated Vitest from `1.5.0` to `1.5.3`.

## [0.0.6] - 2024-04-23

### Changed

- Updated development dependencies: `@types/lodash` from `4.14.202` to `4.17.0`, Vitest from `1.3.1` to `1.5.0`, and TypeScript from `5.3.3` to `5.4.5`.
- Added package manager metadata for pnpm `8.6.0+` and engines for Node `>=16.0.0` and pnpm `>=8.6.0 <9`.

## [0.0.5] - 2024-02-29

### Fixed

- Reverted ESM-only dependency updates by changing `decamelize` from `6.0.0` back to `5.0.1` and `yn` from `^5.0.0` back to `4.0.0`.

### Changed

- Pinned Vitest to `1.3.1`.

## [0.0.4] - 2024-02-28

### Changed

- Migrated tests from Jest to Vitest.
- Updated development tooling dependencies, including TypeScript `5.3.3`, `@types/lodash` `4.14.202`, and `cross-env` `^7.0.0`.
- Updated runtime dependencies `decamelize` to `6.0.0` and `yn` to `^5.0.0`.
- Changed the package license from AGPL-3.0 to MIT.
- Added a `type:check` script.

## [0.0.3] - 2023-05-12

### Added

- Added support for parsing array options from environment variables in `parseEnv` using whitespace-separated values.
- Added tests covering environment parsing for strings, numbers, booleans, choices, and array values.
- Added README usage examples.

### Changed

- Updated `yargs` from `^17.5.1` to `^17.7.2`.
- Updated development tooling for newer Node and TypeScript versions.

### Fixed

- Fixed README documentation typos.

## [0.0.2] - 2022-06-15

### Fixed

- Moved `@types/yargs` from development dependencies to runtime dependencies so consumers receive yargs typings.

### Changed

- Cleaned up package dependencies while keeping the release on `0.0.2`.

## [0.0.1] - 2022-06-15

### Added

- Initial release of `@bpinternal/yargs-extra`.
- Added helpers for cleaning argv objects, applying default values, parsing environment variables, parsing typed option values, and inferring yargs schema types.
