import type { KeyIssue } from "../types/glossary";
import type { Language } from "../types/glossary";
import {
    getAllowedPluralContexts,
    getCaseOrderForLanguage,
} from "./rulesUtils";
import {
    ALL_NAMESPACES,
    ADJECTIVES_NAMESPACE,
    GLOSSARY_NAMESPACE,
} from "./namespaces";
import { RULES_CONFIG } from "./rulesConfig";

/**
 * Recursively flatten a nested JSON object into an array of { keyPath, value } pairs.
 * Arrays are flattened with numeric indices as key segments.
 */
export function flattenObject(
    obj: Record<string, unknown>,
    prefix = "",
): Array<{ keyPath: string; value: string }> {
    const result: Array<{ keyPath: string; value: string }> = [];

    for (const [key, value] of Object.entries(obj)) {
        const fullKey = prefix ? `${prefix}.${key}` : key;

        if (typeof value === "string") {
            result.push({ keyPath: fullKey, value });
        } else if (Array.isArray(value)) {
            value.forEach((item, index) => {
                if (typeof item === "string") {
                    result.push({
                        keyPath: `${fullKey}[${index}]`,
                        value: item,
                    });
                }
            });
        } else if (typeof value === "object" && value !== null) {
            result.push(
                ...flattenObject(value as Record<string, unknown>, fullKey),
            );
        }
    }

    return result;
}

/**
 * Extract all $t(...) references from a string value.
 * Returns an array of objects with the full match, the key inside, namespace info,
 * and whether the capitalizeFirstLetter modifier is used.
 */
export function extractReferences(value: string): Array<{
    fullMatch: string;
    key: string;
    namespace: string | null;
    hasNamespace: boolean;
    hasCapitalizeFirstLetter: boolean;
}> {
    const refs: Array<{
        fullMatch: string;
        key: string;
        namespace: string | null;
        hasNamespace: boolean;
        hasCapitalizeFirstLetter: boolean;
    }> = [];
    const pattern = /\$t\(([^)]+)\)/g;
    let match: RegExpExecArray | null;

    while ((match = pattern.exec(value)) !== null) {
        const fullMatch = match[0];
        const inner = match[1].trim();

        // Check for capitalizeFirstLetter modifier
        const hasCapitalizeFirstLetter = inner.endsWith(
            ", capitalizeFirstLetter",
        );
        const cleanInner = hasCapitalizeFirstLetter
            ? inner.slice(0, -", capitalizeFirstLetter".length).trim()
            : inner;

        // Check for namespace (namespace:key)
        const colonIndex = cleanInner.indexOf(":");
        if (colonIndex > 0) {
            const namespace = cleanInner.slice(0, colonIndex);
            const key = cleanInner.slice(colonIndex + 1);
            refs.push({
                fullMatch,
                key,
                namespace,
                hasNamespace: true,
                hasCapitalizeFirstLetter,
            });
        } else {
            refs.push({
                fullMatch,
                key: cleanInner,
                namespace: null,
                hasNamespace: false,
                hasCapitalizeFirstLetter,
            });
        }
    }

    return refs;
}

/**
 * Build a regex pattern that matches any known namespace prefix.
 * Used for syntax error detection and note highlighting.
 */
export function buildNamespacePattern(): string {
    // Sort by length descending to match longer namespaces first (e.g., "en_devel" before "en")
    const sorted = [...ALL_NAMESPACES].sort((a, b) => b.length - a.length);
    // Escape special regex characters in namespace names
    const escaped = sorted.map((ns) =>
        ns.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
    );
    return escaped.join("|");
}

/**
 * Detect syntax errors in $t() calls within a string value.
 * Returns an array of { description, raw } for each error found.
 */
