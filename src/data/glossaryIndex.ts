import type { GlossaryIndex, Language } from '../types/glossary';
import { getNamespaceData } from './translations';
import { ALL_NAMESPACES } from './namespaces';

/**
 * Recursively collect all leaf keys from a nested JSON object.
 * Returns dot-separated paths, e.g. "auth-data.cookie"
 */
function collectLeafKeys(obj: Record<string, unknown>, prefix = ''): string[] {
  const keys: string[] = [];
  for (const [key, value] of Object.entries(obj)) {
    const fullPath = prefix ? `${prefix}.${key}` : key;
    if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
      keys.push(...collectLeafKeys(value as Record<string, unknown>, fullPath));
    } else {
      keys.push(fullPath);
    }
  }
  return keys;
}

/**
 * Build an index of all keys for a given language, organized by namespace.
 * Dynamically covers every namespace discovered in the translation files.
 */
export function buildGlossaryIndex(language: Language): GlossaryIndex {
  const index: GlossaryIndex = {};

  for (const namespace of ALL_NAMESPACES) {
    const data = getNamespaceData(namespace, language);
    index[namespace] = new Set(collectLeafKeys(data?.inner ?? {}));
  }

  return index;
}

/**
 * Build an index of all keys from the English (base) files.
 */
export function buildBaseGlossaryIndex(): GlossaryIndex {
  return buildGlossaryIndex('en');
}

/**
 * Get all available glossary terms (from en) as a flat set.
 * Includes keys from all namespaces that contain referenceable terms.
 */
export function getAllGlossaryTerms(): Set<string> {
  const baseIndex = buildBaseGlossaryIndex();
  const allTerms = new Set<string>();
  for (const keySet of Object.values(baseIndex)) {
    for (const key of keySet) {
      allTerms.add(key);
    }
  }
  return allTerms;
}