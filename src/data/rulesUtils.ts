import { RULES_CONFIG } from './rulesConfig';
import type { PluralContextSuffixConfig } from './rulesConfig';
import type { LanguageScope } from './languages';
import type { NamespaceScope } from './namespaces';

/**
 * Check if a suffix config allows a given language.
 */
function isSuffixAllowed(config: PluralContextSuffixConfig | undefined, language: string): boolean {
  if (!config) {
    return true; // No config → allowed for all
  }

  // Check exclusion first (takes precedence)
  if (config.exclude) {
    if (config.exclude === 'all' || config.exclude.includes(language)) {
      return false;
    }
  }

  // Check inclusion
  if (config.include) {
    return config.include === 'all' || config.include.includes(language);
  }

  return true; // neither include nor exclude specified → allowed for all
}

/**
 * Check if a LanguageScopeConfig allows a given language.
 * Returns true if no config is specified (default: allow all).
 */
function isLanguageInScopeConfig(
  config: { include?: LanguageScope; exclude?: LanguageScope } | undefined,
  language: string,
): boolean {
  if (!config) {
    return true; // No config → allowed for all
  }

  // Check exclusion first (takes precedence)
  if (config.exclude) {
    if (config.exclude === 'all' || config.exclude.includes(language)) {
      return false;
    }
  }

  // Check inclusion
  if (config.include) {
    return config.include === 'all' || config.include.includes(language);
  }

  return true; // neither include nor exclude specified → allowed for all
}

/**
 * Get the allowed plural context suffixes for a given language based on the rules config.
 */
export function getAllowedPluralContexts(language: string): Set<string> {
  const config = RULES_CONFIG['invalid-plural-context'];
  if (!config) {
    // Default: all plural contexts allowed
    return new Set(['_one', '_other', '_few', '_many', '_only']);
  }

  const allowed = new Set<string>();

  if (isSuffixAllowed(config.only, language)) allowed.add('_only');
  if (isSuffixAllowed(config.one, language)) allowed.add('_one');
  if (isSuffixAllowed(config.few, language)) allowed.add('_few');
  if (isSuffixAllowed(config.many, language)) allowed.add('_many');
  if (isSuffixAllowed(config.other, language)) allowed.add('_other');

  return allowed;
}

/**
 * Check if a rule applies to a given language.
 * Rules not listed in RULES_CONFIG default to "all" (applies to all languages).
 *
 * Supports two config shapes:
 * - `{ include?: LanguageScope; exclude?: LanguageScope }` — LanguageScopeConfig
 * - `{ only?: LanguageScope | PluralContextSuffixConfig }` — legacy BaseRuleConfig (for invalid-plural-context)
 */
export function isRuleApplicable(ruleName: string, language: string): boolean {
  const config = (RULES_CONFIG as Record<string, unknown>)[ruleName];
  if (!config) {
    return true; // Default: applies to all
  }

  // Check for LanguageScopeConfig pattern (include/exclude)
  const scopeConfig = config as { include?: LanguageScope; exclude?: LanguageScope };
  if ('include' in scopeConfig || 'exclude' in scopeConfig) {
    return isLanguageInScopeConfig(scopeConfig, language);
  }

  // Check for BaseRuleConfig with `only` field (legacy pattern)
  const baseConfig = config as { only?: LanguageScope | Record<string, unknown> };
  const only = baseConfig.only;
  if (!only) {
    return true;
  }
  // If `only` is a plain object (like PluralContextRule.only), it's not a LanguageScope — skip
  if (typeof only === 'object' && !Array.isArray(only)) {
    return true;
  }
  return only === 'all' || only.includes(language);
}

/**
 * Check if a rule applies to a given namespace.
 * Rules not listed in RULES_CONFIG default to "all" (applies to all namespaces).
 */
export function isRuleApplicableForNamespace(
  ruleName: string,
  namespace: string,
): boolean {
  const config = (RULES_CONFIG as Record<string, { namespaces?: NamespaceScope }>)[ruleName];
  if (!config) {
    return true;
  }
  const namespaces = config.namespaces;
  if (!namespaces) {
    return true;
  }
  return namespaces === 'all' || namespaces.includes(namespace);
}

/**
 * Get the cross-block reference config for a given namespace.
 * Returns null if no specific config exists (default behavior applies).
 */
export function getCrossBlockRefConfig(namespace: string): {
  namespaces?: string[];
  allowNamespaceLess?: boolean;
  forbidAll?: boolean;
} | null {
  const config = RULES_CONFIG['cross-block-ref'];
  if (!config?.allowedRefs) {
    return null;
  }
  return config.allowedRefs[namespace] ?? null;
}

/**
 * Get the grammatical case suffix order for a given language.
 * Returns the ordered array of case suffixes, or null if the language
 * has no case ordering defined.
 */
export function getCaseOrderForLanguage(language: string): string[] | null {
  const caseOrder = RULES_CONFIG['case-order'];
  if (!caseOrder) return null;
  return caseOrder[language] ?? null;
}
