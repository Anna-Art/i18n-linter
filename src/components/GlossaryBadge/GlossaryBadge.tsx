import { getLanguageLabel } from "../../data/languages";
import "./GlossaryBadgeStyles.css";

interface GlossaryBadgeProps {
    exists: boolean;
    label: string;
}

export function GlossaryBadge({ exists, label }: GlossaryBadgeProps) {
    return (
        <span
            className={`glossary-badge ${exists ? "glossary-badge--yes" : "glossary-badge--no"}`}
            title={
                exists ? `Key exists in ${label}` : `Key missing in ${label}`
            }
        >
            {exists ? "✅" : "❌"} {getLanguageLabel(label)}
        </span>
    );
}
