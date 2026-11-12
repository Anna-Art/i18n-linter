/**
 * Query parameter helpers for URL-based routing of language and namespace.
 *
 * Supported params:
 *   - `lang` — language code (e.g. `en`, `ru`, `zh`)
 *   - `namespace` — namespace, i.e. the first-level key of a translation file
 *     (e.g. `dashboard`, `glossary`)
 *
 * Behavior for unknown values:
 *   - Unknown language → redirect to the first entry in `allLanguages`
 *   - Unknown namespace → redirect to the first entry in `allNamespaces`
 */

export type QueryParams = {
    lang?: string;
    namespace?: string;
};

/**
 * Read current URL query parameters.
 */
export function readQueryParams(): QueryParams {
    const params = new URLSearchParams(window.location.search);
    return {
        lang: params.get("lang") ?? undefined,
        namespace: params.get("namespace") ?? undefined,
    };
}

/**
 * Write query parameters to the URL without a full page reload.
 * Uses `history.replaceState` to avoid adding a new entry to the history stack.
 */
export function writeQueryParams(params: QueryParams): void {
    const search = new URLSearchParams();
    if (params.lang) search.set("lang", params.lang);
    if (params.namespace) search.set("namespace", params.namespace);
    const queryString = search.toString();
    const url = `${window.location.pathname}${queryString ? `?${queryString}` : ""}`;
    window.history.replaceState({}, "", url);
}

/**
 * Resolve a potentially invalid language code against the list of valid languages.
 * Returns the first valid language if the provided code is not found.
 */
export function resolveLanguage(
    code: string | undefined,
    allLanguages: string[],
): string {
    if (!code || !allLanguages.includes(code)) {
        return allLanguages[0] ?? "en";
    }
    return code;
}

/**
 * Resolve a potentially invalid namespace against the list of valid namespaces.
 * Returns the first valid namespace if the provided code is not found.
 */
export function resolveNamespace(
    code: string | undefined,
    allNamespaces: string[],
): string {
    if (!code || !allNamespaces.includes(code)) {
        return allNamespaces[0] ?? "";
    }
    return code;
}
