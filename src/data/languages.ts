/**
 * Dynamic language detection from the translations directory structure.
 *
 * Scans all subdirectories of {TRANSLATIONS_DIR} for JSON files and extracts
 * language codes from filenames (e.g., "en.json" → "en", "en_devel.json" → "en_devel").
 *
 * The special value "all" is reserved and means "all languages".
 *
 * NOTE: The glob pattern below is transformed by the translationsGlobPlugin
 * at build time. To change the translations path, update TRANSLATIONS_DIR in
 * ./translationsDir.ts.
 */

export type Language = string;

export type LanguageScope = "all" | Language[];

/**
 * Resolve a language scope specification to an actual list of languages.
 * - "all" → returns all known languages
 * - Language[] → returns the array as-is
 */
export function resolveScope(
    scope: LanguageScope,
    allLanguages: Language[],
): Language[] {
    if (scope === "all") {
        return allLanguages;
    }
    return scope;
}

/**
 * Check if a language is included in a scope specification.
 */
export function isLanguageInScope(
    language: Language,
    scope: LanguageScope,
): boolean {
    if (scope === "all") {
        return true;
    }
    return scope.includes(language);
}

/**
 * Get all available languages by scanning the translations directories.
 * Uses Vite's import.meta.glob to dynamically discover files at build time.
 */
const translationModules = import.meta.glob(__TRANSLATIONS_GLOB__, {
    eager: true,
}) as Record<string, { default: unknown }>;

/**
 * All available language codes, dynamically detected from the filesystem.
 * The set is built by collecting all unique language codes across every
 * translation file, regardless of the directory it lives in.
 */
export const ALL_LANGUAGES: Language[] = (() => {
    const langSet = new Set<Language>();
    for (const filePath of Object.keys(translationModules)) {
        // Only the file name matters: ".../<any dirs>/en.json" → "en"
        const match = filePath.match(/([^/]+)\.json$/);
        if (match) {
            langSet.add(match[1]);
        }
    }
    return Array.from(langSet).sort();
})();

/**
 * Get the display label for a language code.
 * Simply uppercases the language code (e.g., "en" → "EN", "en_devel" → "EN_DEVEL").
 */
export function getLanguageLabel(language: Language): string {
    return language.toUpperCase();
}
