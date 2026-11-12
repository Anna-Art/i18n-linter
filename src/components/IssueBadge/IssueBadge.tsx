import type { IssueType } from "../../types/glossary";
import { ISSUE_TYPE_CONFIG } from "../../data/issueTypeConfig";
import "./IssueBadgeStyles.css";

interface IssueBadgeProps {
    types: IssueType[];
}

export function IssueBadge({ types }: IssueBadgeProps) {
    return (
        <div className="badge-group">
            {types.map((type, i) => {
                const config = ISSUE_TYPE_CONFIG[type];
                return (
                    <span
                        key={i}
                        className={`badge ${config.className}`}
                        title={config.tooltip}
                    >
                        {config.label}
                    </span>
                );
            })}
        </div>
    );
}
