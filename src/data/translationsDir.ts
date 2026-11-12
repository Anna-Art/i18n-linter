/**
 * Path to the translations directory relative to the src/data/ directory.
 * All translation JSON files are stored under this path.
 *
 * To change the translations directory location, update this constant.
 */
export const TRANSLATIONS_DIR = "../translations";

/**
 * Glob pattern for discovering all translation JSON files.
 * Used by Vite's import.meta.glob for dynamic file discovery.
 *
 * To change the translations directory location, update TRANSLATIONS_DIR
 * — this pattern is derived from it.
 */
export const TRANSLATIONS_GLOB_PATTERN = `${TRANSLATIONS_DIR}/**/*.json`;
