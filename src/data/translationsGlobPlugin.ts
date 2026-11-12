import type { Plugin } from "vite";

/**
 * Vite plugin that replaces `__TRANSLATIONS_GLOB__` placeholders
 * with the actual glob pattern before Vite processes import.meta.glob.
 *
 * This allows centralizing the translations path in TRANSLATIONS_DIR
 * while still satisfying Vite's requirement for static string literals.
 */
export function translationsGlobPlugin(pattern: string): Plugin {
    const replacement = {
        name: "translations-glob",
        transform(code: string, id: string) {
            // Only transform TypeScript/JavaScript files in src/data/
            if (!/\.(ts|tsx|js|jsx)$/.test(id)) return;
            if (!id.includes("/src/data/")) return;

            const placeholder = "__TRANSLATIONS_GLOB__";
            if (!code.includes(placeholder)) return;

            const transformed = code.replaceAll(
                placeholder,
                JSON.stringify(pattern),
            );

            return { code: transformed };
        },
    };

    return {
        ...replacement,
        enforce: "pre",
        config() {
            // Vite's dependency scanner has its own pipeline; it must see the
            // same literal glob as the development and production transforms.
            return {
                optimizeDeps: {
                    rolldownOptions: { plugins: [replacement] },
                },
            };
        },
    };
}
