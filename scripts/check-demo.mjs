import assert from "node:assert/strict";
import { createLogger, createServer } from "vite";

// Use the real Vite loader so this also verifies glob replacement and discovery.
const errors = [];
const logger = createLogger();
const logError = logger.error.bind(logger);
logger.error = (message, options) => {
    errors.push(message);
    logError(message, options);
};
const server = await createServer({
    customLogger: logger,
    server: { middlewareMode: true, ws: false, watch: null },
    appType: "custom",
});

try {
    const { ALL_LANGUAGES } = await server.ssrLoadModule("/src/data/languages.ts");
    const { ALL_NAMESPACES, getNamespaceData } = await server.ssrLoadModule("/src/data/translations.ts");
    const { analyzeKeys, getKeyCount } = await server.ssrLoadModule("/src/data/keyAnalysis.ts");
    const { ISSUE_TYPE_CONFIG } = await server.ssrLoadModule("/src/data/issueTypeConfig.ts");
    const { initI18n, compileTranslation } = await server.ssrLoadModule("/src/data/i18n.ts");
    const { flattenObject } = await server.ssrLoadModule("/src/data/analysisUtils.ts");

    assert.deepEqual(ALL_LANGUAGES, ["en", "es", "ru", "tr", "zh"]);
    assert.deepEqual(ALL_NAMESPACES, ["adj", "common", "dashboard", "entities", "glossary", "report", "ui"]);
    initI18n();
    const covered = new Set();
    for (const language of ALL_LANGUAGES) {
        const issues = analyzeKeys(language);
        const expected = [
            ["dashboard.demo.missing-key", "wrong-key"],
            ["dashboard.demo.typo", "typo"],
            ["dashboard.demo.missing-dollar", "syntax-error"],
            ["dashboard.demo.missing-parenthesis", "syntax-error"],
            ["dashboard.demo.empty-namespace", "syntax-error"],
            ["dashboard.demo.empty-key", "syntax-error"],
            ["dashboard.demo.redundant-modifier", "redundant-modifier"],
            ["ui.demo.cross-reference", "cross-block-ref"],
            ["adj.reference-demo", "cross-block-ref"],
            ["entities.z-order", "key-ordering"],
        ];
        if (language !== "en") expected.push(["dashboard.demo.fallback", "missing-in-lang"]);
        if (language === "en") expected.push(["dashboard.demo.hardcoded-term", "hardcoded-glossary-term"]);
        if (language === "zh") expected.push(["dashboard.demo.plural-reference", "plural-glossary-ref"]);

        for (const [key, type] of expected) {
            assert(issues.some(issue => issue.keyPath === key && issue.issueTypes.includes(type)), `${language}: expected ${type} at ${key}`);
            covered.add(type);
        }
        assert(issues.some(issue => issue.keyPath.startsWith("dashboard.demo.invalid_") && issue.issueTypes.includes("invalid-plural-context")), `${language}: missing invalid plural demo`);
        covered.add("invalid-plural-context");
        assert(!issues.some(issue => issue.keyPath.startsWith("dashboard.valid.")), `${language}: valid examples must be clean`);
        assert(issues.find(issue => issue.keyPath === "dashboard.demo.typo").suggestedReplacements.includes("$t(glossary:product)"));

        const glossary = getNamespaceData("glossary", language).inner;
        const basketLabel = language === "zh" ? glossary.basket : glossary.basket.charAt(0).toUpperCase() + glossary.basket.slice(1);
        assert.equal(compileTranslation("dashboard", "valid.nested-reference", language), basketLabel);
        assert.equal(compileTranslation("dashboard", "demo.fallback", language), "return window");
        assert.equal(compileTranslation("dashboard", "valid.local-reference", language), getNamespaceData("dashboard", language).inner.brand);
        assert.equal(compileTranslation("dashboard", "checkout.steps[0]", language), getNamespaceData("dashboard", language).inner.checkout.steps[0]);

        // Summary compiles every value, including intentionally malformed references.
        for (const namespace of ALL_NAMESPACES) {
            for (const { keyPath } of flattenObject(getNamespaceData(namespace, language).inner)) {
                assert.equal(typeof compileTranslation(namespace, keyPath, language), "string");
            }
        }
        console.log(`${language}: ${getKeyCount(language)} keys, ${issues.length} issue rows; expected examples verified`);
    }
    assert.deepEqual([...covered].sort(), Object.keys(ISSUE_TYPE_CONFIG).sort(), "Every configured issue type needs a demo");
    assert.equal(getNamespaceData("not-a-namespace", "en"), null);
    console.log(`Verified all ${covered.size} issue types, clean examples, and Summary compilation.`);
} finally {
    await server.close();
}
assert.deepEqual(errors, [], "Vite must load the demo without server or dependency scan errors");
