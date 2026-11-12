# Translation conventions

Translations Lab validates a configurable vocabulary and reference structure. The bundled shop demonstrates one possible convention; these rules are not mandatory for every i18next project.

## File layout

A filename supplies the language (`ru.json` means `ru`). A top-level JSON key supplies the namespace. Nested directories are discovered recursively and do not determine either identity. Define a language/namespace pair once: duplicate definitions currently overwrite one another rather than merge.

## Reusable words and phrases

- `glossary` contains nouns such as `product`, `products`, and `order`.
- Russian and Turkish can define case keys, such as `order-gen`. Their configured order comes from `RULES_CONFIG["case-order"]`.
- Chinese uses singular glossary keys where separate plural forms are unnecessary.
- `adj` contains adjectives; gender forms such as `new_f` and `new_n` remain next to their base.
- `common` combines shared terms into labels. `ui` refers to common or UI strings.
- The configured default namespace contains page-specific copy.

For example, a Russian order number can use `Номер $t(glossary:order-gen)`. A UI basket label can resolve through `$t(common:basket-label)` to a glossary word.

## References and compilation

`$t(namespace:key)` references another value. Dots address nested keys. The supported `capitalizeFirstLetter` formatter uppercases the first character and works through nested references. Use it only when the resolved value starts with a lowercase letter.

References without a namespace are permitted only in configured namespaces. The demo's `$t(brand)` resolves in its default namespace. Missing local references can fall back to English; an entirely missing translation without an incoming reference is not itself reported as a missing-reference issue.

String arrays appear as keys such as `checkout.steps[0]`. `{{name}}` and `{{count}}` remain placeholders in Summary unless runtime values are provided.

## Rule configuration

`src/data/rulesConfig.ts` owns allowed reference scopes, plural suffix restrictions, case order, and namespace scopes. `src/data/namespaces.ts` owns the default, glossary, and adjective namespace identities. Issue labels and explanations live in `src/data/issueTypeConfig.ts`.

The `_only` suffix and the selected language-specific restrictions are project conventions. They are not a complete implementation of CLDR plural categories. Lemma matching is intentionally permissive and does not guarantee that every referenced grammatical form will compile as intended.

See the [demo guide](../translations/README.md) for executable examples and the [publication review](publication-review.md) for limitations.
