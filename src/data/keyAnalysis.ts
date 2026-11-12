import type { KeyIssue, IssueType, Language } from "../types/glossary";
import { buildGlossaryIndex } from "./glossaryIndex";
import { getNamespaceData } from "./translations";
import {
    flattenObject,
    extractReferences,
    detectSyntaxErrors,
    keyExistsInSet,
    findSimilarKey,
    makeCandidate,
    toGlossarySingular,
    PLURAL_CONTEXT_SUFFIXES,
    getAllowedPluralContextsForLanguage,
    buildGlossaryValueMap,
    detectHardcodedGlossaryTerms,
    checkKeyOrdering,
} from "./analysisUtils";
import {
    isRuleApplicable,
    isRuleApplicableForNamespace,
    getCrossBlockRefConfig,
} from "./rulesUtils";
import { getLanguageLabel } from "./languages";
import { ALL_NAMESPACES, GLOSSARY_NAMESPACE } from "./namespaces";

/**
 * Resolve a dot-separated key path within a nested object.
 *
 * Reference keys are stored as flat paths (e.g., "auth-data.http-basic-auth"),
 * but the raw namespace data is nested (e.g., { "auth-data": { "http-basic-auth": "..." } }).
 * This walks the nested structure segment by segment.
 *
 * @returns The resolved value, or undefined if any segment is missing.
 */
function resolveKeyPath(data: Record<string, unknown>, keyPath: string): unknown {
    let current: unknown = data;
    for (const segment of keyPath.split(".")) {
        if (
            current === null ||
            typeof current !== "object" ||
            Array.isArray(current)
        ) {
            return undefined;
        }
        current = (current as Record<string, unknown>)[segment];
    }
    return current;
}

/**
 * Resolve the effective first character of a referenced key's value by following
 * $t(namespace:key) reference chains recursively across any namespace.
 *
 * For example, if glossary:target-groups → "$t(glossary:target-group)" and
 * glossary:target-group → "目标组", then the effective first character is "目" (CJK).
 *
 * @param namespace - The namespace of the reference (e.g., "glossary", "common")
 * @param key - The key to look up within the namespace
 * @param namespaceData - Map of namespace → raw inner data for the current language
 * @param visited - Set of already-visited "namespace:key" pairs to prevent circular references
 * @returns The effective first character after resolving all $t() chains
 */
function getEffectiveFirstChar(
    namespace: string,
    key: string,
    namespaceData: Record<string, Record<string, unknown>>,
    visited: Set<string> = new Set(),
): string {
    const visitKey = `${namespace}:${key}`;
    if (visited.has(visitKey)) {
        return ""; // Circular reference — return empty
    }

    const nsData = namespaceData[namespace];
    if (!nsData) {
        // Namespace not found — fall back to checking the key name
        return key.charAt(0);
    }

    // The reference key is a dot-separated path into the nested namespace data,
    // so we must traverse the structure rather than do a flat lookup.
    const rawValue = resolveKeyPath(nsData, key);
    if (typeof rawValue !== "string") {
        // Key not found or not a string — fall back to checking the key name
        return key.charAt(0);
    }

    // Check if the value starts with a $t(namespace:key) reference,
    // optionally carrying a capitalizeFirstLetter modifier.
    const refMatch = rawValue.match(
        /^\$t\(([^:,)]+):([^,)]+?)(,\s*capitalizeFirstLetter)?\)/,
    );
    if (refMatch) {
        const refNamespace = refMatch[1].trim();
        const refKey = refMatch[2].trim();
        const hasCapitalize = Boolean(refMatch[3]);
        visited.add(visitKey);
        const nestedChar = getEffectiveFirstChar(
            refNamespace,
            refKey,
            namespaceData,
            visited,
        );
        // If the nested reference applies capitalizeFirstLetter, its resolved
        // first character is uppercased — reflect that in the effective char.
        if (hasCapitalize && nestedChar) {
            return nestedChar.toUpperCase();
        }
        return nestedChar;
    }

    // No leading $t() reference — return the first character of the raw value
    return rawValue.charAt(0);
}

/**
 * Analyze a set of flat keys against cross-reference rules.
 *
 * Each key produces exactly one candidate with potentially multiple issue types,
 * notes, and suggested replacements (all arrays, parallel by index).
 *
 * @param flatKeys - Flattened key-value pairs from the file
 * @param namespace - The namespace being analyzed (e.g., "dashboard", "common", "glossary")
 * @param language - Current language code
 * @param index - Glossary index for the language
 * @param enIndex - Optional English glossary index for fallback checking
 */