export function detectSyntaxErrors(
    value: string,
): Array<{ description: string; raw: string }> {
    const errors: Array<{ description: string; raw: string }> = [];

    // Check for missing $ (t(...) without $)
    const missingDollarPattern = /(?<!\$|\w)t\(([^)]*)\)/g;
    let match: RegExpExecArray | null;
    while ((match = missingDollarPattern.exec(value)) !== null) {
        errors.push({
            description: `Missing "$" in "${match[0]}" — should be "$t(...)"`,
            raw: match[0],
        });
    }

    // Check for missing closing parenthesis
    // Match $t( that is NOT followed by a closing ) before end of line
    const missingParenPattern = /\$t\([^)]*$/gm;
    while ((match = missingParenPattern.exec(value)) !== null) {
        errors.push({
            description: `Missing closing ")" in "${match[0]}"`,
            raw: match[0],
        });
    }

    // Check for empty namespace (e.g., $t(:key))
    const emptyNamespacePattern = /\$t\(:[^)]+\)/g;
    while ((match = emptyNamespacePattern.exec(value)) !== null) {
        errors.push({
            description: `Empty namespace in "${match[0]}"`,
            raw: match[0],
        });
    }

    // Check for empty key (e.g., $t(namespace:))
    // Dynamically build pattern from all known namespaces
    if (ALL_NAMESPACES.length > 0) {
        const nsPattern = buildNamespacePattern();
        const emptyKeyPattern = new RegExp(
            `\\$t\\((?:${nsPattern}):\\s*\\)`,
            "g",
        );
        while ((match = emptyKeyPattern.exec(value)) !== null) {
            errors.push({
                description: `Empty key after namespace in "${match[0]}"`,
                raw: match[0],
            });
        }
    }

    return errors;
}

/**
 * Plural context suffixes that can be appended to a lemma key.
 * These are the standard ICU plural forms.
 */
export const PLURAL_CONTEXT_SUFFIXES = [
    "_one",
    "_other",
    "_few",
    "_many",
    "_only",
];

/**
 * Get allowed plural context suffixes for a given language.
 * Uses the rules config instead of hardcoded values.
 */
export function getAllowedPluralContextsForLanguage(
    language: string,
): Set<string> {
    return getAllowedPluralContexts(language);
}

// Lazy-loaded case suffixes from the rules config
let _caseSuffixes: string[] | null = null;

function getAllCaseSuffixes(): string[] {
    if (_caseSuffixes === null) {
        const caseOrder = RULES_CONFIG["case-order"];
        if (caseOrder) {
            const seen = new Set<string>();
            for (const suffixes of Object.values(caseOrder)) {
                for (const s of suffixes) {
                    seen.add(s);
                }
            }
            _caseSuffixes = Array.from(seen);
        } else {
            _caseSuffixes = [];
        }
    }
    return _caseSuffixes;
}

/**
 * Extract the lemma from a key by stripping known context suffixes.
 * E.g., "scan-result_one" → "scan-result", "target-name-gen" → "target-name"
 */
export function extractLemma(key: string): string {
    // Check static suffixes first (PLURAL_CONTEXT_SUFFIXES + gender/context suffixes + negative marker)
    const staticSuffixes = [
        ...PLURAL_CONTEXT_SUFFIXES,
        ...GENDER_CONTEXT_SUFFIXES,
        "-not",
    ];
    for (const suffix of staticSuffixes) {
        if (key.endsWith(suffix)) {
            return key.slice(0, -suffix.length);
        }
    }

    // Check case suffixes from config
    const caseSuffixes = getAllCaseSuffixes();
    for (const suffix of caseSuffixes) {
        if (key.endsWith(suffix)) {
            return key.slice(0, -suffix.length);
        }
    }

    return key;
}

/**
 * Check if a key exists in a set using lemma-based matching.
 * Performs 3 checks:
 * 1. Exact match
 * 2. Strip context suffix from the referenced key and match lemma
 * 3. Match the referenced key against lemmas of all index keys
 */
export function keyExistsInSet(key: string, set: Set<string>): boolean {
    // 1. Exact match
    if (set.has(key)) return true;

    // 2. Strip context suffix from the referenced key and check
    const keyLemma = extractLemma(key);
    if (keyLemma !== key && set.has(keyLemma)) return true;

    // 3. Check if the referenced key matches the lemma of any key in the set
    for (const indexKey of set) {
        if (extractLemma(indexKey) === key) return true;
        if (extractLemma(indexKey) === keyLemma) return true;
    }

    return false;
}

