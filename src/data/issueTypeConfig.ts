import type { IssueType } from "../types/glossary";

export interface IssueTypeConfig {
  label: string;
  className: string;
  tooltip: string;
}

export const ISSUE_TYPE_CONFIG: Record<IssueType, IssueTypeConfig> = {
  "wrong-key": {
    label: "Wrong Key",
    className: "badge--wrong-key",
    tooltip: "The referenced key does not exist in the target language or English fallback",
  },
  typo: {
    label: "Typo",
    className: "badge--typo",
    tooltip: "The referenced key does not exist, but a similar key was found — likely a typo",
  },
  "cross-block-ref": {
    label: "Cross-Block Ref",
    className: "badge--cross-block",
    tooltip: "The file contains $t() references that violate cross-reference rules for this file type",
  },
  "syntax-error": {
    label: "Syntax Error",
    className: "badge--syntax",
    tooltip: "Malformed $t() syntax — missing $, missing closing parenthesis, or empty namespace/key",
  },
  "missing-in-lang": {
    label: "Missing in Language",
    className: "badge--missing-lang",
    tooltip: "The referenced key exists in English but is missing in this language — English fallback will be used",
  },
  "redundant-modifier": {
    label: "Redundant Modifier",
    className: "badge--redundant-modifier",
    tooltip: "capitalizeFirstLetter modifier is used on a key that does not start with a lowercase letter — only use it when the referenced key starts with a lowercase letter",
  },
  "plural-glossary-ref": {
    label: "Plural Ref",
    className: "badge--plural-glossary",
    tooltip: "References a glossary term in plural form — this language has no plural forms, use singular instead",
  },
  "invalid-plural-context": {
    label: "Invalid Plural Context",
    className: "badge--invalid-plural",
    tooltip: "The key uses a plural context suffix that is not valid for this language",
  },
  "hardcoded-glossary-term": {
    label: "Hardcoded Glossary Term",
    className: "badge--hardcoded-glossary",
    tooltip: "The value contains a glossary term as plain text — should use $t(glossary:...) reference instead",
  },
  "key-ordering": {
    label: "Key Ordering",
    className: "badge--key-ordering",
    tooltip: "First-level keys are not in the correct order — lemmas should be alphabetical, plurals adjacent to singular, and case suffixes in the correct language-specific order",
  },
};
