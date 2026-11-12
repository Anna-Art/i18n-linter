# Third-party software

The repository's restrictive [LICENSE](LICENSE) applies to its original material. It does not replace or restrict the licenses of third-party dependencies. Their authors retain their rights.

## Browser runtime

React, React DOM, React Router, i18next, and react-i18next declare MIT licenses. Transitive runtime packages have their own notices. The MIT license permits use in a proprietary project but requires preservation of the copyright and license notice when distributing covered software.

The Vite build is configured to generate `dist/THIRD_PARTY_LICENSES.txt` from the packages actually included in the bundle. Keep this file with a hosted or distributed build. Regenerate it whenever dependencies change; the lockfile records the resolved versions. Review the generated file before distributing a release.

## Development tools

The dependency tree also includes MIT, ISC, BSD, Apache-2.0, BlueOak-1.0.0, 0BSD, MPL-2.0, and CC-BY-4.0 declarations. In particular:

- TypeScript and some lint tools use Apache-2.0.
- Lightning CSS and its native packages use MPL-2.0. They are build tools; using them does not by itself place this application's original source under MPL. Redistributing those tools or modified MPL-covered files has separate obligations.
- caniuse-lite contains browser compatibility data under CC-BY-4.0. Redistributing that dataset requires its attribution and license information.

`node_modules` is not part of the source distribution. If distributing it, a development container, or other bundled tooling, preserve the licenses and notices for those additional packages as well. A package's declared SPDX identifier is an inventory aid, not a substitute for its license text or an audit of all bundled third-party code.

## Original demonstration content and icon

The fictional shop translations and the current SVG favicon were created for this repository. No external shop template or translation corpus was used for them.

## References

- [MIT license conditions](https://choosealicense.com/licenses/mit/)
- [Mozilla MPL FAQ](https://www.mozilla.org/en-US/MPL/2.0/FAQ/)
- [Creative Commons Attribution 4.0](https://creativecommons.org/licenses/by/4.0/)
- [GitHub public repository licensing](https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/customizing-your-repository/licensing-a-repository)
