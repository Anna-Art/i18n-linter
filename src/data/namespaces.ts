/**
 * Namespace definitions and scoping helpers.
 *
 * A namespace is the first-level key inside a translation JSON file:
 * a file containing { "dashboard": { ... } } provides the namespace "dashboard".
 * Namespaces are the only identity used across the app — directory names in the
 * translations repository are never used and have no meaning here.
 *
 * The list itself is built in ./translations.ts, which owns file loading.
 */

export { ALL_NAMESPACES } from "./translations";

export type Namespace = string;

export type NamespaceScope = "all" | Namespace[];

/**
 * Default namespace for the project.
 * Keys without an explicit namespace in $t() references are resolved against
 * this namespace. It cannot be derived from the files — it is a per-project
 * setting and the only place where a namespace name is written down by hand.
 */
export const DEFAULT_NAMESPACE: Namespace = "dashboard";

/**
 * Namespace holding the glossary terms.
 * Several checks treat it specially (glossary references, hardcoded terms),
 * so its name is configured here rather than spelled out at every call site.
 */
export const GLOSSARY_NAMESPACE: Namespace = "glossary";

/**
 * Namespace holding the adjectives.
 * Its keys use gender context suffixes, which gives them their own key ordering.
 */
export const ADJECTIVES_NAMESPACE: Namespace = "adj";

/**
 * Check if a namespace is included in a scope specification.
 */
export function isNamespaceInScope(
    namespace: Namespace,
    scope: NamespaceScope,
): boolean {
    if (scope === "all") {
        return true;
    }
    return scope.includes(namespace);
}
