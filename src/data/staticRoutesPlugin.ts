import type { Plugin } from "vite";

/** Emit entry pages so static hosts can serve client routes without rewrites. */
export function staticRoutesPlugin(paths: readonly string[]): Plugin {
    return {
        name: "static-routes",
        apply: "build",
        enforce: "post",
        generateBundle(_options, bundle) {
            const entry = bundle["index.html"];
            if (!entry || entry.type !== "asset") {
                this.error("Static routes require an index.html entry.");
            }

            for (const path of paths) {
                const directory = path.replace(/^\/+|\/+$/g, "");
                if (!directory) continue;
                this.emitFile({
                    type: "asset",
                    fileName: `${directory}/index.html`,
                    source: entry.source,
                });
            }

            // Unknown URLs still reach the application's catch-all route.
            this.emitFile({
                type: "asset",
                fileName: "404.html",
                source: entry.source,
            });
        },
    };
}
