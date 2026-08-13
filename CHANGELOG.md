# Changelog

## [0.25.0](https://github.com/vorausrobotik/vdoc/compare/0.24.3...0.25.0) (2026-08-13)


### Features

* **iframe:** Apply the color mode through the frame URL ([11cbd41](https://github.com/vorausrobotik/vdoc/commit/11cbd418f8275f29db93a47e0a4700a62a3633dc))
* **iframe:** Handle framed links with one delegated listener ([192d33d](https://github.com/vorausrobotik/vdoc/commit/192d33d8cb602669fcda1ef4fb33a40d896860bc))
* **iframe:** Notice client-side navigation in the frame ([f94bfa7](https://github.com/vorausrobotik/vdoc/commit/f94bfa76440130a650444fb3d00139d627e529f1))
* **iframe:** Tell the frame where vdocs own content starts ([2155ba5](https://github.com/vorausrobotik/vdoc/commit/2155ba5e1ec0a2dc009f361486b0700dd64611ad))
* **ui:** Move the color mode into the app bar ([d13415e](https://github.com/vorausrobotik/vdoc/commit/d13415e51df3230d28369494131ac30fc816a366))


### Bug Fixes

* **dev:** Start uvicorn as a subprocess so its reloader survives ([49ce27c](https://github.com/vorausrobotik/vdoc/commit/49ce27c2cdb8e70de565752b734b4a573306cd58))
* **routing:** Resolve the version once per version, not once per page ([41be995](https://github.com/vorausrobotik/vdoc/commit/41be995dd40af809e957abd9053bbdc8b0a2ba0d))


### Code Refactoring

* **helpers:** Make one rule map the two URL namespaces ([c1cb58e](https://github.com/vorausrobotik/vdoc/commit/c1cb58e43c71553e2c9c144b393366a342c52015))


### Documentation

* Describe the frame contract in one place ([c0185cb](https://github.com/vorausrobotik/vdoc/commit/c0185cb4ec94bec1d0c24627914385b4dbbab02d))


### Build System

* **deps:** Update all dependencies ([85982c8](https://github.com/vorausrobotik/vdoc/commit/85982c8f3fde8dcfb7d607513bcaa1c92a9a380e))
* **deps:** Update astral-sh/setup-uv action to v10 ([d8e3e7b](https://github.com/vorausrobotik/vdoc/commit/d8e3e7b910d0a228925e0e5389a15edea514cf08))
* **deps:** Update dockerfile dependencies ([cd2f39d](https://github.com/vorausrobotik/vdoc/commit/cd2f39d71d0223ba490e223f838f2730a9d227c3))
* **deps:** Update github-actions dependencies ([e57eb9b](https://github.com/vorausrobotik/vdoc/commit/e57eb9bb4fe2daa56d5bce8b690ee08433a37f64))
* **docs:** Render mermaid diagrams in the documentation ([ecd7fe0](https://github.com/vorausrobotik/vdoc/commit/ecd7fe08b470a742d3fa41b9fcdc5d7ebcc74b7b))

## [0.24.3](https://github.com/vorausrobotik/vdoc/compare/0.24.2...0.24.3) (2026-08-09)


### Build System

* **deps:** Update actions/checkout action to v7.0.1 ([0e7f3ab](https://github.com/vorausrobotik/vdoc/commit/0e7f3aba78858c8c35697be7f091f1027fb2c4d4))
* **deps:** Update astral-sh/setup-uv action to v9 ([a662fbd](https://github.com/vorausrobotik/vdoc/commit/a662fbd31d350620eed4772c660a6213421625e5))
* **deps:** Update dependency @tanstack/router-plugin to v1.168.23 ([78dafc1](https://github.com/vorausrobotik/vdoc/commit/78dafc10e94655fd5ce9cbf6a6d882ec4aac7f1c))
* **deps:** Update zizmorcore/zizmor-action action to v0.6.0 ([7467965](https://github.com/vorausrobotik/vdoc/commit/746796531c19e2e453343bbba28c56bd2a669ecd))


### Continuous Integration

* Pin all installs to `uv.lock` and switch releases to release-please ([085c65d](https://github.com/vorausrobotik/vdoc/commit/085c65dfdc67bcfd0dcd102f0e825ebe6412cfb1))
