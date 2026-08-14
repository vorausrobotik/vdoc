# Changelog

## [0.27.0](https://github.com/vorausrobotik/vdoc/compare/0.26.1...0.27.0) (2026-08-14)


### Features

* **api:** Serve a sitemap and advertise every page's static address ([3e7c4d4](https://github.com/vorausrobotik/vdoc/commit/3e7c4d4be4b1ede061f467c30ef93789213f00f0))


### Bug Fixes

* **ui:** Lay out every page for the width it is shown at ([7706ad0](https://github.com/vorausrobotik/vdoc/commit/7706ad04ca3600b8df8a185399e731c6745b9ce6))


### Performance Improvements

* **api:** Serve the web UI through a static file server ([79d64e4](https://github.com/vorausrobotik/vdoc/commit/79d64e4ad1f2364c3635de24385a1a78aaf0a8fd))
* **models:** Read a project's versions once per request ([f6ce756](https://github.com/vorausrobotik/vdoc/commit/f6ce756fe9d7d9eab10eccaea2938086724754f5))


### Code Refactoring

* **models:** Ask Project where a version lives ([94e28ff](https://github.com/vorausrobotik/vdoc/commit/94e28ff6ba1febb88dbbde72a5e8dfb0e0ff17d5))


### Miscellaneous Chores

* **dev:** Watch the package with inotify, and only the package ([307a0d9](https://github.com/vorausrobotik/vdoc/commit/307a0d9b434ddfedb852f16ea913b30c263554ff))

## [0.26.1](https://github.com/vorausrobotik/vdoc/compare/0.26.0...0.26.1) (2026-08-14)


### Code Refactoring

* **api:** Drop the mount for vdoc's own documentation ([98c6572](https://github.com/vorausrobotik/vdoc/commit/98c6572c32c9745730c82c76b36e3f37b67e0ce2))


### Documentation

* Rebuild the documentation as a Docusaurus site ([e110376](https://github.com/vorausrobotik/vdoc/commit/e110376ae982d65ebe2e8b8ba838ca54e87eb732))


### Continuous Integration

* Build the docs site for the URL GitHub Pages serves it from ([e81e7d2](https://github.com/vorausrobotik/vdoc/commit/e81e7d24e9ce29562f3244d26ca33f2d83ce8c9a))

## [0.26.0](https://github.com/vorausrobotik/vdoc/compare/0.25.0...0.26.0) (2026-08-14)


### Features

* **api:** Serve llms.txt and robots.txt ([8c9c0be](https://github.com/vorausrobotik/vdoc/commit/8c9c0be5300476418f67b02b1fa79ce084bb1bcf))
* **plugins:** Add a site plugin for the title and the description ([a00604a](https://github.com/vorausrobotik/vdoc/commit/a00604a1fb73a3cd4859bfa3a4938545d41c18af))
* **plugins:** Let the site plugin carry a markdown long description ([bf759a7](https://github.com/vorausrobotik/vdoc/commit/bf759a7ea728a673510fb87600f717b6e2635b0f))
* **plugins:** Let the theme plugin carry the palette and the shape ([e72f97c](https://github.com/vorausrobotik/vdoc/commit/e72f97ce133ad8823bb9ac31e5a5acda55f3117b))
* **settings:** Read the configuration from a YAML file as well ([41e3aa5](https://github.com/vorausrobotik/vdoc/commit/41e3aa5238d02cf0f51a9a41f38f7f0a146cc180))


### Bug Fixes

* **api:** Answer a request for something unpublished with 404 ([7bc7d0c](https://github.com/vorausrobotik/vdoc/commit/7bc7d0ce29cec0110db2de00cdf5da415f7434a0))
* **plugins:** Register a plugin's routes once rather than per read ([232498f](https://github.com/vorausrobotik/vdoc/commit/232498f71be00c191291d881d80bc8eeae70b17f))
* **ui:** Make the app bar and the footer opaque in dark mode ([d43e2b1](https://github.com/vorausrobotik/vdoc/commit/d43e2b1c4679049eab46aad1e4bd0e76b06361cc))
* **ui:** Settle the site banner before the landing page paints ([28e10eb](https://github.com/vorausrobotik/vdoc/commit/28e10eb67d1797fc49530d09373ebbbc02e59aa5))


### Performance Improvements

* **settings:** Build the settings and scan a project's versions once ([28f322a](https://github.com/vorausrobotik/vdoc/commit/28f322ace1331fad790acb84914032fdb0f4ff2d))


### Code Refactoring

* **cli:** Drop the call site from the log output ([8913e5e](https://github.com/vorausrobotik/vdoc/commit/8913e5e86b99527f9c9fc02cf3d9c5c34a4fdc1b))
* **ui:** Rename the project card action from "Documentation" to "Open" ([60d937f](https://github.com/vorausrobotik/vdoc/commit/60d937f9194209cb715dab83a0cc0d2b0cf1395c))


### Documentation

* Document the configuration file as the way to configure vdoc ([d2d7336](https://github.com/vorausrobotik/vdoc/commit/d2d7336eb41f87baef3e8da90762c2575687491b))


### Tests

* **ui:** Return projects, not project names, from the mocked projects API ([10a4434](https://github.com/vorausrobotik/vdoc/commit/10a44346b01e9926dbfe87bddbe8e328a4b33b80))


### Miscellaneous Chores

* Ignore the local vdoc configuration file ([4af45ef](https://github.com/vorausrobotik/vdoc/commit/4af45efa0dc1336ce99f1a23e0242dd365cd2e05))

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