/**
 * Try to convert an English plural glossary key to its singular form.
 * Returns the singular form if it can be derived, or null if the key
 * doesn't appear to be a plural form.
 *
 * Rules:
 * - "ies" → "y" (e.g., "categories" → "category")
 * - "es" → strip "es" (e.g., "reg-exps" → "reg-exp")
 * - "s" → strip "s" (e.g., "scans" → "scan")
 */
export function toGlossarySingular(key: string): string | null {
    if (key.endsWith("ies")) {
        return key.slice(0, -3) + "y";
    }
    // Strip trailing "s" before checking "es" to handle cases like "issues" → "issue"
    // (strip "s", not "es"). The "es" rule is only needed for words where "e" is part
    // of the root (e.g., not applicable to our glossary terms).
    if (key.endsWith("s") && !key.endsWith("ss")) {
        return key.slice(0, -1);
    }
    return null;
}

/**
 * Compute Levenshtein distance between two strings.
 */
function levenshteinDistance(a: string, b: string): number {
    const m = a.length;
    const n = b.length;
    const dp: number[][] = [];

    for (let i = 0; i <= m; i++) {
        dp[i] = [i];
    }
    for (let j = 0; j <= n; j++) {
        dp[0][j] = j;
    }

    for (let i = 1; i <= m; i++) {
        for (let j = 1; j <= n; j++) {
            const cost = a[i - 1] === b[j - 1] ? 0 : 1;
            dp[i][j] = Math.min(
                dp[i - 1][j] + 1,
                dp[i][j - 1] + 1,
                dp[i - 1][j - 1] + cost,
            );
        }
    }

    return dp[m][n];
}

/**
 * Find the closest matching key in a set using Levenshtein distance.
 * Returns the closest match if distance ≤ 2 or ≤ 30% of key length, otherwise null.
 */
export function findSimilarKey(key: string, set: Set<string>): string | null {
    const threshold = Math.max(2, Math.ceil(key.length * 0.3));
    let bestMatch: string | null = null;
    let bestDistance = Infinity;

    for (const candidate of set) {
        const dist = levenshteinDistance(key, candidate);
        if (dist < bestDistance) {
            bestDistance = dist;
            bestMatch = candidate;
        }
    }

    return bestDistance <= threshold ? bestMatch : null;
}

/**
 * Resolve $t() references in a glossary value recursively.
 * E.g., for "auth-check": "$t(glossary:auth) check" where auth = "authentication",
 * the resolved value is "authentication check".
 *
 * Uses a cache to avoid infinite recursion on circular references.
 */
function resolveGlossaryValue(
    value: string,
    glossaryData: Record<string, unknown>,
    visited: Set<string> = new Set(),
): string {
    const glossaryRefPattern = new RegExp(
        `\\$t\\(${GLOSSARY_NAMESPACE}:([^)]+)\\)`,
        "g",
    );
    return value.replace(glossaryRefPattern, (_match, key: string) => {
        const trimmedKey = key.trim();
        if (visited.has(trimmedKey)) {
            return "";
        }
        const refValue = glossaryData[trimmedKey];
        if (typeof refValue === "string") {
            visited.add(trimmedKey);
            return resolveGlossaryValue(refValue, glossaryData, visited);
        }
        return "";
    });
}

/**
 * Build a map of resolved plain text values to glossary term keys for a given language.
 *
 * For each glossary term, resolves all $t() references recursively to get the
 * full plain text value. Maps that resolved text (lowercase) to the glossary key.
 *
 * E.g., for Russian glossary:
 *   "auth": "аутентификация" → "аутентификация" → auth
 *   "auth-check": "$t(glossary:auth) check" → resolve → "проверка аутентификации" → auth-check
 *
 * @param glossaryData - The inner object of the glossary file (e.g., ru.json["glossary"])
 * @returns A map where keys are lowercase resolved plain text values and values are glossary term keys
 */
export function buildGlossaryValueMap(
    glossaryData: Record<string, unknown>,
): Map<string, string> {
    const valueMap = new Map<string, string>();

    for (const [key, value] of Object.entries(glossaryData)) {
        if (typeof value === "string") {
            const resolved = resolveGlossaryValue(value, glossaryData).trim();
            if (resolved.length > 0) {
                const lower = resolved.toLowerCase();
                // If multiple terms resolve to the same text, prefer the shorter key
                // (more specific term should win over a more general one)
                const existing = valueMap.get(lower);
                if (!existing || key.length < existing.length) {
                    valueMap.set(lower, key);
                }
            }
        }
    }

    return valueMap;
}

