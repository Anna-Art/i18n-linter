import { useState, useMemo, useEffect } from "react";
import type { Language, IssueType } from "../types/glossary";
import { analyzeKeys, getFileKeyCount } from "../data/keyAnalysis";
import { ALL_NAMESPACES } from "../data/namespaces";
import { ALL_LANGUAGES } from "../data/languages";
import {
    readQueryParams,
    writeQueryParams,
    resolveLanguage,
    resolveNamespace,
} from "../data/queryParams";
import { LanguageSwitcher } from "../components/LanguageSwitcher/LanguageSwitcher";
import { FilterBar } from "../components/FilterBar/FilterBar";
import { FileTabs } from "../components/FileTabs/FileTabs";
import { IssuesTable } from "../components/IssuesTable/IssuesTable";

export function KeyValidationPage() {
    // Initialize from query params, resolving to valid values
    const queryParams = readQueryParams();
    const [selectedLanguage, setSelectedLanguage] = useState<Language>(
        resolveLanguage(queryParams.lang, ALL_LANGUAGES),
    );
    const [selectedTypes, setSelectedTypes] = useState<IssueType[]>([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [activeTab, setActiveTab] = useState<string>(
        resolveNamespace(queryParams.namespace, ALL_NAMESPACES),
    );

    // Sync language and namespace to URL
    useEffect(() => {
        writeQueryParams({ lang: selectedLanguage, namespace: activeTab });
    }, [selectedLanguage, activeTab]);

    // Handle browser back/forward navigation
    useEffect(() => {
        const handlePopState = () => {
            const params = readQueryParams();
            setSelectedLanguage(resolveLanguage(params.lang, ALL_LANGUAGES));
            setActiveTab(resolveNamespace(params.namespace, ALL_NAMESPACES));
        };
        window.addEventListener("popstate", handlePopState);
        return () => window.removeEventListener("popstate", handlePopState);
    }, []);

    const issues = useMemo(
        () => analyzeKeys(selectedLanguage),
        [selectedLanguage],
    );

    const keyCounts = useMemo(() => {
        const counts: Record<string, number> = {};
        for (const namespace of ALL_NAMESPACES) {
            counts[namespace] = getFileKeyCount(selectedLanguage, namespace);
        }
        return counts;
    }, [selectedLanguage]);

    // Compute per-namespace counts from the full issues list
    const namespaceCounts = useMemo(() => {
        const counts: Record<string, number> = {};
        for (const namespace of ALL_NAMESPACES) {
            counts[namespace] = 0;
        }
        for (const c of issues) {
            if (counts[c.namespace] !== undefined) {
                counts[c.namespace]++;
            }
        }
        return counts;
    }, [issues]);

    // Compute namespaces that have at least one issue
    const namespacesWithIssues = useMemo(
        () => ALL_NAMESPACES.filter((ns) => (namespaceCounts[ns] ?? 0) > 0),
        [namespaceCounts],
    );

    // Auto-switch active tab if the current one has no issues
    // (e.g., when switching to a language where that namespace is clean)
    const effectiveActiveTab = useMemo(() => {
        if ((namespaceCounts[activeTab] ?? 0) > 0) {
            return activeTab;
        }
        // Fall back to the first file type that has issues
        return namespacesWithIssues[0] ?? activeTab;
    }, [activeTab, namespaceCounts, namespacesWithIssues]);

    // Issues filtered by active tab only (pre-type/search filtering)
    const tabIssues = useMemo(
        () => issues.filter((c) => c.namespace === effectiveActiveTab),
        [issues, effectiveActiveTab],
    );

    // Filter issues by active tab, issue types, and search query
    const filteredIssues = useMemo(() => {
        let result = tabIssues;

        // Filter by issue type — issue matches if ANY of its issueTypes is selected
        if (selectedTypes.length > 0) {
            result = result.filter((c) =>
                c.issueTypes.some((t) => selectedTypes.includes(t)),
            );
        }

        // Filter by search query
        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase();
            result = result.filter(
                (c) =>
                    c.keyPath.toLowerCase().includes(query) ||
                    c.currentValue.toLowerCase().includes(query) ||
                    c.notes.some((n) => n.toLowerCase().includes(query)) ||
                    c.suggestedReplacements.some(
                        (r) => r?.toLowerCase().includes(query) ?? false,
                    ),
            );
        }

        return result;
    }, [tabIssues, selectedTypes, searchQuery]);

    return (
        <div className="page">
            <header className="page__header">
                <h1 className="page__title">Translation Key Validation</h1>
                <p className="page__subtitle">
                    Analysis of translation keys for cross-block references,
                    invalid references, and syntax errors
                </p>
            </header>

            <div className="page__controls">
                <LanguageSwitcher
                    selected={selectedLanguage}
                    onChange={setSelectedLanguage}
                />
                <FilterBar
                    selectedTypes={selectedTypes}
                    onTypesChange={setSelectedTypes}
                    searchQuery={searchQuery}
                    onSearchChange={setSearchQuery}
                    language={selectedLanguage}
                    tabIssues={tabIssues}
                />
            </div>

            <main className="page__content">
                <FileTabs
                    activeTab={effectiveActiveTab}
                    counts={namespaceCounts}
                    onTabChange={setActiveTab}
                />
                <IssuesTable
                    issues={filteredIssues}
                    totalKeys={keyCounts[effectiveActiveTab] ?? 0}
                    namespace={effectiveActiveTab}
                />
            </main>
        </div>
    );
}
