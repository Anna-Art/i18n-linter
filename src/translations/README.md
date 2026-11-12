# Little Lantern demonstration translations

These texts were authored specifically for Translations Lab as a fictional homewares shop. They are not copied or adapted from a real store, commercial product, translation repository, or licensed template. The root [LICENSE](../../LICENSE) applies to these demonstration files too.

Each namespace has its own directory with `en.json`, `es.json`, `ru.json`, `tr.json`, and `zh.json` (35 files in total). For example, `glossary/en.json` contains `{ "glossary": { ... } }`, while `common/en.json` contains `{ "common": { ... } }`. Each file contains exactly one namespace. The loader still discovers namespaces from top-level JSON keys and languages from filenames; directory names do not determine either identity.

| Namespace | Role |
| --- | --- |
| `glossary` | Reusable nouns, singular/plural forms, Russian and Turkish cases |
| `adj` | Adjectives and selected gender forms |
| `common` | Shared labels, actions, and nested references |
| `ui` | Buttons and UI labels built from common strings |
| `dashboard` | Storefront, catalog, basket, checkout, and explicit error demonstrations |
| `entities` | Order and product labels with intentionally reversed key ordering |
| `report` | A small sales report and array values |

## Intentional issues

| Example key | Language | Expected issue |
| --- | --- | --- |
| `dashboard.demo.missing-key` | All | Wrong Key |
| `dashboard.demo.typo` | All | Typo; suggestion points to `glossary:product` |
| `dashboard.demo.missing-dollar` | All | Syntax Error |
| `dashboard.demo.missing-parenthesis` | All | Syntax Error |
| `dashboard.demo.empty-namespace` | All | Syntax Error |
| `dashboard.demo.empty-key` | All | Syntax Error |
| `ui.demo.cross-reference`, `adj.reference-demo` | All | Cross-Block Ref |
| `dashboard.demo.fallback` | All except English | Missing in Language; compiles to English `return window` |
| `dashboard.demo.redundant-modifier` | All | Redundant Modifier on an already capitalized or uncased value |
| `dashboard.demo.plural-reference` | Chinese | Plural Ref; use singular `product` |
| `dashboard.demo.invalid_few` | English, Spanish, Turkish | Invalid Plural Context |
| `dashboard.demo.invalid_other` | Russian | Invalid Plural Context |
| `dashboard.demo.invalid_one` | Chinese | Invalid Plural Context |
| `dashboard.demo.hardcoded-term` | English | Hardcoded Glossary Term |
| `entities.z-order` | All | Key Ordering |

Other natural shop copy can also trigger glossary warnings. The hardcoded-term matcher currently uses JavaScript ASCII word boundaries, so Cyrillic and Chinese examples do not reliably produce that warning. The fixtures do not claim otherwise.

`dashboard.valid.*` contains examples expected to produce no issues. They demonstrate nested references through `ui → common → glossary`, a default-namespace reference, and Russian/Turkish case references. Checkout contains interpolation variables and arrays; Summary leaves variables visible when no runtime values are supplied.

The JSON itself is valid. Syntax errors are deliberately inside string values, so Vite can still load every file. There are no cyclic references.

Run `npm run test:demo` after changing these examples. It checks every issue type against the real analysis engine, ensures the valid examples remain clean, and verifies Summary compilation, English fallback, and array lookup.
