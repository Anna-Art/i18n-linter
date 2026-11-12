import { useState, useMemo, useEffect } from "react";
import type { Language } from "../types/glossary";
import { getNamespaceData } from "../data/translations";
import { ALL_NAMESPACES } from "../data/namespaces";
import { flattenObject } from "../data/analysisUtils";
import { getFileKeyCount } from "../data/keyAnalysis";
import { ALL_LANGUAGES } from "../data/languages";
import {
    readQueryParams,
    writeQueryParams,
    resolveLanguage,
    resolveNamespace,
} from "../data/queryParams";
import { LanguageSwitcher } from "../components/LanguageSwitcher/LanguageSwitcher";
import { initI18n, compileTranslation } from "../data/i18n";
import "./SummaryPageStyles.css";

// Initialize i18next on module load
initI18n();

export function SummaryPage() {
    const queryParams = readQueryParams();
    const [selectedLanguage, setSelectedLanguage] = useState<Language>(
        resolveLanguage(queryParams.lang, ALL_LANGUAGES),
    );
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

    // Get all keys for the current namespace and language
    const allKeys = useMemo(() => {
        const namespace = activeTab;
        const data = getNamespaceData(namespace, selectedLanguage);
        if (!data) return [];

        const inner = data.inner as Record<string, unknown>;
        const flatKeys = flattenObject(inner);

        return flatKeys.map(({ keyPath, value }) => {
            // Use i18next to compile the value (resolves $t() references)
            const compiledValue = compileTranslation(
                namespace,
                keyPath,
                selectedLanguage,
            );
            // Include namespace prefix in the full key path (e.g., "dashboard.navigation.settings")
            const fullKeyPath = `${namespace}.${keyPath}`;
            return { fullKeyPath, value, compiledValue };
        });
    }, [activeTab, selectedLanguage]);

    // Filter by search query
    const filteredKeys = useMemo(() => {
        if (!searchQuery.trim()) return allKeys;

        const query = searchQuery.toLowerCase();
        return allKeys.filter(
            (k) =>
                k.fullKeyPath.toLowerCase().includes(query) ||
                k.value.toLowerCase().includes(query) ||
                k.compiledValue.toLowerCase().includes(query),
        );
    }, [allKeys, searchQuery]);

    return (
        <div className="page">
            <header className="page__header">
                <h1 className="page__title">Translation Summary</h1>
                <p className="page__subtitle">
                    Overview of all translation keys with raw and compiled
                    values
                </p>
            </header>

            <div className="page__controls">
                <LanguageSwitcher
                    selected={selectedLanguage}
                    onChange={setSelectedLanguage}
                />
                <div className="filter-bar">
                    <div className="filter-bar__search">
                        <input
                            type="text"
                            className="filter-bar__input"
                            placeholder="Search by key or value..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                </div>
            </div>

            <main className="page__content">
                <div className="file-tabs">
                    {ALL_NAMESPACES.map((tab) => (
                        <button
                            key={tab}
                            className={`file-tab${activeTab === tab ? " file-tab--active" : ""}`}
                            onClick={() => setActiveTab(tab)}
                            type="button"
                        >
                            <span className="file-tab-label">{tab}</span>
                            <span className="file-tab-count">
                                {getFileKeyCount(selectedLanguage, tab)}
                            </span>
                        </button>
                    ))}
                </div>

                <div className="table-wrapper">
                    <div className="table-summary">
                        Showing <strong>{filteredKeys.length}</strong> key
                        {filteredKeys.length !== 1 ? "s" : ""} out of{" "}
                        <strong>{allKeys.length}</strong> total {activeTab}{" "}
                        keys
                    </div>

                    {filteredKeys.length === 0 ? (
                        <div className="table-empty">
                            <p>
                                {allKeys.length === 0
                                    ? "No translations found for this language."
                                    : "No keys match the search query."}
                            </p>
                        </div>
                    ) : (
                        <table className="summary-table">
                            <thead>
                                <tr>
                                    <th className="th-key">Full Key</th>
                                    <th className="th-value">
                                        Raw Translation
                                    </th>
                                    <th className="th-compiled">
                                        Compiled Translation
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredKeys.map(
                                    ({ fullKeyPath, value, compiledValue }) => (
                                        <tr key={fullKeyPath}>
                                            <td className="td-key">
                                                <code>{fullKeyPath}</code>
                                            </td>
                                            <td className="td-value">
                                                {value}
                                            </td>
                                            <td className="td-compiled">
                                                {compiledValue}
                                            </td>
                                        </tr>
                                    ),
                                )}
                            </tbody>
                        </table>
                    )}
                </div>
            </main>
        </div>
    );
}
