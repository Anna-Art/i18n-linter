import type { LanguageScope } from "./languages";
import type { NamespaceScope } from "./namespaces";

/**
 * Rule configuration for analysis checks.
 *
 * Each rule specifies which languages it applies to via a LanguageScope:
 * - "all" — applies to all languages (default)
 * - Language[] — applies only to the listed languages
 *
 * Rules not listed here default to "all" (applies to all languages and file types).
 */

/**
 * Configuration for a single plural context suffix.
 *
 * - If neither `include` nor `exclude` is specified → applies to all languages
 * - `include` specifies which languages are allowed
 * - `exclude` specifies which languages are excluded
 * - `include` and `exclude` are mutually exclusive — specifying both is a validation error
 */
export interface PluralContextSuffixConfig {
    /** Languages where this suffix is allowed (mutually exclusive with `exclude`) */
    include?: LanguageScope;
    /** Languages where this suffix is excluded (mutually exclusive with `include`) */
    exclude?: LanguageScope;
}

export interface PluralContextRule {
    /** Languages where "_only" is allowed */
    only?: PluralContextSuffixConfig;
    /** Languages where "_one" is allowed */
    one?: PluralContextSuffixConfig;
    /** Languages where "_few" is allowed */
    few?: PluralContextSuffixConfig;
    /** Languages where "_many" is allowed */
    many?: PluralContextSuffixConfig;
    /** Languages where "_other" is allowed */
    other?: PluralContextSuffixConfig;
}

/**
 * Language scope configuration using include/exclude pattern.
 * Consistent with PluralContextSuffixConfig.
 */
export interface LanguageScopeConfig {
    /** Languages this config applies to */
    include?: LanguageScope;
    /** Languages this config excludes */
    exclude?: LanguageScope;
}

/**
 * Base rule config with namespace scoping.
 * Language scoping is handled via LanguageScopeConfig on specific sub-fields.
 */
interface BaseRuleConfig {
    /** Namespaces this rule applies to */
    namespaces?: NamespaceScope;
}

export interface RuleConfig {
    /**
     * Check for invalid plural context suffixes.
     * Each language allows a specific set of plural context suffixes.
     */
    "invalid-plural-context"?: PluralContextRule;

    /**
     * Check for plural glossary references in languages that have no plural forms.
     * Glossary references must use singular form for these languages.
     */
    "plural-glossary-ref"?: LanguageScopeConfig;

    /**
     * Check for redundant capitalizeFirstLetter modifier.
     * capitalizeFirstLetter should only be used when the referenced key starts with a lowercase letter.
     * If the key starts with an uppercase letter, digit, or any non-letter character (including CJK),
     * the modifier is redundant and a warning should be shown.
     */
    "redundant-modifier"?: BaseRuleConfig;

    /**
     * Check for hardcoded glossary terms in plain text.
     */
    "hardcoded-glossary-term"?: BaseRuleConfig;

    /**
     * Check key ordering in the namespaces listed in the rule config.
     */
    "key-ordering"?: BaseRuleConfig;

    /**
     * Grammatical case suffix order for glossary files.
     * Defines the expected order of case suffixes for languages that support them.
     * Key is the language code, value is the ordered array of case suffixes.
     * Languages not listed here are not checked for case ordering.
     */
    "case-order"?: Record<string, string[]>;

    /**
     * Cross-block reference rules per namespace.
     * Defines which namespaces each namespace is allowed to reference.
     */
    "cross-block-ref"?: {
        /** Referencing namespace → what it may reference in $t() calls */
        allowedRefs?: Record<
            string,
            {
                /** Allowed target namespaces (e.g., ["glossary"] for the glossary namespace) */
                namespaces?: string[];
                /** Whether namespace-less refs are allowed */
                allowNamespaceLess?: boolean;
                /** Whether $t() references are completely forbidden */
                forbidAll?: boolean;
            }
        >;
    };
}

/**
 * Default rule configuration.
 *
 * Only rules with language-specific or file-type-specific restrictions
 * need to be listed here. If a rule is not listed, it defaults to "all"
 * (applies to all languages and all file types).
 */
export const RULES_CONFIG: RuleConfig = {
    "invalid-plural-context": {
        only: { include: ["ru", "zh"] },
        one: { exclude: ["zh"] },
        few: { include: ["ru"] },
        many: { include: ["ru", "es", "pt"] },
        other: { exclude: ["ru"] },
    },

    "plural-glossary-ref": {
        include: ["zh"],
    },

    "redundant-modifier": {},

    "hardcoded-glossary-term": {
        namespaces: ["dashboard", "common", "entities", "report"],
    },

    "key-ordering": {
        namespaces: ["glossary", "common", "adj", "ui", "entities"],
    },

    "case-order": {
        ru: ["-gen", "-dat", "-acc", "-ins", "-pre"],
        tr: ["-gen", "-dat", "-acc", "-loc", "-abl"],
        en_devel: ["-gen", "-dat", "-acc", "-ins", "-pre", "-loc", "-abl"],
    },

    "cross-block-ref": {
        allowedRefs: {
            adj: {
                forbidAll: true,
            },
            glossary: {
                namespaces: ["glossary"],
                allowNamespaceLess: false,
            },
            common: {
                namespaces: ["glossary", "common", "adj"],
                allowNamespaceLess: false,
            },
            ui: {
                namespaces: ["common", "ui"],
                allowNamespaceLess: false,
            },
            dashboard: {
                allowNamespaceLess: true,
            },
            report: {
                allowNamespaceLess: true,
            },
            entities: {
                allowNamespaceLess: true,
            },
        },
    },
};