function analyzeFile(
    flatKeys: Array<{ keyPath: string; value: string }>,
    namespace: string,
    language: Language,
    index: ReturnType<typeof buildGlossaryIndex>,
    enIndex: ReturnType<typeof buildGlossaryIndex> | null = null,
    glossaryValueMap: Map<string, string> | null = null,
    firstLevelKeys: string[] | null = null,
    /** Map of namespace → raw inner data for the current language, used to look up referenced key values */
    namespaceData: Record<string, Record<string, unknown>> | null = null,
): KeyIssue[] {
    const candidates: KeyIssue[] = [];

    for (const { keyPath, value } of flatKeys) {
        const fullKeyPath = `${namespace}.${keyPath}`;
        const issueTypes: IssueType[] = [];
        const notes: string[] = [];
        const suggestedReplacements: (string | null)[] = [];

        // ── 1. Check for invalid plural context suffixes ─────────────────────
        // Each language allows a specific set of plural context suffixes (_one, _other, _few, _many, _only).
        // If a key uses a suffix not allowed for its language, flag it.
        if (isRuleApplicable("invalid-plural-context", language)) {
            const lastSegment = keyPath.split(".").pop() ?? keyPath;
            const allowedPluralContexts =
                getAllowedPluralContextsForLanguage(language);
            for (const suffix of PLURAL_CONTEXT_SUFFIXES) {
                if (
                    lastSegment.endsWith(suffix) &&
                    !allowedPluralContexts.has(suffix)
                ) {
                    issueTypes.push("invalid-plural-context");
                    notes.push(
                        `Key "${lastSegment}" uses plural context "${suffix}" which is not valid for ${language}. Allowed plural contexts for ${language}: ${Array.from(allowedPluralContexts).join(", ")}`,
                    );
                    suggestedReplacements.push(null);
                    break;
                }
            }
        }

        // ── 2. Check for syntax errors in $t() calls ─────────────────────────
        if (isRuleApplicable("syntax-error", language)) {
            const syntaxErrors = detectSyntaxErrors(value);
            if (syntaxErrors.length > 0) {
                issueTypes.push("syntax-error");
                notes.push(syntaxErrors.map((e) => e.description).join("; "));
                suggestedReplacements.push(null);
                candidates.push(
                    makeCandidate(
                        fullKeyPath,
                        value,
                        issueTypes,
                        notes,
                        namespace,
                        suggestedReplacements,
                    ),
                );
                continue;
            }
        }

        // ── 3. Check for redundant capitalizeFirstLetter modifier ────────────
        //     capitalizeFirstLetter should only be used when the referenced key's
        //     value starts with a lowercase letter. If the value starts with an
        //     uppercase letter, digit, or any non-letter character (including CJK
        //     characters), the modifier is redundant and a warning is shown.
        if (isRuleApplicable("redundant-modifier", language)) {
            const capitalizeRefs = extractReferences(value);
            let hasRedundantModifier = false;
            let redundantModifierNote = "";
            for (const ref of capitalizeRefs) {
                if (ref.hasCapitalizeFirstLetter) {
                    // Determine the effective first character of the referenced key's value:
                    // Resolve $t() chains recursively across any namespace to find
                    // the actual text content (e.g., "target-groups" → "$t(glossary:target-group)"
                    // → "target-group" → "目标组" → first char "目")
                    // If namespace data is not available, fall back to checking the key name
                    let firstChar: string;
                    if (ref.hasNamespace && ref.namespace && namespaceData) {
                        firstChar = getEffectiveFirstChar(
                            ref.namespace,
                            ref.key,
                            namespaceData,
                        );
                    } else {
                        firstChar = ref.key.charAt(0);
                    }
                    // Check if the character is a lowercase letter (Unicode-aware).
                    // Works for ASCII (a-z), Cyrillic (т, я), Greek (α, ω), etc.
                    const isLowercase =
                        firstChar !== firstChar.toUpperCase() &&
                        firstChar === firstChar.toLowerCase();
                    if (!isLowercase) {
                        // Value starts with uppercase, digit, or non-letter character (CJK, etc.)
                        // → capitalizeFirstLetter is redundant
                        hasRedundantModifier = true;
                        redundantModifierNote = `Redundant capitalizeFirstLetter modifier in "${ref.fullMatch}" — referenced key "${ref.key}" has value starting with "${firstChar}" which is not a lowercase letter`;
                        break;
                    }
                    // If value starts with a lowercase letter, the modifier is valid — no issue
                }
            }
            if (hasRedundantModifier) {
                issueTypes.push("redundant-modifier");
                notes.push(redundantModifierNote);
                suggestedReplacements.push(null);
                candidates.push(
                    makeCandidate(
                        fullKeyPath,
                        value,
                        issueTypes,
                        notes,
                        namespace,
                        suggestedReplacements,
                    ),
                );
                continue;
            }
        }

        // ── 4. Extract and analyze $t() references ───────────────────────────
        const refs = extractReferences(value);

        // 4a. File-type-specific cross-block reference rules from config
        const crossBlockConfig = getCrossBlockRefConfig(namespace);
        if (crossBlockConfig) {
            if (crossBlockConfig.forbidAll && refs.length > 0) {
                // File type cannot contain ANY $t() references
                const refDescriptions = refs
                    .map((r) => `"${r.fullMatch}"`)
                    .join(", ");
                issueTypes.push("cross-block-ref");
                notes.push(
                    `${namespace} contains $t() references: ${refDescriptions}. This namespace must not reference any other keys.`,
                );
                suggestedReplacements.push(null);
                candidates.push(
                    makeCandidate(
                        fullKeyPath,
                        value,
                        issueTypes,
                        notes,
                        namespace,
                        suggestedReplacements,
                    ),
                );
                continue;
            }

            if (crossBlockConfig.allowNamespaceLess === false) {
                // Namespace-less refs are not allowed
                let hasNamespaceLessRef = false;
                let namespaceLessNote = "";
                let suggestion: string | null = null;
                for (const ref of refs) {
                    if (!ref.hasNamespace) {
                        hasNamespaceLessRef = true;
                        const allowedNamespaces =
                            crossBlockConfig.namespaces?.join(", ") ??
                            "namespaced";
                        namespaceLessNote = `${namespace} contains namespace-less reference "$t(${ref.key})". ${namespace} keys must use namespaced references (${allowedNamespaces}).`;
                        suggestion = `$t(${crossBlockConfig.namespaces?.[0] ?? "common"}:${ref.key})`;
                        break;
                    }
                }
                if (hasNamespaceLessRef) {
                    issueTypes.push("cross-block-ref");
                    notes.push(namespaceLessNote);
                    suggestedReplacements.push(suggestion);
                    candidates.push(
                        makeCandidate(
                            fullKeyPath,
                            value,
                            issueTypes,
                            notes,
                            namespace,
                            suggestedReplacements,
                        ),
                    );
                    continue;
                }
            }

            if (crossBlockConfig.namespaces) {
                // Only specific namespaces are allowed
                let hasInvalidRef = false;
                let invalidRefNote = "";
                let invalidSuggestion: string | null = null;
                for (const ref of refs) {
                    if (!ref.hasNamespace) continue; // handled above
                    if (!crossBlockConfig.namespaces.includes(ref.namespace!)) {
                        hasInvalidRef = true;
                        invalidRefNote = `${namespace} references "${ref.namespace}:${ref.key}" — namespace "${ref.namespace}" is not allowed. ${namespace} can only reference ${crossBlockConfig.namespaces.join(": or ")}: keys.`;
                        if (crossBlockConfig.namespaces.length > 0) {
                            invalidSuggestion = `$t(${crossBlockConfig.namespaces[0]}:${ref.key})`;
                        }
                        break;
                    }
                }
                if (hasInvalidRef) {
                    issueTypes.push("cross-block-ref");
                    notes.push(invalidRefNote);
                    suggestedReplacements.push(invalidSuggestion);
                    candidates.push(
                        makeCandidate(
                            fullKeyPath,
                            value,
                            issueTypes,
                            notes,
                            namespace,
                            suggestedReplacements,
                        ),
                    );
                    continue;
                }
            }
        }

        // 4b. Check for invalid references (type:key where key doesn't exist or invalid namespace)
        //     With English fallback: if key is missing in target language but exists in en → warning,
        //     if key is missing in both → error with typo detection against English reference.
        let hasInvalidRef = false;

        for (const ref of refs) {
            if (!ref.hasNamespace) {
                // Some namespaces allow namespace-less refs (they resolve against
                // DEFAULT_NAMESPACE); the rest are handled above via crossBlockConfig
                const config = getCrossBlockRefConfig(namespace);
                if (!config?.allowNamespaceLess) {
                    hasInvalidRef = true;
                    issueTypes.push("wrong-key");
                    notes.push(
                        `Namespace-less reference "$t(${ref.key})" is not allowed in ${namespace}.`,
                    );
                    suggestedReplacements.push(null);
                }
                continue;
            }

            if (!ref.namespace || !ALL_NAMESPACES.includes(ref.namespace)) {
                hasInvalidRef = true;
                issueTypes.push("wrong-key");
                notes.push(
                    `Invalid namespace "${ref.namespace}" in "$t(${ref.namespace}:${ref.key})" — must be one of: ${ALL_NAMESPACES.join(", ")}`,
                );
                suggestedReplacements.push(null);
                break;
            }

            // Determine which set to check based on namespace
            const currentSet: Set<string> = index[ref.namespace] ?? new Set();
            const enSet: Set<string> | null = enIndex
                ? (enIndex[ref.namespace] ?? null)
                : null;
            const namespaceLabel = ref.namespace;

            // Use lemma-based matching: check if the lemma (without context suffix) exists
            if (!keyExistsInSet(ref.key, currentSet)) {
                // ── Check for plural glossary references ──────────────────────────
                // Some languages have no plural forms, so glossary references must use singular.
                // If the key doesn't exist in this language's glossary but exists in en glossary,
                // and the singular form exists in this language's glossary, flag as plural-glossary-ref.
                if (
                    isRuleApplicable("plural-glossary-ref", language) &&
                    ref.namespace === GLOSSARY_NAMESPACE &&
                    enSet &&
                    keyExistsInSet(ref.key, enSet)
                ) {
                    const singular = toGlossarySingular(ref.key);
                    if (singular && keyExistsInSet(singular, currentSet)) {
                        hasInvalidRef = true;
                        issueTypes.push("plural-glossary-ref");
                        notes.push(
                            `${getLanguageLabel(language)} references glossary term "${ref.key}" in plural form — this language has no plural forms. Use singular "${singular}" instead.`,
                        );
                        suggestedReplacements.push(`$t(${GLOSSARY_NAMESPACE}:${singular})`);
                        continue;
                    }
                }

                // Key not found in current language — check English fallback
                if (enSet && language !== "en") {
                    if (keyExistsInSet(ref.key, enSet)) {
                        // Key exists in English but not in target language → warning
                        hasInvalidRef = true;
                        issueTypes.push("missing-in-lang");
                        notes.push(
                            `References ${ref.namespace}:${ref.key} — key exists in en but is missing in ${language} ${namespaceLabel} (English fallback will be used)`,
                        );
                        suggestedReplacements.push(null);
                        break;
                    }
                }

                // Key doesn't exist in either current language or English → error
                // Try to find a similar key in the English set (the reference), since English
                // has all the correct keys. This ensures consistent typo detection across all languages.
                const searchSet = enSet ?? currentSet;
                const similarKey = findSimilarKey(ref.key, searchSet);
                hasInvalidRef = true;

                if (similarKey) {
                    const suggestion =
                        "$t(" + ref.namespace + ":" + similarKey + ")";

                    // Always emit a typo issue with the suggestion
                    issueTypes.push("typo");
                    notes.push(
                        `References ${ref.namespace}:${ref.key} which does not exist in ${language} ${namespaceLabel}. Did you mean "${similarKey}"?`,
                    );
                    suggestedReplacements.push(suggestion);

                    // If the suggested key also doesn't exist in the target language,
                    // additionally emit a missing-in-lang issue
                    if (
                        enSet &&
                        language !== "en" &&
                        !keyExistsInSet(similarKey, currentSet)
                    ) {
                        issueTypes.push("missing-in-lang");
                        notes.push(
                            `References ${ref.namespace}:${similarKey} — key exists in en but is missing in ${language} ${namespaceLabel} (English fallback will be used)`,
                        );
                        suggestedReplacements.push(null);
                    }
                } else {
                    issueTypes.push("wrong-key");
                    notes.push(
                        `References ${ref.namespace}:${ref.key} which does not exist in ${language} ${namespaceLabel}`,
                    );
                    suggestedReplacements.push(null);
                }
                break;
            }
        }

        // ── 5. Check key ordering for applicable file types ─────────────────
        // This check runs once per file (not per key), using the first-level keys.
        // We only run it on the first iteration (first flat key) to avoid duplicates.
        if (
            isRuleApplicable("key-ordering", language) &&
            isRuleApplicableForNamespace("key-ordering", namespace) &&
            firstLevelKeys
        ) {
            // Only run this check once — on the first key of the file
            if (flatKeys.length > 0 && flatKeys[0].keyPath === keyPath) {
                const orderingIssues = checkKeyOrdering(
                    firstLevelKeys,
                    namespace,
                    language,
                );
                for (const issue of orderingIssues) {
                    // Find the current value of the misplaced key from flatKeys
                    const issueValue =
                        flatKeys.find(
                            (fk) =>
                                fk.keyPath === issue.key ||
                                fk.keyPath.startsWith(issue.key + "."),
                        )?.value ?? "";
                    // Create a separate candidate for each ordering issue
                    candidates.push(
                        makeCandidate(
                            `${namespace}.${issue.key}`,
                            issueValue,
                            ["key-ordering"],
                            [issue.note],
                            namespace,
                            [null],
                        ),
                    );
                }
            }
        }

        // ── 6. Check for hardcoded glossary terms in plain text ──────────────
        if (
            isRuleApplicable("hardcoded-glossary-term", language) &&
            isRuleApplicableForNamespace("hardcoded-glossary-term", namespace) &&
            glossaryValueMap
        ) {
            const hardcodedTerms = detectHardcodedGlossaryTerms(
                value,
                glossaryValueMap,
            );
            for (const { term, key } of hardcodedTerms) {
                hasInvalidRef = true;
                issueTypes.push("hardcoded-glossary-term");
                notes.push(
                    `Value contains glossary term "${term}" as plain text — should use $t(${GLOSSARY_NAMESPACE}:${key}) reference instead`,
                );
                suggestedReplacements.push(`$t(${GLOSSARY_NAMESPACE}:${key})`);
            }
        }

        if (hasInvalidRef || issueTypes.length > 0) {
            candidates.push(
                makeCandidate(
                    fullKeyPath,
                    value,
                    issueTypes,
                    notes,
                    namespace,
                    suggestedReplacements,
                ),
            );
            continue;
        }
    }

    return candidates;
}

