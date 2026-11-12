import { BrowserRouter, Routes, Route, Navigate } from "react-router";
import { KeyValidationPage } from "./pages/KeyValidationPage";
import { SummaryPage } from "./pages/SummaryPage";
import { NavBar } from "./components/NavBar/NavBar";
import { APP_ROUTES } from "./data/routes";
import "./App.css";

function App() {
    return (
        <BrowserRouter basename={import.meta.env.BASE_URL}>
            <NavBar />
            <Routes>
                <Route path={APP_ROUTES.overview.path} element={<KeyValidationPage />} />
                <Route path={APP_ROUTES.summary.path} element={<SummaryPage />} />
                <Route path="*" element={<Navigate to={APP_ROUTES.overview.path} replace />} />
            </Routes>
        </BrowserRouter>
    );
}

export default App;
