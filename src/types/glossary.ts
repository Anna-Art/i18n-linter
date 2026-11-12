export type { Language } from '../data/languages';

export type IssueType =
  | 'wrong-key'
  | 'typo'
  | 'cross-block-ref'
  | 'syntax-error'
  | 'missing-in-lang'
  | 'redundant-modifier'
  | 'plural-glossary-ref'
  | 'invalid-plural-context'
  | 'hardcoded-glossary-term'
  | 'key-ordering';

export interface KeyIssue {
  /** Full dot-separated key path, e.g. "dashboard.navigation.settings" */
  keyPath: string;
  /** The current value of the key (may contain $t() references) */
  currentValue: string;
  /** Types of issues detected (multiple per key possible) */
  issueTypes: IssueType[];
  /** Suggested replacement values, one per issue type (null = no suggestion) */
  suggestedReplacements: (string | null)[];
  /** Which glossary type the candidate should go into */
  suggestedGlossaryType: string | null;
  /** Suggested key name if moved to another namespace */
  suggestedKey: string | null;
  /** Human-readable notes about each issue, in the same order as issueTypes */
  notes: string[];
  /** The namespace this candidate belongs to (e.g., "dashboard", "common", "glossary") */
  namespace: string;
}

/**
 * Glossary index mapping namespace → set of available keys.
 * Dynamically built from every namespace found in the translation files.
 */
export interface GlossaryIndex {
  [namespace: string]: Set<string>;
}

export interface FilterState {
  issueTypes: IssueType[];
  searchQuery: string;
}