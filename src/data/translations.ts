import type { Language } from "../types/glossary";

/**
 * Loader for all translation files.
 *
 * Files are discovered with Vite's import.meta.glob, so any JSON file added
 * under the translations directory is picked up automatically.
 *
 * Only two things are read from a file:
 *   - the language code, taken from the file name ("en.json" → "en")
 *   - the namespace(s), taken from the first-level key(s) inside the JSON
 *     (a file containing { "dashboard": { ... } } provides namespace "dashboard")
 *
 * Directory names carry no meaning — a namespace is never derived from the
 * folder a file happens to live in, so the translations repository is free to
 * reorganize its directory layout.
 *
 * NOTE: The glob pattern below is transformed by the translationsGlobPlugin
 * at build time. To change the translations path, update TRANSLATIONS_DIR in
 * ./translationsDir.ts.
 */

/** The content of a namespace: everything under its first-level key. */
type NamespaceContent = Record<string, unknown>;

// Dynamic imports for all translation files.
// The path must be a static string literal for Vite's import.meta.glob
const allTranslationModules = import.meta.glob(__TRANSLATIONS_GLOB__, {
    eager: true,
}) as Record<string, { default: unknown }>;

/**
 * Build a nested structure: namespace → language → NamespaceContent
 */
function buildAllFiles(): Record<string, Record<Language, NamespaceContent>> {
    const allFiles: Record<string, Record<string, NamespaceContent>> = {};

    for (const [filePath, module] of Object.entries(allTranslationModules)) {
        // Only the file name matters, the directories leading to it do not:
        // ".../<any>/<dirs>/en.json" → language "en"
        const match = filePath.match(/([^/]+)\.json$/);
        if (!match) continue;
        const language = match[1];

        const content = module.default;
        if (!content || typeof content !== "object") continue;

        // Every first-level key of the file is a namespace
        for (const [namespace, inner] of Object.entries(
            content as Record<string, unknown>,
        )) {
            if (!inner || typeof inner !== "object") continue;

            if (!allFiles[namespace]) {
                allFiles[namespace] = {};
            }
            allFiles[namespace][language] = inner as NamespaceContent;
        }
    }

    return allFiles;
}

const allFiles = buildAllFiles();

/**
 * All available namespaces, dynamically derived from the first-level keys
 * inside the translation JSON files.
 */
export const ALL_NAMESPACES: string[] = Object.keys(allFiles).sort();

/**
 * Get translation data for a specific namespace and language.
 * Returns the namespace content (the object under the first-level key) and
 * its first-level keys, in file order.
 */
export function getNamespaceData(
    namespace: string,
    language: Language,
): { inner: Record<string, unknown>; firstLevelKeys: string[] } | null {
    const inner = allFiles[namespace]?.[language];
    if (!inner) return null;

    return { inner, firstLevelKeys: Object.keys(inner) };
}
