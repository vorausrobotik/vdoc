# Changelog

## [0.31.2](https://github.com/vorausrobotik/vdoc/compare/0.31.1...0.31.2) (2026-10-08)


### Bug Fixes

* **ui:** Jump to a fragment without reloading the frame ([f208ec4](https://github.com/vorausrobotik/vdoc/commit/f208ec49b19a877c80f75b64ecf862ac7e744c9f))
* **ui:** Keep the app bar on pages too short to hide it ([bc2503b](https://github.com/vorausrobotik/vdoc/commit/bc2503b60a56473a8d23f91532351f25c6d34fd4))
* **ui:** Lift the scroll-to-top button above the footer ([8cb07ea](https://github.com/vorausrobotik/vdoc/commit/8cb07ea59b30b730e7145633693516d601939907))
* **ui:** Treat a bare fragment as the top of the page ([e312bf0](https://github.com/vorausrobotik/vdoc/commit/e312bf0f458a741802fef4d3282115a7f4dcbee9))


### Code Refactoring

* **ui:** Give the address of a documentation page one home ([66d2572](https://github.com/vorausrobotik/vdoc/commit/66d2572229df1b3320761c8651ec666e13e23926))


### Documentation

* Open the introduction with the voraus hero ([dc1ba75](https://github.com/vorausrobotik/vdoc/commit/dc1ba75afa2115a66851575731a4a2fcd05f9bf2))


### Tests

* **ui:** Check frame navigation invariants across arrivals and link kinds ([a79a001](https://github.com/vorausrobotik/vdoc/commit/a79a00135bf5999611a1928bab17acc85af4298b))


### Build System

* **deps:** Update all dependencies ([9256442](https://github.com/vorausrobotik/vdoc/commit/9256442e9f59386d1fce3e024424c8943fc0bfea))
* **deps:** Update github-actions dependencies ([4f0a8c1](https://github.com/vorausrobotik/vdoc/commit/4f0a8c1107fb08898a63ca1e75cb7453966b2f88))

## [0.31.1](https://github.com/vorausrobotik/vdoc/compare/0.31.0...0.31.1) (2026-10-07)


### Bug Fixes

* **docker:** Trust the forwarded headers of a reverse proxy ([7ec3cc4](https://github.com/vorausrobotik/vdoc/commit/7ec3cc4df9ae67e1e69055c1522c27ec4db12477))
* **ui:** Keep the documentation frame hidden until it loaded a document ([ba84ebe](https://github.com/vorausrobotik/vdoc/commit/ba84ebe31c67ce2a51e80f0cfa6d4b1662c65d67))


### Code Refactoring

* **docker:** Build both images from one `Dockerfile` ([46fed9c](https://github.com/vorausrobotik/vdoc/commit/46fed9cf273fdce6536ffd9bde83b6e813e832e9))


### Tests

* **ui:** Stop waiting for the held frame before checking it is hidden ([b5dbd04](https://github.com/vorausrobotik/vdoc/commit/b5dbd04afc71444aaacec4353ffe135c827f0700))


### Build System

* **docker:** Install vdoc with uv at the versions in `uv.lock` ([e290e38](https://github.com/vorausrobotik/vdoc/commit/e290e3801bdd8cecf3b797a33f63aa1a3f0e8f8e))
* **tox:** Pass only `CI` through to the environments ([b5ba2bc](https://github.com/vorausrobotik/vdoc/commit/b5ba2bcc885e01b4ff626643c67563aec3b96be9))


### Continuous Integration

* Publish the image with vpu 1.0 and deploy the released version ([2c7098a](https://github.com/vorausrobotik/vdoc/commit/2c7098aab0016d3111dd58c92e177044c4c8a09d))

## [0.31.0](https://github.com/vorausrobotik/vdoc/compare/0.30.0...0.31.0) (2026-10-06)


### Features

* **admin:** Put the project categories in order ([e5b1800](https://github.com/vorausrobotik/vdoc/commit/e5b180008e25555a4e60da4f91d0c58224925ba4))
* **ui:** Sort the projects in a category by their title ([03ee490](https://github.com/vorausrobotik/vdoc/commit/03ee490d992c3b80fcf38e53a9c4c0389de0707d))


### Bug Fixes

* **db:** Keep the references to a table a migration rebuilds ([b718f7d](https://github.com/vorausrobotik/vdoc/commit/b718f7df470015faecc67c30611b50a8c04912e5))
* **deps:** Build against TanStack Router's `unknown` error type ([c218561](https://github.com/vorausrobotik/vdoc/commit/c21856126ca40023ab5f6ab90abf749c4320c98e))
* **deps:** Update `@voraus/mui-theme` to 0.3.2 ([5e8db6f](https://github.com/vorausrobotik/vdoc/commit/5e8db6f3e5b0666a0719194413617a5788c5ec24))
* **ui:** Draw the old-version banner as a warning alert ([db0c73d](https://github.com/vorausrobotik/vdoc/commit/db0c73d322ee3b89d2e80250cb34e58f6b1d428f))
* **ui:** Load the documentation frame only after the header was measured ([9b85105](https://github.com/vorausrobotik/vdoc/commit/9b8510507bae8bdd73a32ab1baed3d4fddf57b01))


### Build System

* **deps:** Lock file maintenance ([c373163](https://github.com/vorausrobotik/vdoc/commit/c373163fb12da5fa39e574a5dbab28d3b947624e))
* **deps:** Update all dependencies ([af53ff9](https://github.com/vorausrobotik/vdoc/commit/af53ff9ab933c35ad39d90dd47fedafc0fe48b4e))
* **deps:** Update github-actions dependencies ([ad795d3](https://github.com/vorausrobotik/vdoc/commit/ad795d343689f2098f57f69a8aea0083fc7e9d93))
* **docker:** Start each preview deployment from a copy of production ([57e8ecd](https://github.com/vorausrobotik/vdoc/commit/57e8ecd608c40496c2961a4376627250fb67357e))


### Continuous Integration

* Reference same-repository workflows and actions with `$/` ([7c1795d](https://github.com/vorausrobotik/vdoc/commit/7c1795d6dd137ef8ece760ba989ae6942414cfab))
* **zizmor:** Ignore false cache-poisoning finding for setup-uv ([a5e7dcb](https://github.com/vorausrobotik/vdoc/commit/a5e7dcb144e622c4526b318e7c0c649f8f8c431f))

## [0.30.0](https://github.com/vorausrobotik/vdoc/compare/0.29.0...0.30.0) (2026-10-05)


### ⚠ BREAKING CHANGES

* **ui:** The theme plugin is gone, with `plugins.theme` and `/api/plugins/theme/`. Its logo, palette, `border_radius` and `flat_cards` settings are ignored. Set `plugins.site.theme: voraus`, or `VDOC_PLUGINS_SITE_THEME=voraus`, for the voraus look.

### Features

* **admin:** Preview the card and the hero while editing a project ([d753f95](https://github.com/vorausrobotik/vdoc/commit/d753f9563dbbc3080b461e9a0cbe1cef2c67f18f))
* **api:** Let one project be featured, with a label for its button ([ee21187](https://github.com/vorausrobotik/vdoc/commit/ee21187898ef9bf672e373089d2e513919e37e38))
* **plugins:** Draw the links of the footer as icons ([a76d22f](https://github.com/vorausrobotik/vdoc/commit/a76d22f6ab2c6812199e5c7159da89a45cde6c42))
* **ui:** Leave the app version out of the header ([e154e1a](https://github.com/vorausrobotik/vdoc/commit/e154e1a86f32c22b4d40d7e2da7dfd85295a632c))
* **ui:** Take the look of the voraus design system ([1bca043](https://github.com/vorausrobotik/vdoc/commit/1bca0431213b52cff41887802b255c3cd31ae949))


### Continuous Integration

* Raise the minor version for a breaking change before 1.0 ([92a3b42](https://github.com/vorausrobotik/vdoc/commit/92a3b4265d09a6ada6dd907c6abeb96f0647cdc5))

## [0.29.0](https://github.com/vorausrobotik/vdoc/compare/0.28.0...0.29.0) (2026-10-05)


### Features

* **admin:** Upload a version from the project's admin page ([4072c6e](https://github.com/vorausrobotik/vdoc/commit/4072c6e693c9feff773c6294f1399162dbc01176))


### Code Refactoring

* **ui:** Import from the frontend root through an `@/` alias ([fab9914](https://github.com/vorausrobotik/vdoc/commit/fab99146d00b74a2662f4563b0b28b724ccdc619))


### Build System

* **deps:** Update all dependencies ([67ed9d0](https://github.com/vorausrobotik/vdoc/commit/67ed9d04e426041006027eb88dddfcf9a83615d6))
* **deps:** Update dockerfile dependencies ([1fc9b0b](https://github.com/vorausrobotik/vdoc/commit/1fc9b0b74190df7ccf8dde1e78599d044549ebf7))


### Continuous Integration

* Keep the build green when the Codecov upload fails ([df7048f](https://github.com/vorausrobotik/vdoc/commit/df7048f2f53ba237ceb704e908d718da19566c7c))

## [0.28.0](https://github.com/vorausrobotik/vdoc/compare/0.27.1...0.28.0) (2026-09-30)


### ⚠ BREAKING CHANGES

* `project_categories`, `project_category_mapping` and `project_display_name_mapping` are no longer settings, and are ignored with a warning. Set categories, display names and visibility on the admin pages instead. vdoc needs a writable `database_url` outside `docs_dir`, by default `/srv/vdoc/data/vdoc.db`, for which a container needs a volume, and it has to run as a single process. Uploads with the default credentials `admin`/`admin` are refused, and login attempts are not rate limited, which is left to the reverse proxy.

### Features

* Store projects and versions in a database, with admin pages ([654de24](https://github.com/vorausrobotik/vdoc/commit/654de2455b921206f68ce39363511cb37c325046))


### Miscellaneous Chores

* Release 0.28.0 ([2701d8e](https://github.com/vorausrobotik/vdoc/commit/2701d8e34d0a97db90738dd8e26be9d71f087088))

## [0.27.1](https://github.com/vorausrobotik/vdoc/compare/0.27.0...0.27.1) (2026-09-29)


### Bug Fixes

* **ui:** Mirror the query string of documentation pages exactly ([a41a71d](https://github.com/vorausrobotik/vdoc/commit/a41a71d8580c3f2da39fea94a9438d139a9ab2a5))


### Documentation

* **ui:** Point the frame contract reference at its current path ([72f79f9](https://github.com/vorausrobotik/vdoc/commit/72f79f9d4490807117bfdfd39539d6c3e77293b9))


### Continuous Integration

* Name the exact release in every action pin comment ([51c9750](https://github.com/vorausrobotik/vdoc/commit/51c9750df97a4af1483f11df8489c327ed5940c4))

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