/**
 * Analyze all translation files for a given language and return detected issues.
 * Uses English as fallback: if a key is missing in the target language but exists
 * in English, it's flagged as a warning ('missing-in-lang'). If missing in both,
 * it's flagged as an error ('wrong-key').
 *
 * Dynamically analyzes every namespace found in the translation files.
 */
export function analyzeKeys(language: Language): KeyIssue[] {
    const index = buildGlossaryIndex(language);
    const enIndex = language !== "en" ? buildGlossaryIndex("en") : null;

    // Build glossary value map for the current language for hardcoded term detection
    // Resolves $t() references in glossary values to get the full plain text
    const gData = getNamespaceData(GLOSSARY_NAMESPACE, language);
    const currentGlossaryInner = gData?.inner ?? {};
    const glossaryValueMap = buildGlossaryValueMap(currentGlossaryInner);

    // Build a map of namespace → raw inner data for all namespaces
    // Used by the redundant-modifier check to look up referenced key values
    const namespaceData: Record<string, Record<string, unknown>> = {};
    for (const ns of ALL_NAMESPACES) {
        const data = getNamespaceData(ns, language);
        if (data) {
            namespaceData[ns] = data.inner;
        }
    }

    const allCandidates: KeyIssue[] = [];

    // Dynamically analyze all namespaces
    for (const namespace of ALL_NAMESPACES) {
        const fileData = getNamespaceData(namespace, language);
        if (!fileData) continue;

        const flat = flattenObject(fileData.inner);
        const candidates = analyzeFile(
            flat,
            namespace,
            language,
            index,
            enIndex,
            glossaryValueMap,
            fileData.firstLevelKeys,
            namespaceData,
        );
        allCandidates.push(...candidates);
    }

    return allCandidates;
}

/**
 * Get the total key count for a given language across all files.
 */
export function getKeyCount(language: Language): number {
    let total = 0;
    for (const namespace of ALL_NAMESPACES) {
        const fileData = getNamespaceData(namespace, language);
        if (!fileData) continue;
        total += flattenObject(fileData.inner).length;
    }
    return total;
}

/**
 * Get the key count for a specific namespace and language.
 */
export function getFileKeyCount(language: Language, namespace: string): number {
    const fileData = getNamespaceData(namespace, language);
    if (!fileData) return 0;
    return flattenObject(fileData.inner).length;
}

/**
 * Get the en.json key count for comparison (to detect missing sections).
 */
export function getEnKeyCount(): number {
    return getKeyCount("en");
}
