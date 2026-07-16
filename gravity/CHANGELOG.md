# Changelog

All notable changes to `@bpinternal/gravity` will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project adheres to
[Semantic Versioning](https://semver.org/spec/v2.0.0.html) starting with `1.0.0`.

## v0.1.0

### Added

- Initial release: generic density-based clustering (UMAP + HDBSCAN) compiled from Rust to `wasm32-unknown-unknown`
  and exposed through a TypeScript `cluster()` wrapper.
