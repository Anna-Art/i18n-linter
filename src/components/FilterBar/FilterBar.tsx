import type { IssueType, Language, KeyIssue } from "../../types/glossary";
import { ISSUE_TYPE_CONFIG } from "../../data/issueTypeConfig";
import { isRuleApplicable } from "../../data/rulesUtils";
import "./FilterBarStyles.css";

interface FilterBarProps {
    selectedTypes: IssueType[];
    onTypesChange: (types: IssueType[]) => void;
    searchQuery: string;
    onSearchChange: (query: string) => void;
    language: Language;
    /** The full list of issues for the currently active tab (pre-filtering) */
    tabIssues: KeyIssue[];
}

export function FilterBar({
    selectedTypes,
    onTypesChange,
    searchQuery,
    onSearchChange,
    language,
    tabIssues,
}: FilterBarProps) {
    // Compute which issue types are actually present in the current tab's data
    const availableTypes = new Set<IssueType>();
    for (const issue of tabIssues) {
        for (const t of issue.issueTypes) {
            availableTypes.add(t);
        }
    }

    const toggleType = (type: IssueType) => {
        if (selectedTypes.includes(type)) {
            onTypesChange(selectedTypes.filter((t) => t !== type));
        } else {
            onTypesChange([...selectedTypes, type]);
        }
    };

    const clearFilters = () => {
        onTypesChange([]);
        onSearchChange("");
    };

    const hasActiveFilters = selectedTypes.length > 0 || searchQuery.length > 0;

    return (
        <div className="filter-bar">
            <div className="filter-bar__row">
                <div className="filter-bar__types">
                    <span className="filter-bar__label">Issue type:</span>
                    {Object.entries(ISSUE_TYPE_CONFIG).map(
                        ([value, { label }]) => {
                            const issueType = value as IssueType;
                            // Only show rule-specific buttons when the rule applies to the current language
                            if (
                                issueType === "plural-glossary-ref" &&
                                !isRuleApplicable(
                                    "plural-glossary-ref",
                                    language,
                                )
                            ) {
                                return null;
                            }
                            // Hide buttons for issue types that have no occurrences in the current tab
                            if (!availableTypes.has(issueType)) {
                                return null;
                            }
                            return (
                                <button
                                    key={issueType}
                                    className={`filter-btn ${selectedTypes.includes(issueType) ? "filter-btn--active" : ""}`}
                                    title={ISSUE_TYPE_CONFIG[issueType].tooltip}
                                    onClick={() => toggleType(issueType)}
                                >
                                    {label}
                                </button>
                            );
                        },
                    )}
                </div>
                <div className="filter-bar__search">
                    <input
                        type="text"
                        className="filter-bar__input"
                        placeholder="Search by key path or value..."
                        value={searchQuery}
                        onChange={(e) => onSearchChange(e.target.value)}
                    />
                </div>
            </div>
            {hasActiveFilters && (
                <button className="filter-bar__clear" onClick={clearFilters}>
                    Clear all filters
                </button>
            )}
        </div>
    );
}
