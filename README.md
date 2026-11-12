# Translations Lab

A visual linter for i18n translation keys and glossary conventions, built with React, TypeScript, Vite, and i18next. The interface is in English; the input translations can use multiple languages.

The project is publicly available for inspection, but **use requires the author's permission**. It is not open-source software. See [LICENSE](LICENSE).

## What it does

- Finds broken or mistyped `$t()` references and malformed reference syntax.
- Flags references that fall back to English, forbidden cross-namespace references, and redundant capitalization.
- Checks configured plural suffixes, glossary reuse, and key ordering, including grammatical cases and adjective forms.
- Filters issues by language, namespace, issue type, and search text.
- Shows raw and compiled translations on the `/summary` page.

These are configurable project conventions, not a universal i18next or linguistic validator. See [translation conventions](src/docs/glossary.md) and [known limitations](src/docs/publication-review.md).

## Local development

For the author and users with permission. Use Node.js 22.22+ on the 22.x line, or Node.js 24+, and npm.

```bash
npm ci
npm run dev
```

Open the local URL printed by Vite. No account, backend, API keys, or Git submodules are needed.

```bash
npm run lint
npm run test:demo
npm run build
npm run preview
```

`test:demo` loads the real data through Vite, verifies all ten issue types and typo suggestions, checks clean examples, and compiles every translation for Summary.

## Included shop demo

The fictional **Little Lantern** shop has original demonstration text in English, Russian, Spanish, Turkish, and Simplified Chinese. No shop template, external translation corpus, customer data, or third-party product copy was used.

[Demo guide](src/translations/README.md) explains the intentional errors. Start with:

- `/?lang=en&namespace=dashboard` for references, syntax, and glossary checks.
- `/?lang=ru&namespace=glossary` for case forms.
- `/?lang=zh&namespace=dashboard` for plural references and fallback.
- `/summary?lang=en&namespace=dashboard` for raw and compiled values.

The displayed issues are intentional teaching examples; they are not a failing project health check.

## Analyze another project

1. Put translation JSON files under `src/translations`, or change `TRANSLATIONS_DIR` in `src/data/translationsDir.ts`. Remove the demo JSON files if replacing the dataset; do not mix two definitions of the same language and namespace.
2. Name each file after its language, such as `en.json`. Each top-level JSON key is a namespace; directory names have no semantic meaning. One file can contain multiple namespaces.
3. Configure the default, glossary, and adjective namespaces in `src/data/namespaces.ts`.
4. Adapt language and namespace scopes in `src/data/rulesConfig.ts`. English is the current fallback language.
5. Restart Vite after changing its configuration. The demo checks target the bundled fixtures and must be adapted if you replace them.

```json
{
  "glossary": { "product": "product" },
  "dashboard": { "label": "$t(glossary:product, capitalizeFirstLetter)" }
}
```

Translations are imported at build time and processed in the browser. **Every imported translation is included in the client bundle.** Publish only data you are allowed to disclose; filtering a table does not hide its other values from visitors.

## Distribution and publication

`npm run build` writes `dist/`, including `THIRD_PARTY_LICENSES.txt` generated from bundled dependencies. Keep that file with any distributed or hosted build. See [third-party notices](THIRD_PARTY_NOTICES.md).

A host must serve `index.html` for client routes such as `/summary`. GitHub Pages needs additional base-path and SPA fallback configuration; this repository does not configure deployment.

Before publishing, read the [publication review](src/docs/publication-review.md), including the completed separation from the previous translation corpus, dependency notices, and remaining development-tool advisories.
