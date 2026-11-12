import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { translationsGlobPlugin } from "./src/data/translationsGlobPlugin.ts";
import { TRANSLATIONS_GLOB_PATTERN } from "./src/data/translationsDir.ts";

const __dirname = fileURLToPath(new URL(".", import.meta.url));

// https://vite.dev/config/
export default defineConfig({
    plugins: [react(), translationsGlobPlugin(TRANSLATIONS_GLOB_PATTERN)],
    build: {
        license: { fileName: "THIRD_PARTY_LICENSES.txt" },
    },
    resolve: {
        alias: {
            "@": resolve(__dirname, "src"),
        },
    },
});
