import { Link, useLocation } from "react-router";
import { APP_ROUTES } from "../../data/routes";
import "./NavBarStyles.css";

const NAV_ITEMS = Object.values(APP_ROUTES);

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