/**
 * Check if a translation value contains any hardcoded glossary terms
 * that should be replaced with $t(glossary:...) references.
 *
 * @param value - The translation value to check
 * @param glossaryValueMap - Map of resolved plain text values to glossary term keys
 * @returns Array of { term, key } objects for each detected hardcoded term
 */
export function detectHardcodedGlossaryTerms(
    value: string,
    glossaryValueMap: Map<string, string>,
): Array<{ term: string; key: string }> {
    const results: Array<{ term: string; key: string }> = [];
    const alreadyReferenced = new Set<string>();

    // Collect terms already referenced via $t() in this value
    const refPattern = new RegExp(
        `\\$t\\(${GLOSSARY_NAMESPACE}:([^)]+)\\)`,
        "g",
    );
    let refMatch: RegExpExecArray | null;
    while ((refMatch = refPattern.exec(value)) !== null) {
        alreadyReferenced.add(refMatch[1].trim());
    }

    // Extract plain text segments (everything outside $t())
    const plainTextSegments = value.split(/\$t\([^)]+\)/g);

    for (const segment of plainTextSegments) {
        if (segment.trim().length === 0) continue;

        // Normalize whitespace
        let normalized = segment.replace(/\s+/g, " ").toLowerCase();

        // Strip template variables {{...}} — they are not part of the visible text
        normalized = normalized.replace(/\{\{[^}]+\}\}/g, "");

        // Strip HTML/JSX tags <...> — they are markup, not visible text
        // This handles both self-closing (<tag/>) and paired (<tag>...</tag>) tags
        normalized = normalized.replace(/<[^>]*>/g, "");

        // Re-normalize whitespace after stripping
        normalized = normalized.replace(/\s+/g, " ").trim();

        if (normalized.length === 0) continue;

        // Check each glossary term value against the plain text
        for (const [glossaryValue, termKey] of glossaryValueMap) {
            // Skip if this term is already referenced via $t()
            if (alreadyReferenced.has(termKey)) continue;

            // Check if the glossary value appears as a whole word in the segment
            const phraseRegex = new RegExp(
                `\\b${escapeRegex(glossaryValue)}\\b`,
                "gi",
            );
            let match: RegExpExecArray | null;
            while ((match = phraseRegex.exec(normalized)) !== null) {
                // Skip if the term is preceded by "to " — it's likely an infinitive verb, not a noun
                const matchStart = match.index;
                const preceding = normalized.slice(
                    Math.max(0, matchStart - 3),
                    matchStart,
                );
                if (preceding === "to ") {
                    continue;
                }

                // Skip if the term is part of a verb phrase like "log in" / "log out"
                // These are phrasal verbs, not noun uses of the glossary term
                const matchEnd = matchStart + match[0].length;
                const following = normalized
                    .slice(matchEnd, matchEnd + 5)
                    .toLowerCase();
                if (
                    match[0].toLowerCase() === "log" &&
                    (following.startsWith(" in") ||
                        following.startsWith(" out"))
                ) {
                    continue;
                }

                // Avoid duplicates
                if (!results.some((r) => r.key === termKey)) {
                    results.push({ term: glossaryValue, key: termKey });
                }
                // Only need one match per term per segment
                break;
            }
        }
    }

    return results;
}

/**
 * Escape special regex characters in a string.
 */
