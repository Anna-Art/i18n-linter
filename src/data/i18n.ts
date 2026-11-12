/**
 * i18next configuration for compiling translation values.
 *
 * Loads all translation files and configures i18next with resources
 * for each language and namespace, enabling $t() reference resolution.
 */

import i18n from "i18next";
import { getNamespaceData } from "./translations";
import { ALL_NAMESPACES, DEFAULT_NAMESPACE } from "./namespaces";
import { ALL_LANGUAGES } from "./languages";
import type { Language } from "../types/glossary";

/**
 * Build a flat key-value map from nested translation data.
 * E.g., { "auth-data": { "cookie": "cookie" } } → { "auth-data.cookie": "cookie" }
 */
function flattenTranslations(
    obj: Record<string, unknown>,
    prefix = "",
): Record<string, string> {
    const result: Record<string, string> = {};

    for (const [key, value] of Object.entries(obj)) {
        const fullKey = prefix ? `${prefix}.${key}` : key;

        if (typeof value === "string") {
            result[fullKey] = value;
        } else if (Array.isArray(value)) {
            value.forEach((item, index) => {
                if (typeof item === "string") {
                    result[`${fullKey}[${index}]`] = item;
                }
            });
        } else if (typeof value === "object" && value !== null) {
            Object.assign(
                result,
                flattenTranslations(value as Record<string, unknown>, fullKey),
            );
        }
    }

    return result;
}

/**
 * Build i18next resources object from all translation files.
 * Structure: { [lang]: { [namespace]: { [key]: [value] } } }
 */
function buildResources(): Record<
    string,
    Record<string, Record<string, string>>
> {
    const resources: Record<
        string,
        Record<string, Record<string, string>>
    > = {};

    for (const language of ALL_LANGUAGES) {
        resources[language] = {};

        for (const namespace of ALL_NAMESPACES) {
            const data = getNamespaceData(namespace, language);
            if (!data) continue;

            const flatKeys = flattenTranslations(
                data.inner as Record<string, unknown>,
            );
            resources[language][namespace] = flatKeys;
        }
    }

    return resources;
}

/**
 * Initialize i18next with all translation resources.
 * This should be called once at app startup.
 */
export function initI18n() {
    if (i18n.isInitialized) return;

    const resources = buildResources();

    i18n.init({
        resources,
        fallbackLng: "en",
        defaultNS: DEFAULT_NAMESPACE,
        interpolation: {
            escapeValue: false, // not needed for this use case
        },
    });

    // Register the `capitalizeFirstLetter` formatter.
    //
    // In the project's translation files this is used as a nested-reference
    // modifier: `$t(namespace:key, capitalizeFirstLetter)`. i18next resolves
    // nested `$t()` references itself during `t()` and treats everything after
    // the comma as a formatter name. Without a registered formatter of that
    // name, i18next silently drops it ("no format function for ...") and the
    // referenced value is inserted verbatim — leaving the first letter lowercase.
    //
    // Registering it here lets i18next apply the modifier natively and
    // recursively at every nesting level.
    i18n.services.formatter?.add("capitalizeFirstLetter", (value) => {
        if (typeof value !== "string" || value.length === 0) {
            return value;
        }
        return value.charAt(0).toUpperCase() + value.slice(1);
    });
}

/**
 * Get the compiled (resolved) value for a key using i18next.
 *
 * Nested `$t()` references — including the `capitalizeFirstLetter` modifier,
 * which is registered as an i18next formatter in `initI18n()` — are resolved
 * natively by i18next during the `t()` call, recursively at every level.
 *
 * @param namespace - The namespace (e.g., "common", "glossary")
 * @param key - The key within the namespace (e.g., "auth-data.cookie")
 * @param language - The language to use for translation
 */
export function compileTranslation(
    namespace: string,
    key: string,
    language: Language,
): string {
    if (!i18n.isInitialized) {
        // Fallback: return the key itself if i18n is not initialized
        return `${namespace}:${key}`;
    }

    const rawValue = i18n.t(`${namespace}:${key}`, {
        lng: language,
        returnObjects: false,
        defaultValue: key,
    }) as string;

    if (typeof rawValue !== "string") {
        return key;
    }

    return rawValue;
}

/**
 * Get all loaded languages from i18next.
 */
export function getLoadedLanguages(): Language[] {
    if (!i18n.isInitialized) return ALL_LANGUAGES;
    return i18n.languages as Language[];
}

/**
 * Get all loaded namespaces for a given language.
 */
export function getNamespacesForLanguage(language: Language): string[] {
    if (!i18n.isInitialized) return ALL_NAMESPACES;

    const resources = i18n.options?.resources as
        | Record<string, Record<string, Record<string, string>>>
        | undefined;
    if (!resources) return ALL_NAMESPACES;

    const langResources = resources[language];
    if (!langResources) return ALL_NAMESPACES;

    return Object.keys(langResources);
}
