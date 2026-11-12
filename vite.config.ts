import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { translationsGlobPlugin } from "./src/data/translationsGlobPlugin.ts";
import { TRANSLATIONS_GLOB_PATTERN } from "./src/data/translationsDir.ts";

import { APP_ROUTES } from "./src/data/routes.ts";
import { staticRoutesPlugin } from "./src/data/staticRoutesPlugin.ts";

const __dirname = fileURLToPath(new URL(".", import.meta.url));

// https://vite.dev/config/
export default defineConfig({
    base: `${(process.env.PAGES_BASE_PATH ?? "").replace(/\/$/, "")}/`,
    plugins: [
        react(),
        translationsGlobPlugin(TRANSLATIONS_GLOB_PATTERN),
        staticRoutesPlugin(Object.values(APP_ROUTES).map((route) => route.path)),
    ],
    build: {
        license: { fileName: "THIRD_PARTY_LICENSES.txt" },
    },
    resolve: {
        alias: {
            "@": resolve(__dirname, "src"),
        },
    },
});
