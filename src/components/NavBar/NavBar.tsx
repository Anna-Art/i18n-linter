import { Link, useLocation } from "react-router";
import "./NavBarStyles.css";

const NAV_ITEMS: Array<{ path: string; label: string }> = [
    { path: "/", label: "Overview" },
    { path: "/summary", label: "Summary" },
];

export function NavBar() {
    const location = useLocation();

    return (
        <nav className="navbar">
            <div className="navbar__inner">
                <span className="navbar__brand">Translations Lab</span>
                <div className="navbar__links">
                    {NAV_ITEMS.map(({ path, label }) => {
                        const isActive =
                            location.pathname === path ||
                            (path !== "/" &&
                                location.pathname.startsWith(path));
                        return (
                            <Link
                                key={path}
                                to={path}
                                className={`navbar__link${isActive ? " navbar__link--active" : ""}`}
                            >
                                {label}
                            </Link>
                        );
                    })}
                </div>
            </div>
        </nav>
    );
}
