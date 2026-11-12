# Publication review

Reviewed on 2026-11-12. Scope: current source, local Git history, npm dependency declarations, build output, and the bundled demo. The author confirmed that the linter is her personal project and was not created as part of her employment. The previous use of work-related translations was limited to testing input data.

## Before making the repository public

1. **Publish a fresh source snapshot, not the old Git history.** Earlier commits contain another project's translation files as regular tracked files, not just a submodule pointer. Removing the current submodule does not erase those blobs. Earlier documentation and author metadata also contain references to the previous project or organization. Do not push old branches/tags or import the old `.git` directory into the public repository.
2. **Application ownership confirmed by the author.** The linter belongs to Anna Artobolevskaia and is independent of her employment. The separate translation corpus previously used to test it has been replaced with original demonstration data. Ownership is not an outstanding publication item.
3. **Use the intended licensing model.** The author chose public inspection with other use requiring permission. `UNLICENSED` and the restrictive root license are retained. This is not an open-source release. The license acknowledges GitHub's platform rights and separates third-party licenses from the author's terms.
4. **Check the public contact address.** The author's personal contact address appears in `LICENSE` and `package.json` by design. Choose the desired commit email (or a GitHub-provided private email) before making the first public commit.

A public GitHub repository permits viewing and forking through the platform even without an open-source license. See [GitHub's explanation](https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/customizing-your-repository/licensing-a-repository) and [Terms of Service](https://docs.github.com/en/site-policy/github-terms/github-terms-of-service#5-license-grant-to-other-users).

## Changes made

- Replaced the translation submodule with 35 original shop demo JSON files: seven separate namespaces in five languages. Removed the submodule configuration and Git index entry.
- Replaced documentation tied to the previous project with independent translation conventions and a demo guide.
- Replaced the existing favicon with a new, simple SVG drawn for this project.
- Clarified licensing and third-party notices; enabled Vite's generated dependency license file in production builds.
- Removed tracked Vite cache files. Added cache and local environment files to `.gitignore`; removed the misleading ignore rule for the already-tracked lockfile.
- Normalized the npm package name, documented the Node requirement, and replaced the starter README.
- Centralized the translation path, enabled recursive JSON discovery, and applied the same glob replacement in Vite's dependency scanner.
- Added checks using the real Vite loader and analysis engine for all ten issue types, expected clean examples, typo suggestions, and Summary compilation.
- Applied compatible dependency updates with `npm audit fix --ignore-scripts`, without forced major changes.

## Dependency licenses

No declared license was found that requires releasing this application's original code under a copyleft license merely to use the current dependencies in this way. This conclusion is based on package declarations and the inspected distribution, not a provenance audit of every dependency file.

Runtime packages declare permissive licenses. Preserve bundled dependency notices: `npm run build` generates `dist/THIRD_PARTY_LICENSES.txt`. Build tools additionally include MPL-2.0 (Lightning CSS), Apache-2.0, and CC-BY-4.0 data (caniuse-lite). Redistributing those tools or datasets is a separate case from publishing application source and a browser bundle. See [THIRD_PARTY_NOTICES.md](../../THIRD_PARTY_NOTICES.md) and the [Mozilla MPL FAQ](https://www.mozilla.org/en-US/MPL/2.0/FAQ/).

## Dependency security

The initial npm audit reported 17 affected packages (6 high, 11 moderate). Compatible updates removed all high findings.

- `npm audit --omit=dev`: **0 known vulnerabilities** at review time.
- Full audit: **10 moderate affected packages**, all stemming from the same `minimatch` advisory in the lint toolchain. This is one underlying advisory plus its dependent packages, not ten distinct vulnerabilities.
- [GHSA-g3hv-75wg-m249](https://github.com/advisories/GHSA-g3hv-75wg-m249) concerns denial of service from crafted glob patterns. The patched release is 11.0.1; the current tooling resolves 10.2.6. npm's proposed forced fix changes major lint-tool versions. No forced downgrade or unverified transitive major override was applied.

The remaining issue is in development tooling, not the generated browser runtime. Recheck before release and update the lint stack when compatible fixes are available. Do not treat untrusted lint configuration or glob input as safe. Audit results are time-dependent and do not prove absence of vulnerabilities.

## Data and credentials

A targeted pattern scan of 202 historical Git blobs and the current source found no private-key headers, common GitHub/AWS/Slack token formats, or long literal credential assignments. This was not a dedicated secret-scanner audit and does not rule out all secrets. The old translation corpus and project-specific documentation are nevertheless unsuitable for the new public snapshot.

No application telemetry or external API calls were found in the current source. All imported translations are bundled into client assets. Replacing the demo with private data and deploying that build would disclose those translations to visitors, even if the UI filters them out.

## Existing functional limits

These do not prevent publishing the fictional demo but should be clear to users:

- Hardcoded glossary matching uses JavaScript `\b` word boundaries, so Cyrillic and Chinese matches are unreliable.
- Namespace-less references allowed by configuration are not checked for target existence by the current analyzer.
- Lemma matching accepts related grammatical forms; it does not prove that a specific suffix exists at runtime.
- Invalid JSON stops Vite before runtime guards can apply. The demo's syntax errors are inside valid JSON strings.
- Duplicate language/namespace definitions overwrite rather than merge or report a collision.
- Browser URL selections use `replaceState`; each filter or tab change does not create a separate history entry.
- The checks added here cover demonstration behavior, not an exhaustive unit suite or browser accessibility review.

These limitations were documented rather than mixed into a larger analyzer redesign.

## Verified commands

```bash
npm run test:demo
npm run lint
npm run build
npm audit --omit=dev
```

Demo checks cover 334 translation values across five languages and seven namespaces. The build includes dependency license texts. No public repository or hosted site was created during this review.
