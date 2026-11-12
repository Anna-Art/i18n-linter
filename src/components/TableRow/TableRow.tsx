import type { KeyIssue } from "../../types/glossary";
import { IssueBadge } from "../IssueBadge/IssueBadge";
import { buildNamespacePattern } from "../../data/analysisUtils";
import "./TableRowStyles.css";

interface TableRowProps {
    candidate: KeyIssue;
}

/**
 * Highlight $t() references and hardcoded strings in the value.
 */
function highlightValue(value: string): React.ReactNode {
    // Split by $t(...) patterns
    const parts = value.split(/(\$t\([^)]+\))/g);
    return parts.map((part, i) => {
        if (part.startsWith("$t(")) {
            // This is a reference — highlight in green
            return (
                <span
                    key={i}
                    className="hl-ref"
                    title="Reference to another key"
                >
                    {part}
                </span>
            );
        }
        // Plain text — no highlighting, render as-is
        return part;
    });
}

/**
 * Highlight $t() references and key paths in the note text by wrapping them in <code> tags.
 */
function highlightNote(note: string): React.ReactNode {
    // Build dynamic pattern from all known namespaces
    const nsPattern = buildNamespacePattern();
    const pattern = new RegExp(
        `(\\$t\\([^)]+\\)|\\b(?:${nsPattern}):[\\w.-]+)`,
        "g",
    );
    // Split by $t(...) patterns and namespace:key patterns
    const parts = note.split(pattern);
    return parts.map((part, i) => {
        if (
            part.startsWith("$t(") ||
            new RegExp(`^(?:${nsPattern}):`).test(part)
        ) {
            return <code key={i}>{part}</code>;
        }
        return part;
    });
}

export function TableRow({ candidate }: TableRowProps) {
    const {
        keyPath,
        currentValue,
        issueTypes,
        suggestedReplacements,
        suggestedGlossaryType,
        suggestedKey,
        notes,
    } = candidate;

    return (
        <tr className={`table-row table-row--${issueTypes[0] ?? "ok"}`}>
            <td className="td-key">
                <code>{keyPath}</code>
            </td>
            <td className="td-value">
                <div className="value-display">
                    {highlightValue(currentValue)}
                </div>
            </td>
            <td className="td-issue">
                <IssueBadge types={issueTypes} />
            </td>
            <td className="td-suggestion">
                {suggestedReplacements.map((replacement, i) => (
                    <div key={i} className="suggestion-line">
                        {replacement ? (
                            <code className="suggestion-code">
                                {replacement}
                            </code>
                        ) : (
                            <span className="text-muted">—</span>
                        )}
                    </div>
                ))}
                {suggestedKey && suggestedGlossaryType && (
                    <div className="suggestion-meta">
                        →{" "}
                        <code>
                            {suggestedGlossaryType}:{suggestedKey}
                        </code>
                    </div>
                )}
            </td>
            <td className="td-note">
                <div className="note-list">
                    {notes.map((note, i) => (
                        <div key={i} className="note-line">
                            <span className="note-text">
                                {highlightNote(note)}
                            </span>
                        </div>
                    ))}
                </div>
            </td>
        </tr>
    );
}
