import { ALL_NAMESPACES } from "../../data/namespaces";
import "./FileTabsStyles.css";

export type NamespaceTab = string;

interface FileTabsProps {
    activeTab: NamespaceTab;
    counts: Record<string, number>;
    onTabChange: (tab: NamespaceTab) => void;
}

export function FileTabs({ activeTab, counts, onTabChange }: FileTabsProps) {
    // Only show tabs that have at least one issue
    const visibleTabs = ALL_NAMESPACES.filter((tab) => (counts[tab] ?? 0) > 0);

    return (
        <div className="file-tabs">
            {visibleTabs.map((tab) => (
                <button
                    key={tab}
                    className={`file-tab${activeTab === tab ? " file-tab--active" : ""}`}
                    onClick={() => onTabChange(tab)}
                    type="button"
                >
                    <span className="file-tab-label">{tab}</span>
                    <span className="file-tab-count">{counts[tab] ?? 0}</span>
                </button>
            ))}
        </div>
    );
}
