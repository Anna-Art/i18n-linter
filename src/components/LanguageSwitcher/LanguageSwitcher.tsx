import type { Language } from "../../types/glossary";
import { ALL_LANGUAGES, getLanguageLabel } from "../../data/languages";
import "./LanguageSwitcherStyles.css";

interface LanguageSwitcherProps {
    selected: Language;
    onChange: (lang: Language) => void;
}

export function LanguageSwitcher({
    selected,
    onChange,
}: LanguageSwitcherProps) {
    return (
        <div className="language-switcher">
            <span className="language-switcher__label">
                Dashboard language:
            </span>
            <div className="language-switcher__buttons">
                {ALL_LANGUAGES.map((code) => (
                    <button
                        key={code}
                        className={`language-btn ${selected === code ? "language-btn--active" : ""}`}
                        onClick={() => onChange(code)}
                        title={`Switch to ${getLanguageLabel(code)} dashboard`}
                    >
                        {getLanguageLabel(code)}
                    </button>
                ))}
            </div>
        </div>
    );
}