function escapeRegex(str: string): string {
    return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Check if a key has a case suffix.
 * Returns the suffix if found, or null if no case suffix.
 * When language is specified, only checks suffixes valid for that language.
 */
function getCaseSuffix(key: string, language?: Language): string | null {
    if (!language) return null;
    const caseOrder = getCaseOrderForLanguage(language);
    if (!caseOrder) return null;
    for (const suffix of caseOrder) {
        if (key.endsWith(suffix)) return suffix;
    }
    return null;
}

/**
 * Strip case suffix from a key to get the base form.
 * E.g., "access-token-gen" → "access-token", "scan-pre" → "scan"
 */
function stripCaseSuffix(key: string, language?: Language): string {
    const suffix = getCaseSuffix(key, language);
    if (suffix) {
        return key.slice(0, -suffix.length);
    }
    return key;
}

/**
 * Gender context suffixes used in adjectives: "_f" (feminine), "_n" (neuter).
 * These are stripped for ordering purposes so that "critical_f" and "critical_n"
 * are grouped with "critical".
 */
const GENDER_CONTEXT_SUFFIXES = ["_f", "_n"] as const;

/**
 * Strip gender context suffix from a key for ordering purposes.
 * E.g., "critical_f" → "critical", "limited-not_n" → "limited-not"
 * Does NOT strip "-not" or other non-gender suffixes.
 */
function stripGenderContext(key: string): string {
    for (const suffix of GENDER_CONTEXT_SUFFIXES) {
        if (key.endsWith(suffix)) {
            return key.slice(0, -suffix.length);
        }
    }
    return key;
}

function getOrderingLemma(key: string, language?: Language): string {
    // First strip gender context suffix (after _), e.g., "_f", "_n"
    const withoutGender = stripGenderContext(key);
    // Then strip "-not" suffix (negative form marker)
    const withoutNot = withoutGender.endsWith("-not")
        ? withoutGender.slice(0, -4)
        : withoutGender;
    // Then strip case suffix (if any)
    const withoutCase = stripCaseSuffix(withoutNot, language);
    // Then try to convert to singular
    const singular = toGlossarySingular(withoutCase);
    if (singular) {
        return singular;
    }
    return withoutCase;
}

/**
 * Get the expected suffix order index for a key within its lemma group.
 * Returns a sort key that ensures correct ordering:
 * - Singular (no suffix) comes first
 * - Then case suffixes in language-specific order
 * - Then plural forms
 * - Then plural + case suffixes
 */
function getSuffixOrderIndex(
    key: string,
    language: Language,
    namespace: string,
): number {
    const caseOrder = getCaseOrderForLanguage(language) ?? [];

    // Check for case suffix
    const caseSuffix = getCaseSuffix(key, language);
    const caseIndex = caseSuffix ? caseOrder.indexOf(caseSuffix) : -1;

    // Check for gender context suffix (after _), e.g., "_f", "_n"
    const genderSuffix = GENDER_CONTEXT_SUFFIXES.find((s) => key.endsWith(s));
    const contextIndex = genderSuffix
        ? GENDER_CONTEXT_SUFFIXES.indexOf(genderSuffix)
        : -1;

    // Check for "-not" suffix (negative form marker)
    const hasNot =
        key.endsWith("-not") ||
        key.endsWith("-not_f") ||
        key.endsWith("-not_n");

    // Check for plural — strip gender, -not, and case suffixes first so that
    // e.g. "lemmas_f" → "lemmas" → plural, "lemmas-not_f" → "lemmas" → plural
    const baseForPlural = stripGenderContext(key);
    const baseWithoutNot = baseForPlural.endsWith("-not")
        ? baseForPlural.slice(0, -4)
        : baseForPlural;
    const base = stripCaseSuffix(baseWithoutNot, language);
    const isPlural = toGlossarySingular(base) !== null;

    // Case ordering for the glossary namespace in languages that support grammatical cases
    if (namespace === GLOSSARY_NAMESPACE && caseOrder.length > 0) {
        if (!isPlural && caseIndex === -1) return 0; // singular nom
        if (!isPlural && caseIndex >= 0) return 1 + caseIndex; // singular case
        if (isPlural && caseIndex === -1) return 100; // plural nom
        if (isPlural && caseIndex >= 0) return 101 + caseIndex; // plural case
    }

    if (namespace === ADJECTIVES_NAMESPACE) {
        // For adjectives: order by number (singular/plural), then -not, then gender.
        // Desired order:
        //   lemma (0), lemma_f (1), lemma_n (2),
        //   lemmas (100), lemmas_f (101), lemmas_n (102),
        //   lemma-not (200), lemma-not_f (201), lemma-not_n (202),
        //   lemmas-not (300), lemmas-not_f (301), lemmas-not_n (302)
        const baseIndex = isPlural ? 100 : 0;
        const notOffset = hasNot ? 200 : 0;
        const genderOffset = contextIndex >= 0 ? 1 + contextIndex : 0;
        return baseIndex + notOffset + genderOffset;
    }

    // For non-glossary or non-case languages: singular before plural
    if (!isPlural) return 0;
    return 100;
}

/**
 * Check the ordering of first-level keys in the namespaces scoped by the
 * "key-ordering" rule.
 *
 * Rules:
 * 1. First-level terms should be in alphabetical order by lemma
 * 2. Plural forms should stay adjacent to their singular (e.g., scan and scans together)
 * 3. For Russian glossary: case suffix order must be: (none=nom), -gen, -dat, -acc, -ins, -pre
 * 4. For Turkish glossary: case suffix order must be: (none=nom), -gen, -dat, -acc, -loc, -abl
 *
 * @param firstLevelKeys - The first-level keys in the order they appear in the file
 * @param namespace - The namespace being checked (e.g., "glossary", "common", "adj")
 * @param language - The language code
 * @returns Array of { key, expectedPosition, note } for each misplaced key
 */
export function checkKeyOrdering(
    firstLevelKeys: string[],
    namespace: string,
    language: Language,
): Array<{ key: string; expectedPosition: string; note: string }> {
    const issues: Array<{
        key: string;
        expectedPosition: string;
        note: string;
    }> = [];

    if (firstLevelKeys.length <= 1) return issues;

    // Group keys by lemma
    const lemmaGroups = new Map<string, string[]>();
    for (const key of firstLevelKeys) {
        const lemma = getOrderingLemma(key, language);
        if (!lemmaGroups.has(lemma)) {
            lemmaGroups.set(lemma, []);
        }
        lemmaGroups.get(lemma)!.push(key);
    }

    // Build expected order: sort lemma groups alphabetically, then within each
    // lemma group sort by suffix order (singular nominative → singular cases →
    // plural nominative → plural cases).
    const sortedLemmas = Array.from(lemmaGroups.keys()).sort((a, b) =>
        a.localeCompare(b, "en"),
    );

    const expectedOrder: string[] = [];
    for (const lemma of sortedLemmas) {
        const group = lemmaGroups.get(lemma)!;
        // Sort within group by suffix order
        group.sort((a, b) => {
            const orderA = getSuffixOrderIndex(a, language, namespace);
            const orderB = getSuffixOrderIndex(b, language, namespace);

            // If both have the same suffix order index, sort by key length (shorter first)
            if (orderA === orderB) {
                return a.length - b.length;
            }
            return orderA - orderB;
        });
        expectedOrder.push(...group);
    }

    // Compare actual order with expected order
    // Build a map of key → expected index
    const expectedIndexMap = new Map<string, number>();
    expectedOrder.forEach((key, index) => {
        expectedIndexMap.set(key, index);
    });

    // Check each key's position
    for (let i = 0; i < firstLevelKeys.length; i++) {
        const key = firstLevelKeys[i];
        const expectedIdx = expectedIndexMap.get(key)!;

        if (i !== expectedIdx) {
            // Find what key should be at this position
            const expectedKey = expectedOrder[i];
            const lemma = getOrderingLemma(key, language);
            const expectedLemma = getOrderingLemma(expectedKey, language);

            let note: string;
            if (lemma !== expectedLemma) {
                // Wrong lemma position — alphabetical order issue
                note = `Key "${key}" (lemma: "${lemma}") is out of alphabetical order. Expected key "${expectedKey}" (lemma: "${expectedLemma}") at this position.`;
            } else {
                // Same lemma, wrong suffix order
                note = `Key "${key}" is out of suffix order within lemma group "${lemma}". Expected "${expectedKey}" at this position.`;
            }

            issues.push({
                key,
                expectedPosition: expectedKey,
                note,
            });
        }
    }

    return issues;
}

export function makeCandidate(
    keyPath: string,
    currentValue: string,
    issueTypes: KeyIssue["issueTypes"],
    notes: KeyIssue["notes"],
    namespace: KeyIssue["namespace"],
    suggestedReplacements: KeyIssue["suggestedReplacements"] = [],
): KeyIssue {
    return {
        keyPath,
        currentValue,
        issueTypes,
        suggestedReplacements,
        suggestedGlossaryType: null,
        suggestedKey: null,
        notes,
        namespace,
    };
}
